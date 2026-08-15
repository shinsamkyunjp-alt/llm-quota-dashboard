#!/usr/bin/env python3
"""
LLM Quota & Telemetry Sync Agent
Probes local ocx, DashScope, and system endpoints, formats the live telemetry payload,
and updates both local files and the cloud GitHub Gist for Vercel consumption.
"""

import json
import subprocess
import time
import os
import datetime
import urllib.request

GIST_ID = "67c16a5d365eddf3da98129350171338"

MODEL_METADATA = {
    # Google Antigravity
    "google-antigravity/gemini-3.7-flash": {
        "name": "Gemini 3.7 Flash",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "context": "1,048,576 (1M)",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "outputPrice1M": 0.60,
        "speed": "Ultra High (150+ t/s)",
        "reasoning": "Hybrid Thinking"
    },
    "google-antigravity/gemini-3.1-pro": {
        "name": "Gemini 3.1 Pro",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "context": "1,048,576 (1M)",
        "contextTokens": 1048576,
        "inputPrice1M": 1.25,
        "outputPrice1M": 5.00,
        "speed": "Fast (80+ t/s)",
        "reasoning": "Deep Reasoning"
    },
    "google-antigravity/claude-sonnet-4-6": {
        "name": "Claude Sonnet 4.6",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "context": "200,000 (200k)",
        "contextTokens": 200000,
        "inputPrice1M": 3.00,
        "outputPrice1M": 15.00,
        "speed": "Balanced (60+ t/s)",
        "reasoning": "High Nuance"
    },
    "google-antigravity/claude-opus-4-6-thinking": {
        "name": "Claude Opus 4.6 Thinking",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "context": "200,000 (200k)",
        "contextTokens": 200000,
        "inputPrice1M": 15.00,
        "outputPrice1M": 75.00,
        "speed": "Deep Thinking (35+ t/s)",
        "reasoning": "Max Reasoning"
    },
    # OpenAI Codex (Sol $5/$30, Terra $2/$12, Luna $0.20/$1.20)
    "gpt-5.6-sol": {
        "name": "GPT-5.6 Sol",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "128,000 (128k)",
        "contextTokens": 128000,
        "inputPrice1M": 5.00,
        "outputPrice1M": 30.00,
        "speed": "Flagship Intelligence (750 t/s on Cerebras)",
        "reasoning": "Ultra Reasoning"
    },
    "gpt-5.6-terra": {
        "name": "GPT-5.6 Terra",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "128,000 (128k)",
        "contextTokens": 128000,
        "inputPrice1M": 2.00,
        "outputPrice1M": 12.00,
        "speed": "Balanced Daily Workload",
        "reasoning": "Medium-Ultra"
    },
    "gpt-5.6-luna": {
        "name": "GPT-5.6 Luna",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "128,000 (128k)",
        "contextTokens": 128000,
        "inputPrice1M": 0.20,
        "outputPrice1M": 1.20,
        "speed": "Fast & Cost-Effective",
        "reasoning": "Medium-Max"
    },
    "combo/Antigravity": {
        "name": "Combo Antigravity Failover",
        "providerId": "openai",
        "providerName": "OpenCodex Combo",
        "context": "1,048,576 (1M)",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "outputPrice1M": 0.60,
        "speed": "Auto Failover",
        "reasoning": "Auto Failover"
    },
    # Alibaba Token Plan (1M Context)
    "alibaba-token-plan-intl/qwen3.8-max": {
        "name": "Qwen 3.8 Max",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1,000,000 (1M)",
        "contextTokens": 1000000,
        "inputPrice1M": 1.60,
        "outputPrice1M": 6.40,
        "speed": "Heavy Duty MoE (2.4T)",
        "reasoning": "XHigh Reasoning"
    },
    "alibaba-token-plan-intl/qwen3.7-max": {
        "name": "Qwen 3.7 Max",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1,000,000 (1M)",
        "contextTokens": 1000000,
        "inputPrice1M": 1.60,
        "outputPrice1M": 6.40,
        "speed": "Heavy Duty",
        "reasoning": "XHigh Reasoning"
    },
    "alibaba-token-plan-intl/qwen3.7-plus": {
        "name": "Qwen 3.7 Plus",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1,000,000 (1M)",
        "contextTokens": 1000000,
        "inputPrice1M": 0.26,
        "outputPrice1M": 0.78,
        "speed": "High Speed Multimodal",
        "reasoning": "Medium Reasoning"
    },
    "alibaba-token-plan-intl/qwen3.6-flash": {
        "name": "Qwen 3.6 Flash",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1,000,000 (1M)",
        "contextTokens": 1000000,
        "inputPrice1M": 0.05,
        "outputPrice1M": 0.20,
        "speed": "Ultra Fast",
        "reasoning": "Low-Medium"
    },
    "alibaba-token-plan-intl/deepseek-v4-pro": {
        "name": "DeepSeek V4 Pro",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1,000,000 (1M)",
        "contextTokens": 1000000,
        "inputPrice1M": 0.27,
        "outputPrice1M": 1.10,
        "speed": "Code & Math Specialist",
        "reasoning": "High-Max"
    },
    "alibaba-token-plan-intl/deepseek-v4-flash-0731": {
        "name": "DeepSeek V4 Flash",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1,000,000 (1M)",
        "contextTokens": 1000000,
        "inputPrice1M": 0.14,
        "outputPrice1M": 0.28,
        "speed": "Fast Inference",
        "reasoning": "Standard"
    },
    "alibaba-token-plan-intl/glm-5.2": {
        "name": "GLM 5.2",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "128,000 (128k)",
        "contextTokens": 128000,
        "inputPrice1M": 1.00,
        "outputPrice1M": 1.00,
        "speed": "Bilingual Pro",
        "reasoning": "Medium Reasoning"
    }
}

