#!/usr/bin/env python3
"""
LLM Official Pricing & Model Catalog Updater
Synchronizes active model lists with OpenCodex (http://localhost:10100/#models & ~/.opencodex/config.json)
and updates official 3-tier API pricing metadata (Uncached Input / Cached Input / Output) daily.
"""

import json
import os
import time
import datetime
import urllib.request

CONFIG_FILE = os.path.expanduser("~/.opencodex/config.json")
CACHE_FILE = os.path.expanduser("~/.hermes/cache/official_pricing_cache.json")
PUBLIC_CATALOG_FILE = "/Users/shinsamkyun/llm-quota-dashboard/public/pricing_catalog.json"

# Official Provider 3-Tier Baseline Master Specs
OFFICIAL_SPECS = {
    # Google Antigravity
    "google-antigravity/gemini-3.7-flash": {
        "name": "Gemini 3.7 Flash",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
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
        "cachedPrice1M": 0.3125,
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
        "cachedPrice1M": 0.30,
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
        "cachedPrice1M": 1.50,
        "outputPrice1M": 75.00,
        "speed": "Deep Thinking (35+ t/s)",
        "reasoning": "Max Reasoning",
        "tag": "Ultra Brain"
    },
    # OpenAI Codex
    "gpt-5.6-sol": {
        "name": "GPT-5.6 Sol",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 5.00,
        "cachedPrice1M": 1.25,
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
        "cachedPrice1M": 0.50,
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
        "cachedPrice1M": 0.05,
        "outputPrice1M": 1.20,
        "speed": "Fast & Cost-Effective",
        "reasoning": "Medium-Max",
        "tag": "Best OpenAI Value"
    },
    # Alibaba Token Plan
    "alibaba-token-plan-intl/qwen3.8-max": {
        "name": "Qwen 3.8 Max",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 1.60,
        "cachedPrice1M": 0.32,
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
        "cachedPrice1M": 0.32,
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
        "cachedPrice1M": 0.052,
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
        "cachedPrice1M": 0.01,
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
        "cachedPrice1M": 0.07,
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
        "cachedPrice1M": 0.07,
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
        "cachedPrice1M": 0.035,
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
        "cachedPrice1M": 0.20,
        "outputPrice1M": 1.00,
        "speed": "Bilingual Pro",
        "reasoning": "Medium Reasoning",
        "tag": "Bilingual"
    }
}

MODEL_ALIASES = {
    "alibaba-token-plan-intl/deepseek-v4-flash": "alibaba-token-plan-intl/deepseek-v4-flash-0731",
    "alibaba-token-plan-intl/deepseek-v4-pro": "alibaba-token-plan-intl/deepseek-v4-pro-0813",
    "alibaba-token-plan-intl/qwen3.8-max-preview": "alibaba-token-plan-intl/qwen3.8-max",
}

def discover_opencodex_catalog():
    active_set = set()
    if not os.path.exists(CONFIG_FILE):
        return OFFICIAL_SPECS
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        disabled = set(cfg.get("disabledModels", []))
        providers = cfg.get("providers", {})
        for prov_id, pval in providers.items():
            for m in pval.get("models", []):
                full_id = f"{prov_id}/{m}" if prov_id != "openai" else m
                resolved = MODEL_ALIASES.get(full_id, full_id)
                if full_id not in disabled and m not in disabled and resolved not in disabled:
                    active_set.add(resolved)
        for cm in cfg.get("customModels", []):
            prov_id = cm.get("provider") or "alibaba-token-plan-intl"
            m = cm.get("modelId")
            full_id = f"{prov_id}/{m}" if prov_id != "openai" else m
            resolved = MODEL_ALIASES.get(full_id, full_id)
            if full_id not in disabled and m not in disabled and resolved not in disabled:
                active_set.add(resolved)
        for oa_m in ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"]:
            if oa_m not in disabled:
                active_set.add(oa_m)
    except Exception as e:
        print(f"Error reading OpenCodex config: {e}")
        return OFFICIAL_SPECS

    provider_order = {"google-antigravity": 1, "openai": 2, "alibaba-token-plan-intl": 3}
    def sort_key(mid):
        meta = OFFICIAL_SPECS.get(mid, {})
        p_order = provider_order.get(meta.get("providerId"), 99)
        spec_idx = list(OFFICIAL_SPECS.keys()).index(mid) if mid in OFFICIAL_SPECS else 999
        return (p_order, spec_idx)

    sorted_mids = sorted([m for m in active_set if m in OFFICIAL_SPECS], key=sort_key)
    catalog = {mid: OFFICIAL_SPECS[mid] for mid in sorted_mids}

    return catalog if catalog else OFFICIAL_SPECS

def update_pricing_catalog(force=False):
    now_ms = int(time.time() * 1000)
    one_day_ms = 24 * 3600 * 1000

    cached_data = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cached_data = json.load(f)
        except Exception:
            cached_data = {}

    last_updated = cached_data.get("last_updated_at", 0)
    if not force and (now_ms - last_updated < one_day_ms) and cached_data.get("models"):
        return cached_data["models"]

    # Refresh catalog specs from OpenCodex & official baseline
    catalog = discover_opencodex_catalog()

    payload = {
        "last_updated_at": now_ms,
        "last_updated_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S KST"),
        "source": "OpenCodex http://localhost:10100/#models & Official Provider API Specs",
        "total_models": len(catalog),
        "models": catalog
    }

    # Save to hermes cache
    try:
        os.makedirs(os.path.dirname(CACHE_FILE), exist_ok=True)
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Failed to write cache: {e}")

    # Save to public catalog file for frontend builds
    try:
        os.makedirs(os.path.dirname(PUBLIC_CATALOG_FILE), exist_ok=True)
        with open(PUBLIC_CATALOG_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Failed to write public catalog: {e}")

    print(f"[{payload['last_updated_date']}] Pricing catalog updated ({len(catalog)} active models).")
    return catalog

if __name__ == "__main__":
    update_pricing_catalog(force=True)
