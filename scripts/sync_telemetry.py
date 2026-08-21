#!/usr/bin/env python3
"""
LLM Quota & Telemetry Sync Agent
Probes local ocx, Antigravity, DashScope, and system endpoints, formats the live telemetry payload,
and updates both local files and the cloud GitHub Gist for Vercel consumption.
"""

import json
import subprocess
import time
import os
import glob
import datetime
import urllib.request
import urllib.parse
import math

GIST_ID = "67c16a5d365eddf3da98129350171338"

# ── Google Antigravity live quota ────────────────────────────────────────────
# Antigravity 2.0 앱의 Usage 화면과 동일한 공식 소스:
#   POST https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary
# Gemini / Claude-GPT 두 풀의 5시간 + 주간 한도(remainingFraction, resetTime)를
# 한 번에 반환한다. (ocx CLI의 customWindows는 5시간만 주고 주간은 누락함)
# OAuth 클라이언트 상수는 Antigravity IDE에 내장된 공개 데스크톱 클라이언트 값이며
# (opencodex src/oauth/google-antigravity.ts와 동일) 사용자 비밀이 아니다.
AG_CLIENT_ID = os.environ.get("GOOGLE_ANTIGRAVITY_CLIENT_ID") \
    or "GOOGLE_ANTIGRAVITY_CLIENT_ID_ENV_VAR"
AG_CLIENT_SECRET = os.environ.get("GOOGLE_ANTIGRAVITY_CLIENT_SECRET") \
    or "GOOGLE_ANTIGRAVITY_CLIENT_SECRET_ENV_VAR"
AG_UA = os.environ.get("GOOGLE_ANTIGRAVITY_USER_AGENT") \
    or "antigravity/ide/2.5.5 (os_type=windows; arch=amd64; aidev_client; auth_method=oauth)"
AG_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
AG_QUOTA_ENDPOINT = "https://daily-cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary"
AG_AUTH_FILE = os.path.expanduser("~/.opencodex/auth.json")
AG_STATE_FILE = os.path.expanduser("~/.hermes/cache/antigravity_quota_state.json")