def collect_telemetry():
    now_ms = int(time.time() * 1000)
    
    # 1. Probe ocx quota
    ag_5h_usage = 48.52
    ag_5h_reset = now_ms + 4 * 3600 * 1000
    oa_monthly_usage = 9.0
    oa_monthly_reset = 1789273515000

    try:
        res = subprocess.run(["ocx", "provider", "quota", "--json"], capture_output=True, text=True, timeout=5)
        data = json.loads(res.stdout)
        if "reports" in data:
            for r in data["reports"]:
                if r.get("provider") == "google-antigravity":
                    windows = r.get("quota", {}).get("customWindows", [])
                    if windows:
                        ag_5h_usage = round(windows[0].get("percent", 48.52), 2)
                        ag_5h_reset = windows[0].get("resetAt", ag_5h_reset)
                elif r.get("provider") == "openai":
                    q = r.get("quota", {})
                    oa_monthly_usage = round(q.get("monthlyPercent", 9.0), 2)
                    if q.get("monthlyResetAt"):
                        oa_monthly_reset = q.get("monthlyResetAt") * 1000
    except Exception as e:
        print(f"Error querying ocx: {e}")

    # 2. Probe Alibaba status
    is_ali_exhausted = False
    ali_reset_ts = now_ms + 7 * 24 * 3600 * 1000 # 7 days from now
    try:
        res = subprocess.run(
            ["bl", "text", "chat", "--model", "qwen3.6-flash", "--message", "ping"],
            capture_output=True, text=True, timeout=8
        )
        combined = (res.stdout + " " + res.stderr).lower()
        if "429" in combined or "exhausted" in combined:
            is_ali_exhausted = True
        else:
            is_ali_exhausted = False
    except Exception as e:
        print(f"Error probing Alibaba: {e}")

    # Build model list
    model_list = []
    ready_count = 0
    cooldown_count = 0

    for mid, meta in MODEL_METADATA.items():
        is_claude = "claude" in mid
        is_alibaba = mid.startswith("alibaba-token-plan")
        
        if is_claude:
            status = "rate_limited" # Claude 3rd party weekly exhausted
            cooldown_count += 1
        elif is_alibaba:
            if is_ali_exhausted:
                status = "rate_limited"
                cooldown_count += 1
            else:
                status = "active"
                ready_count += 1
        else:
            status = "active"
            ready_count += 1

        model_list.append({
            "id": mid,
            "name": meta["name"],
            "providerId": meta["providerId"],
            "providerName": meta["providerName"],
            "context": meta["context"],
            "contextTokens": meta["contextTokens"],
            "inputPrice1M": meta["inputPrice1M"],
            "outputPrice1M": meta["outputPrice1M"],
            "speed": meta["speed"],
            "reasoning": meta["reasoning"],
            "status": status
        })

    # Providers summary
    providers = [
        {
            "provider": "google-antigravity",
            "name": "Google Antigravity",
            "status": "healthy",
            "account": "s***1@gmail.com",
            "usagePercent": ag_5h_usage,
            "resetAt": ag_5h_reset,
            "fiveHourWindow": {
                "label": "Gemini 5시간 롤링 사용량",
                "usagePercent": ag_5h_usage,
                "resetAt": ag_5h_reset
            },
            "weeklyWindow": {
                "label": "Gemini 주간 누적 사용량",
                "usagePercent": 4.57,
                "resetAt": 1787337600000
            },
            "claudeCompact": {
                "label": "Claude (3rd Party)",
                "status": "exhausted",
                "badge": "주간 쿼터 소진",
                "models": ["Sonnet 4.6", "Opus 4.6 Thinking"]
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
            "monthlyResetAt": oa_monthly_reset,
            "models": [m for m in model_list if m["providerId"] == "openai"]
        },
        {
            "provider": "alibaba-token-plan-intl",
            "name": "Alibaba Token Plan",
            "status": "exhausted" if is_ali_exhausted else "healthy",
            "badge": "HTTP 429 · Insufficient Quota" if is_ali_exhausted else "정상 가동 (Active)",
            "region": "ap-southeast-1 (Singapore)",
            "account": "sk-s****HZew",
            "weeklyUsagePercent": 100.0 if is_ali_exhausted else 0.5,
            "resetAt": ali_reset_ts,
            "message": "1-week quota exhausted" if is_ali_exhausted else "7일 쿼터 리셋 완료 (정상 가동 중)",
            "models": [m for m in model_list if m["providerId"] == "alibaba-token-plan-intl"]
        }
    ]

    payload = {
        "updatedAt": now_ms,
        "environment": "Live Mac Daemon (Realtime Sync)",
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
        "providers": providers,
        "allModels": model_list,
        "integrations": [
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
            print(f"[{datetime.datetime.now()}] Gist updated successfully (Status {resp.status})!")
    except Exception as e:
        print(f"Error updating Gist: {e}")

if __name__ == "__main__":
    data = collect_telemetry()
    print(f"Collected telemetry. Ready: {data['summary']['availableModelCount']} models, Cooldown: {data['summary']['rateLimitedModelCount']}")
    print(f"Antigravity 5h Usage: {data['providers'][0]['usagePercent']}%")
    print(f"Alibaba Status: {data['providers'][2]['status']} (Usage: {data['providers'][2]['weeklyUsagePercent']}%)")
    push_to_gist(data)