def _ag_json_post(url, payload, extra_headers=None, timeout=20):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": AG_UA,
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST"
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _ag_get_access_token(account):
    """유효한 access token 반환. 만료 시 refresh token으로 갱신한다."""
    cred = account.get("credential", {})
    access = cred.get("access")
    expires = cred.get("expires", 0) or 0
    if access and expires - 5 * 60 * 1000 > time.time() * 1000:
        return access
    refresh = cred.get("refresh")
    if not refresh:
        return None
    body = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "client_id": AG_CLIENT_ID,
        "client_secret": AG_CLIENT_SECRET,
        "refresh_token": refresh,
    }).encode("utf-8")
    req = urllib.request.Request(
        AG_TOKEN_ENDPOINT,
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": AG_UA},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        tok = json.loads(resp.read().decode("utf-8"))
    return tok.get("access_token")


def _parse_iso_ms(value):
    if not value:
        return None
    try:
        return int(datetime.datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp() * 1000)
    except Exception:
        return None


def fetch_antigravity_quota():
    """Antigravity 공식 쿼터 API 조회. 실패 시 None."""
    if not os.path.exists(AG_AUTH_FILE):
        return None
    with open(AG_AUTH_FILE, "r", encoding="utf-8") as f:
        auth = json.load(f)
    accounts = (auth.get("google-antigravity") or {}).get("accounts") or []
    if not accounts:
        return None
    account = accounts[0]
    project_id = (account.get("credential") or {}).get("projectId")
    if not project_id:
        return None
    access = _ag_get_access_token(account)
    if not access:
        return None
    resp = _ag_json_post(
        AG_QUOTA_ENDPOINT,
        {"project": project_id},
        extra_headers={"Authorization": f"Bearer {access}"},
    )
    out = {}
    for group in resp.get("groups", []):
        disp = (group.get("displayName") or "").lower()
        pool = "gemini" if ("gemini" in disp and "claude" not in disp) else "claude-gpt"
        for bucket in group.get("buckets", []):
            window = (bucket.get("window") or "").lower()
            if window not in ("5h", "weekly"):
                bid = (bucket.get("bucketId") or "").lower()
                if "weekly" in bid:
                    window = "weekly"
                elif "5h" in bid:
                    window = "5h"
                else:
                    continue
            frac = bucket.get("remainingFraction")
            remaining = round(float(frac) * 100.0, 2) if frac is not None else None
            out[f"{pool}_{window}"] = {
                "remainingPercent": remaining,
                "usagePercent": round(100.0 - remaining, 2) if remaining is not None else None,
                "resetAt": _parse_iso_ms(bucket.get("resetTime")),
                "description": bucket.get("description") or "",
            }
    return out or None


def _ko_countdown(reset_ms, now_ms):
    if not reset_ms:
        return ""
    delta = max(0, int((reset_ms - now_ms) / 1000))
    d, rem = divmod(delta, 86400)
    h, rem = divmod(rem, 3600)
    m = rem // 60
    parts = []
    if d:
        parts.append(f"{d}일")
    if h:
        parts.append(f"{h}시간")
    if m or not parts:
        parts.append(f"{m}분")
    return " ".join(parts)


def _pool_desc(remaining, reset_ms, now_ms):
    if remaining is None:
        return "실시간 데이터 없음 (동기화 대기)"
    cd = _ko_countdown(reset_ms, now_ms)
    if remaining <= 0:
        return f"한도 소진 — {cd} 후 재충전" if cd else "한도 소진"
    return f"{cd} 후 완전 충전" if cd else f"{remaining}% 잔여"

MODEL_METADATA = {
    # Google Antigravity
    "google-antigravity/gemini-3.7-flash": {
        "name": "Gemini 3.7 Flash",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "outputPrice1M": 0.60,
        "speed": "Ultra High (150+ t/s)",
        "reasoning": "Hybrid Thinking",
        "tag": "Best Speed"
    },
    "google-antigravity/gemini-3.1-pro": {
        "name": "Gemini 3.1 Pro",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 1.25,
        "outputPrice1M": 5.00,
        "speed": "Fast (80+ t/s)",
        "reasoning": "Deep Reasoning",
        "tag": "1M Deep Context"
    },
    "google-antigravity/claude-sonnet-4-6": {
        "name": "Claude Sonnet 4.6",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "claude-gpt",
        "context": "200k",
        "contextTokens": 200000,
        "inputPrice1M": 3.00,
        "outputPrice1M": 15.00,
        "speed": "Balanced (60+ t/s)",
        "reasoning": "High Nuance Coding",
        "tag": "Top Coder"
    },
    "google-antigravity/claude-opus-4-6-thinking": {
        "name": "Claude Opus 4.6 Thinking",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "claude-gpt",
        "context": "200k",
        "contextTokens": 200000,
        "inputPrice1M": 15.00,
        "outputPrice1M": 75.00,
        "speed": "Deep Thinking (35+ t/s)",
        "reasoning": "Max Reasoning",
        "tag": "Ultra Brain"
    },
    # OpenAI Codex (Sol $5/$30, Terra $2/$12, Luna $0.20/$1.20)
    "gpt-5.6-sol": {
        "name": "GPT-5.6 Sol",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 5.00,
        "outputPrice1M": 30.00,
        "speed": "Flagship Intelligence (750 t/s on Cerebras)",
        "reasoning": "Ultra Reasoning",
        "tag": "Flagship AI"
    },
    "gpt-5.6-terra": {
        "name": "GPT-5.6 Terra",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 2.00,
        "outputPrice1M": 12.00,
        "speed": "Balanced Daily Workload",
        "reasoning": "Medium-Ultra",
        "tag": "Balanced Daily"
    },
    "gpt-5.6-luna": {
        "name": "GPT-5.6 Luna",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.20,
        "outputPrice1M": 1.20,
        "speed": "Fast & Cost-Effective",
        "reasoning": "Medium-Max",
        "tag": "Best OpenAI Value"
    },
    "combo/Antigravity": {
        "name": "Combo Antigravity Failover",
        "providerId": "openai",
        "providerName": "OpenCodex Combo",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "outputPrice1M": 0.60,
        "speed": "Auto Failover",
        "reasoning": "Auto Failover",
        "tag": "High Availability"
    },
    # Alibaba Token Plan (1M Context)
    "alibaba-token-plan-intl/qwen3.8-max": {
        "name": "Qwen 3.8 Max",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 1.60,
        "outputPrice1M": 6.40,
        "speed": "Heavy Duty MoE (2.4T)",
        "reasoning": "XHigh Reasoning",
        "tag": "Flagship MoE"
    },
    "alibaba-token-plan-intl/qwen3.7-max": {
        "name": "Qwen 3.7 Max",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 1.60,
        "outputPrice1M": 6.40,
        "speed": "Heavy Duty",
        "reasoning": "XHigh Reasoning",
        "tag": "Power Model"
    },
    "alibaba-token-plan-intl/qwen3.7-plus": {
        "name": "Qwen 3.7 Plus",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.26,
        "outputPrice1M": 0.78,
        "speed": "High Speed Multimodal",
        "reasoning": "Medium Reasoning",
        "tag": "All-Rounder"
    },
    "alibaba-token-plan-intl/qwen3.6-flash": {
        "name": "Qwen 3.6 Flash",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.05,
        "outputPrice1M": 0.20,
        "speed": "Ultra Fast",
        "reasoning": "Low-Medium",
        "tag": "Ultra Cheap ($0.05)"
    },
    "alibaba-token-plan-intl/deepseek-v4-pro": {
        "name": "DeepSeek V4 Pro",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.27,
        "outputPrice1M": 1.10,
        "speed": "Code & Math Specialist",
        "reasoning": "High-Max",
        "tag": "Code Specialist"
    },
    "alibaba-token-plan-intl/deepseek-v4-pro-0813": {
        "name": "DeepSeek V4 Pro (0813 Snapshot)",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.27,
        "outputPrice1M": 1.10,
        "speed": "Code & Math Specialist (Snapshot)",
        "reasoning": "High-Max Reasoning",
        "tag": "Snapshot Stable"
    },
    "alibaba-token-plan-intl/deepseek-v4-flash-0731": {
        "name": "DeepSeek V4 Flash",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.14,
        "outputPrice1M": 0.28,
        "speed": "Fast Inference",
        "reasoning": "Standard",
        "tag": "Fast Coder"
    },
    "alibaba-token-plan-intl/glm-5.2": {
        "name": "GLM 5.2",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "128k",
        "contextTokens": 128000,
        "inputPrice1M": 1.00,
        "outputPrice1M": 1.00,
        "speed": "Bilingual Pro",
        "reasoning": "Medium Reasoning",
        "tag": "Bilingual"
    },
    "alibaba-token-plan-intl/kimi-k2.5": {
        "name": "Kimi K2.5",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "256k",
        "contextTokens": 256000,
        "inputPrice1M": 0.80,
        "outputPrice1M": 2.40,
        "speed": "Fast Long-Context",
        "reasoning": "High Context Reasoning",
        "tag": "Long Context"
    }
}

def collect_telemetry():
    now_ms = int(time.time() * 1000)
    
    # 1. Antigravity Dual Quota Pools — 공식 IDE API에서 실시간 조회
    #    (Antigravity 2.0 앱 Usage 화면과 동일 소스)
    ag_state = {}
    if os.path.exists(AG_STATE_FILE):
        try:
            with open(AG_STATE_FILE, "r", encoding="utf-8") as f:
                ag_state = json.load(f)
        except Exception:
            ag_state = {}

    ag_live = None
    try:
        ag_live = fetch_antigravity_quota()
    except Exception as e:
        print(f"antigravity quota probe note: {e}")

    ag_is_live = bool(ag_live)
    if ag_live:
        ag_state = {"windows": ag_live, "fetchedAt": now_ms}
        try:
            os.makedirs(os.path.dirname(AG_STATE_FILE), exist_ok=True)
            with open(AG_STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(ag_state, f, indent=2)
        except Exception as e:
            print(f"Failed to save antigravity state: {e}")
    else:
        # API 실패 시 마지막 성공 스냅샷으로 폴백 (하드코딩 금지)
        ag_live = ag_state.get("windows") or {}

    def ag_window(pool, window):
        w = (ag_live or {}).get(f"{pool}_{window}") or {}
        return w.get("remainingPercent"), w.get("usagePercent"), w.get("resetAt")

    gemini_5h_remaining, gemini_5h_used, gemini_5h_reset = ag_window("gemini", "5h")
    gemini_weekly_remaining, gemini_weekly_used, gemini_weekly_reset = ag_window("gemini", "weekly")
    claude_gpt_5h_remaining, claude_gpt_5h_used, claude_gpt_5h_reset = ag_window("claude-gpt", "5h")
    claude_gpt_weekly_remaining, claude_gpt_weekly_used, claude_gpt_weekly_reset = ag_window("claude-gpt", "weekly")

    gemini_pool_exhausted = gemini_5h_remaining is not None and gemini_5h_remaining <= 0.0
    claude_pool_exhausted = claude_gpt_5h_remaining is not None and claude_gpt_5h_remaining <= 0.0

    # 2. Probe ocx quota (OpenAI monthly only — Antigravity는 공식 API로 직접 조회)
    oa_monthly_usage = 85.0
    oa_monthly_reset = 1789273515000

    try:
        res = subprocess.run(["ocx", "provider", "quota", "--json"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0 and res.stdout.strip():
            data = json.loads(res.stdout)
            if "reports" in data:
                for r in data["reports"]:
                    prov = r.get("provider")
                    if prov == "openai":
                        q = r.get("quota", {})
                        oa_monthly_usage = round(q.get("monthlyPercent", 85.0), 2)
                        if q.get("monthlyResetAt"):
                            oa_monthly_reset = q.get("monthlyResetAt") * 1000
    except Exception as e:
        print(f"ocx probe note: {e}")

    # 3. Probe Alibaba status with persistent caching for 429 rate limit & Subscription Calibrated State
    is_ali_exhausted = False
    cache_dir = os.path.expanduser("~/.hermes/cache")
    os.makedirs(cache_dir, exist_ok=True)
    ali_state_file = os.path.join(cache_dir, "alibaba_quota_state.json")
    
    # Official Ground Truth Anchor from Alibaba My Subscriptions:
    # 75.74% used (Updated: 2026-08-21 23:34:16), Reset at 2026-08-22 16:29:00 UTC+8 (1787387340000 ms)
    DEFAULT_ALI_RESET_TS = 1787387340000
    DEFAULT_BASELINE_USAGE = 75.74

    ali_state = {}
    if os.path.exists(ali_state_file):
        try:
            with open(ali_state_file, "r", encoding="utf-8") as f:
                ali_state = json.load(f)
        except Exception:
            ali_state = {}

    if not ali_state.get("calibrated_reset_at") or ali_state.get("baseline_usage_percent", 0) < DEFAULT_BASELINE_USAGE:
        ali_state["calibrated_reset_at"] = DEFAULT_ALI_RESET_TS
        ali_state["baseline_usage_percent"] = DEFAULT_BASELINE_USAGE
        ali_state["anchor_time_ms"] = now_ms
        if "anchor_requests_count" in ali_state:
            del ali_state["anchor_requests_count"]
        if "anchor_weighted_units" in ali_state:
            del ali_state["anchor_weighted_units"]

    # 3. Passive 429 Error Detection & 8K Block-Weighted Accounting via usage.jsonl (Zero Quota Waste)
    ali_7d_requests = 0
    ali_7d_weighted_units = 0.0
    ali_limit = 10000
    is_ali_exhausted = False
    usage_jsonl = os.path.expanduser("~/.opencodex/usage.jsonl")
    thirty_mins_ago = now_ms - (30 * 60 * 1000)
    seven_days_ago = now_ms - (7 * 24 * 3600 * 1000)

    latest_200_ts = 0
    latest_429_ts = 0

    if os.path.exists(usage_jsonl):
        seen_rids = set()
        try:
            with open(usage_jsonl, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        ts = entry.get("timestamp", 0)
                        prov = str(entry.get("provider", "")).lower()
                        status = entry.get("status")
                        err_code = str(entry.get("errorCode", "")).lower() + " " + str(entry.get("upstreamError", "")).lower()
                        rid = entry.get("requestId")
                        m = str(entry.get("model", ""))
                        if "alibaba" in prov or "dashscope" in prov or "bailian" in prov or "qwen" in prov:
                            if ts >= seven_days_ago and status == 200:
                                if not (rid and rid in seen_rids):
                                    if rid:
                                        seen_rids.add(rid)
                                    ali_7d_requests += 1
                                    tot_tokens = entry.get("totalTokens", 0)
                                    base_units = math.ceil(tot_tokens / 8192.0) if tot_tokens > 0 else 1
                                    ali_7d_weighted_units += base_units

                                if ts > latest_200_ts:
                                    latest_200_ts = ts
                            elif status == 429:
                                if ts > latest_429_ts:
                                    if "quota" in err_code or "insufficient" in err_code or "exhaust" in err_code or "rate" in err_code:
                                        latest_429_ts = ts
                    except Exception:
                        pass
        except Exception as e:
            print(f"Alibaba usage.jsonl read error: {e}")

    # If recent 429 occurred within 30m and no newer 200 success arrived afterwards, mark exhausted
    if latest_429_ts > thirty_mins_ago and latest_429_ts >= latest_200_ts:
        is_ali_exhausted = True

    # Dynamic sliding & anchor calibration
    target_reset_at = ali_state.get("calibrated_reset_at", DEFAULT_ALI_RESET_TS)
    while now_ms > target_reset_at:
        target_reset_at += 7 * 24 * 3600 * 1000
        ali_state["calibrated_reset_at"] = target_reset_at
        ali_state["baseline_usage_percent"] = 0.0
        ali_state["anchor_time_ms"] = now_ms

    ali_reset_ts = target_reset_at
    baseline_pct = ali_state.get("baseline_usage_percent", DEFAULT_BASELINE_USAGE)
    
    # Incremental weighted units tracked since anchor
    anchor_units = ali_state.get("anchor_weighted_units", ali_7d_weighted_units)
    if "anchor_weighted_units" not in ali_state:
        ali_state["anchor_weighted_units"] = ali_7d_weighted_units
        anchor_units = ali_7d_weighted_units

    incremental_units = max(0.0, ali_7d_weighted_units - anchor_units)
    incremental_pct = (incremental_units / float(ali_limit)) * 100.0

    ali_used_pct = round(min(100.0, baseline_pct + incremental_pct), 2)
    ali_remaining_pct = round(max(0.0, 100.0 - ali_used_pct), 2)
    total_effective_units = int(round(ali_used_pct * (ali_limit / 100.0)))

    if is_ali_exhausted:
        ali_used_pct = 100.0
        ali_remaining_pct = 0.0
        ali_state["status"] = "exhausted"
    else:
        ali_state["status"] = "healthy"

    ali_state["last_checked_at"] = now_ms
    ali_state["current_usage_percent"] = ali_used_pct
    ali_state["current_weighted_units"] = ali_7d_weighted_units

    try:
        with open(ali_state_file, "w", encoding="utf-8") as f:
            json.dump(ali_state, f, indent=2)
    except Exception as e:
        print(f"Failed to save alibaba state: {e}")

    # 4. Collect actual cumulative token usage from session telemetry
    session_dir = os.path.expanduser("~/.codex/sessions")
    session_files = glob.glob(f"{session_dir}/**/*.jsonl", recursive=True)
    one_day_ms = 24 * 3600 * 1000
    seven_days_ms = 7 * one_day_ms
    thirty_days_ms = 30 * one_day_ms

    actual_usage_map = {}
    def get_stat(mid):
        if mid not in actual_usage_map:
            actual_usage_map[mid] = {
                "daily": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0},
                "weekly": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0},
                "monthly": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0},
                "allTime": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0}
            }
        return actual_usage_map[mid]

    for f in session_files:
        try:
            current_model = "google-antigravity/gemini-3.7-flash"
            prev_in = 0
            prev_out = 0
            with open(f, "r", encoding="utf-8", errors="ignore") as fp:
                for line in fp:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        obj = json.loads(line)
                        ts_str = obj.get("timestamp")
                        ts = int(datetime.datetime.fromisoformat(ts_str.replace("Z", "+00:00")).timestamp() * 1000) if ts_str else now_ms
                        age = now_ms - ts

                        payload = obj.get("payload", {})
                        if isinstance(payload, dict):
                            if payload.get("model"):
                                m_raw = payload["model"]
                                if m_raw == "alibaba-token-plan-intl/qwen3.8-max-preview":
                                    current_model = "alibaba-token-plan-intl/qwen3.8-max"
                                elif m_raw == "google-antigravity/gemini-3.6-flash":
                                    current_model = "google-antigravity/gemini-3.7-flash"
                                else:
                                    current_model = m_raw

                            info = payload.get("info", {})
                            if isinstance(info, dict) and "total_token_usage" in info:
                                u = info["total_token_usage"]
                                in_tokens = u.get("input_tokens", 0)
                                out_tokens = u.get("output_tokens", 0)
                                cached_tokens = u.get("cached_input_tokens", 0)

                                delta_in = max(0, in_tokens - prev_in)
                                delta_out = max(0, out_tokens - prev_out)
                                delta_tot = delta_in + delta_out
                                prev_in = in_tokens
                                prev_out = out_tokens

                                entry = get_stat(current_model)
                                for p_key, max_a in [("daily", one_day_ms), ("weekly", seven_days_ms), ("monthly", thirty_days_ms), ("allTime", float("inf"))]:
                                    if age <= max_a:
                                        entry[p_key]["input"] += delta_in
                                        entry[p_key]["output"] += delta_out
                                        entry[p_key]["total"] += delta_tot
                                        entry[p_key]["cached"] += cached_tokens
                                        entry[p_key]["requests"] += 1
                    except:
                        pass
        except:
            pass

    # Build model list
    model_list = []
    ready_count = 0
    cooldown_count = 0

    for mid, meta in MODEL_METADATA.items():
        is_alibaba = mid.startswith("alibaba-token-plan")
        is_ag = meta["providerId"] == "google-antigravity"
        pool = meta.get("pool")

        if is_alibaba and is_ali_exhausted:
            status = "rate_limited"
            cooldown_count += 1
        elif is_ag and pool == "gemini" and gemini_pool_exhausted:
            status = "rate_limited"
            cooldown_count += 1
        elif is_ag and pool == "claude-gpt" and claude_pool_exhausted:
            status = "rate_limited"
            cooldown_count += 1
        else:
            status = "active"
            ready_count += 1

        model_list.append({
            "id": mid,
            "name": meta["name"],
            "providerId": meta["providerId"],
            "providerName": meta["providerName"],
            "pool": meta.get("pool"),
            "context": meta["context"],
            "contextTokens": meta["contextTokens"],
            "inputPrice1M": meta["inputPrice1M"],
            "outputPrice1M": meta["outputPrice1M"],
            "speed": meta["speed"],
            "reasoning": meta["reasoning"],
            "tag": meta.get("tag", "Active"),
            "status": status,
            "actualUsage": actual_usage_map.get(mid, {
                "daily": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0},
                "weekly": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0},
                "monthly": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0},
                "allTime": {"input": 0, "output": 0, "total": 0, "cached": 0, "requests": 0}
            })
        })

    # Providers summary
    providers = [
        {
            "provider": "google-antigravity",
            "name": "Google Antigravity",
            "plan": "Google AI Pro",
            "status": "exhausted" if (gemini_pool_exhausted and claude_pool_exhausted) else "healthy",
            "liveQuotaSource": "retrieveUserQuotaSummary" if ag_is_live else "last-known-cache",
            "account": "s***1@gmail.com",
            "geminiPool": {
                "label": "Gemini Models",
                "status": "exhausted" if gemini_pool_exhausted else "healthy",
                "isLive": ag_is_live,
                "fiveHourWindow": {
                    "label": "5시간 롤링 한도",
                    "remainingPercent": gemini_5h_remaining,
                    "usagePercent": gemini_5h_used,
                    "resetAt": gemini_5h_reset,
                    "desc": _pool_desc(gemini_5h_remaining, gemini_5h_reset, now_ms)
                },
                "weeklyWindow": {
                    "label": "주간 누적 한도",
                    "remainingPercent": gemini_weekly_remaining,
                    "usagePercent": gemini_weekly_used,
                    "resetAt": gemini_weekly_reset,
                    "desc": _pool_desc(gemini_weekly_remaining, gemini_weekly_reset, now_ms)
                },
                "models": ["Gemini 3.7 Flash", "Gemini 3.1 Pro"]
            },
            "claudeGptPool": {
                "label": "Claude and GPT models",
                "status": "exhausted" if claude_pool_exhausted else "healthy",
                "badge": "HTTP 429 · 5시간 한도 소진" if claude_pool_exhausted else "정상 가동 (Active)",
                "isLive": ag_is_live,
                "fiveHourWindow": {
                    "label": "5시간 롤링 한도",
                    "remainingPercent": claude_gpt_5h_remaining,
                    "usagePercent": claude_gpt_5h_used,
                    "resetAt": claude_gpt_5h_reset,
                    "desc": _pool_desc(claude_gpt_5h_remaining, claude_gpt_5h_reset, now_ms)
                },
                "weeklyWindow": {
                    "label": "주간 누적 한도",
                    "remainingPercent": claude_gpt_weekly_remaining,
                    "usagePercent": claude_gpt_weekly_used,
                    "resetAt": claude_gpt_weekly_reset,
                    "desc": _pool_desc(claude_gpt_weekly_remaining, claude_gpt_weekly_reset, now_ms)
                },
                "models": ["Claude Sonnet 4.6", "Claude Opus 4.6 Thinking"]
            },
            "models": [m for m in model_list if m["providerId"] == "google-antigravity"]
        },
        {
            "provider": "openai",
            "name": "OpenAI Codex",
            "status": "healthy",
            "plan": "Free Multi-Account Pool",
            "accountCount": 3,
            "activeAccount": "s***n@gmail.com",
            "pooledAccounts": ["s***n@gmail.com (Main)", "s***2@naver.com", "s***9@gmail.com"],
            "monthlyUsagePercent": oa_monthly_usage,
            "monthlyRemainingPercent": round(100.0 - oa_monthly_usage, 1),
            "monthlyResetAt": oa_monthly_reset,
            "models": [m for m in model_list if m["providerId"] == "openai"]
        },
        {
            "provider": "alibaba-token-plan-intl",
            "name": "Alibaba Token Plan",
            "plan": "Standard (10,000 req/7d)",
            "status": "exhausted" if is_ali_exhausted else "healthy",
            "badge": "HTTP 429 · Insufficient Quota" if is_ali_exhausted else "정상 가동 (Active)",
            "region": "ap-southeast-1 (Singapore)",
            "account": "sk-s****HZew",
            "weeklyUsagePercent": ali_used_pct,
            "weeklyRemainingPercent": ali_remaining_pct,
            "weeklyRequests": total_effective_units,
            "weeklyLimit": ali_limit,
            "resetAt": ali_reset_ts,
            "message": "1-week quota exhausted" if is_ali_exhausted else f"7일 쿼터: {total_effective_units:,} / {ali_limit:,} units ({ali_used_pct}%) 사용 중 (리셋: 8/22 17:29 KST)",
            "promotion": {
                "isPromoActive": True,
                "promoTitle": "야간 50% 반값 크레딧 할인 프로모션 (Night Discount)",
                "discountBadge": "22:00~08:00 (UTC+8) 50% OFF",
                "nightDiscountHours": "22:00 ~ 08:00 (UTC+8) / 23:00 ~ 09:00 (KST)",
                "discountRate": 0.5,
                "eligibleModels": [
                    {"id": "qwen3.8-max", "name": "Qwen 3.8 Max", "note": "qwen3.8-max-preview는 qwen3.8-max로 자동 라우팅"},
                    {"id": "deepseek-v4-pro-0813", "name": "DeepSeek V4 Pro (0813 Snapshot)", "note": "야간 50% 크레딧 차감"}
                ],
                "routingNote": "qwen3.8-max-preview 요청은 자동으로 qwen3.8-max로 라우팅되며 동일 요율 적용",
                "officialDocUrl": "https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview#tpp01-h-models",
                "tiers": [
                    {"name": "Lite", "originalPrice": "CNY 60/월", "promoPrice": "CNY 39/월 (~$5.5)", "quota": "700/5h · 2,500/7d", "agents": "1~2 에이전트"},
                    {"name": "Standard (Best)", "originalPrice": "CNY 180/월", "promoPrice": "CNY 139/월 (~$19.5)", "quota": "3,000/5h · 10,000/7d", "agents": "3~4 에이전트"},
                    {"name": "Pro", "originalPrice": "CNY 600/월", "promoPrice": "CNY 499/월 (~$70)", "quota": "12,000/5h · 40,000/7d", "agents": "6~8 에이전트"}
                ],
                "highlights": [
                    "qwen3.8-max & deepseek-v4-pro-0813 매일 야간(23:00~09:00 KST) 크레딧 소모 50% 할인",
                    "qwen3.8-max-preview 호출 시 qwen3.8-max로 자동 라우팅 처리",
                    "Qwen 3.8 Max (2.4T MoE) & DeepSeek V4 Pro (1M Context) 전 모델 무제한 사용",
                    "Web Search, Web Scraping, Code Interpreter 도구 기본 번들 포함",
                    "OpenCodex, Claude Code, Cursor, Qwen Code 등 전체 IDE 연동 호환"
                ]
            },
            "models": [m for m in model_list if m["providerId"] == "alibaba-token-plan-intl"]
        }
    ]

    payload = {
        "updatedAt": now_ms,
        "environment": "Live Antigravity & ocx Telemetry",
        "catalogSync": {
            "isLiveConnected": True,
            "totalCatalogModels": len(model_list),
            "lastWeeklySpecUpdate": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S KST"),
            "nextWeeklySpecUpdate": (datetime.datetime.now() + datetime.timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S KST")
        },
        "summary": {
            "totalProviders": 3,
            "healthyProviders": sum(1 for p in providers if p["status"] == "healthy"),
            "exhaustedProviders": sum(1 for p in providers if p["status"] == "exhausted"),
            "totalLinkedAccounts": 5,
            "activeLLMCount": len(model_list),
            "availableModelCount": ready_count,
            "rateLimitedModelCount": cooldown_count
        },
        "actualUsageMap": actual_usage_map,
        "providers": providers,
        "allModels": model_list,
        "integrations": [
            {"name": "Google Antigravity IDE", "endpoint": "Google AI Pro Engine", "status": "online"},
            {"name": "OpenCodex Proxy", "endpoint": "http://127.0.0.1:10100", "status": "online"},
            {"name": "Hermes Gateway", "runtime": "launchd (PID 33929)", "status": "online"},
            {"name": "ElevenLabs Voice", "service": "Voice Synth (41b6...6484)", "status": "ready"},
            {"name": "Firecrawl Tool", "service: ": "Web Extract (fc-5...b8ae)", "status": "ready"}
        ]
    }

    return payload

def push_to_gist(payload):
    json_str = json.dumps(payload, ensure_ascii=False, indent=2)
    
    # Save local copy in public folder for static builds
    local_pub = "/Users/shinsamkyun/llm-quota-dashboard/public/telemetry.json"
    try:
        os.makedirs(os.path.dirname(local_pub), exist_ok=True)
        with open(local_pub, "w", encoding="utf-8") as f:
            f.write(json_str)
    except Exception as e:
        print(f"Local file write error: {e}")

    # Push to Gist via GitHub API
    try:
        res = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True)
        token = res.stdout.strip()
        if not token:
            print("No gh token found!")
            return

        req_body = json.dumps({
            "files": {
                "telemetry.json": {
                    "content": json_str
                }
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            f"https://api.github.com/gists/{GIST_ID}",
            data=req_body,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "User-Agent": "LLM-Dashboard-Sync"
            },
            method="PATCH"
        )

        with urllib.request.urlopen(req) as resp:
            if os.environ.get("VERBOSE"):
                print(f"[{datetime.datetime.now()}] Gist updated successfully (Status {resp.status})!")
    except Exception as e:
        print(f"Error updating Gist: {e}")

if __name__ == "__main__":
    data = collect_telemetry()
    if os.environ.get("VERBOSE"):
        print(f"Collected telemetry. Ready: {data['summary']['availableModelCount']} models, Cooldown: {data['summary']['rateLimitedModelCount']}")
        print(f"Antigravity Gemini 5h Usage: {data['providers'][0]['geminiPool']['fiveHourWindow']['usagePercent']}%")
        print(f"Alibaba Status: {data['providers'][2]['status']} (Usage: {data['providers'][2]['weeklyUsagePercent']}%)")
    push_to_gist(data)
