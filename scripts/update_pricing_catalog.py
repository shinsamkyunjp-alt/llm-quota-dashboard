import re
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
    "google-antigravity/gemini-3.8-flash": {
        "name": "Gemini 3.8 Flash",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
        "outputPrice1M": 0.60,
        "speed": "Ultra High (180+ t/s)",
        "reasoning": "Hybrid Thinking",
        "tag": "Best Speed & Quality"
    },
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
    "google-antigravity/gemini-3.8-flash-high": {
        "name": "Gemini 3.8 Flash High",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
        "outputPrice1M": 0.60,
        "speed": "Ultra High (150+ t/s)",
        "reasoning": "High Reasoning",
        "tag": "High Effort"
    },
    "google-antigravity/gemini-3.8-flash-medium": {
        "name": "Gemini 3.8 Flash Medium",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
        "outputPrice1M": 0.60,
        "speed": "Ultra High (150+ t/s)",
        "reasoning": "Medium Reasoning",
        "tag": "Medium Effort"
    },
    "google-antigravity/gemini-3.8-flash-low": {
        "name": "Gemini 3.8 Flash Low",
        "providerId": "google-antigravity",
        "providerName": "Google Antigravity",
        "pool": "gemini",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
        "outputPrice1M": 0.60,
        "speed": "Ultra High (150+ t/s)",
        "reasoning": "Low Reasoning",
        "tag": "Low Effort"
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
        "gpt-6-astra": {
        "name": "GPT-6 Astra",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 5.00,
        "cachedPrice1M": 1.25,
        "outputPrice1M": 30.00,
        "speed": "Next-Gen Flagship Intelligence",
        "reasoning": "Ultra Reasoning (low-ultra)",
        "tag": "Flagship AI"
    },
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
    "gpt-5.5": {
        "name": "GPT-5.5",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 2.00,
        "cachedPrice1M": 0.50,
        "outputPrice1M": 10.00,
        "speed": "Advanced Intelligence",
        "reasoning": "High Reasoning",
        "tag": "Codex Engine"
    },
    "gpt-5.4": {
        "name": "GPT-5.4",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 1.00,
        "cachedPrice1M": 0.25,
        "outputPrice1M": 5.00,
        "speed": "Fast Intelligence",
        "reasoning": "Medium Reasoning",
        "tag": "Codex Engine"
    },
    "gpt-5.4-mini": {
        "name": "GPT-5.4 Mini",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
        "outputPrice1M": 0.60,
        "speed": "Ultra Fast",
        "reasoning": "Medium",
        "tag": "Lightweight"
    },
    "gpt-5.3-codex-spark": {
        "name": "GPT-5.3 Codex Spark",
        "providerId": "openai",
        "providerName": "OpenAI Codex",
        "context": "128k",
        "contextTokens": 128000,
        "inputPrice1M": 0.20,
        "cachedPrice1M": 0.05,
        "outputPrice1M": 1.20,
        "speed": "Realtime Spark",
        "reasoning": "Standard",
        "tag": "Spark Engine"
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
    "alibaba-token-plan-intl/qwen3.8-flash": {
        "name": "Qwen 3.8 Flash",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "256k",
        "contextTokens": 256000,
        "inputPrice1M": 0.167,
        "cachedPrice1M": 0.0334,
        "outputPrice1M": 0.488,
        "speed": "Ultra Fast Multimodal",
        "reasoning": "Low-Medium",
        "tag": "Flash Multimodal"
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
    "alibaba-token-plan-intl/qwen3.6-plus": {
        "name": "Qwen 3.6 Plus",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.20,
        "cachedPrice1M": 0.04,
        "outputPrice1M": 0.60,
        "speed": "Fast Multimodal",
        "reasoning": "Medium Reasoning",
        "tag": "High Speed MoE"
    },
    "alibaba-token-plan-intl/kimi-k2.7-code": {
        "name": "Kimi K2.7 Code",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "256k",
        "contextTokens": 262144,
        "inputPrice1M": 0.40,
        "cachedPrice1M": 0.10,
        "outputPrice1M": 1.60,
        "speed": "Specialized Code Engine",
        "reasoning": "Code Reasoning",
        "tag": "Code Specialist"
    },
    "alibaba-token-plan-intl/kimi-k2.6": {
        "name": "Kimi K2.6",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "256k",
        "contextTokens": 262144,
        "inputPrice1M": 0.35,
        "cachedPrice1M": 0.0875,
        "outputPrice1M": 1.40,
        "speed": "Balanced Code & Chat",
        "reasoning": "Standard",
        "tag": "All-Rounder"
    },
    "alibaba-token-plan-intl/kimi-k2.5": {
        "name": "Kimi K2.5",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "256k",
        "contextTokens": 262144,
        "inputPrice1M": 0.30,
        "cachedPrice1M": 0.075,
        "outputPrice1M": 1.20,
        "speed": "Fast Inference",
        "reasoning": "Standard",
        "tag": "Stable"
    },
    "alibaba-token-plan-intl/MiniMax-M2.5": {
        "name": "MiniMax M2.5",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "205k",
        "contextTokens": 204800,
        "inputPrice1M": 0.30,
        "cachedPrice1M": 0.06,
        "outputPrice1M": 1.20,
        "speed": "Fast Conversational",
        "reasoning": "Standard",
        "tag": "Bilingual"
    },
    "alibaba-token-plan-intl/glm-5.1": {
        "name": "GLM 5.1",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.80,
        "cachedPrice1M": 0.16,
        "outputPrice1M": 0.80,
        "speed": "Bilingual Standard",
        "reasoning": "Medium Reasoning",
        "tag": "Long Context"
    },
    "alibaba-token-plan-intl/glm-5": {
        "name": "GLM 5",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "1M",
        "contextTokens": 1000000,
        "inputPrice1M": 0.60,
        "cachedPrice1M": 0.12,
        "outputPrice1M": 0.60,
        "speed": "Bilingual Standard",
        "reasoning": "Standard",
        "tag": "Stable"
    },
    "alibaba-token-plan-intl/deepseek-v3.2": {
        "name": "DeepSeek V3.2",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "131k",
        "contextTokens": 131072,
        "inputPrice1M": 0.14,
        "cachedPrice1M": 0.035,
        "outputPrice1M": 0.28,
        "speed": "Fast Open Weights",
        "reasoning": "Standard",
        "tag": "Fast Inference"
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
    },
    "alibaba-token-plan-intl/qwen-image-3.0-pro": {
        "name": "Qwen Image 3.0 Pro",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "Vision / Image",
        "contextTokens": 32000,
        "inputPrice1M": 30.00,
        "cachedPrice1M": 30.00,
        "outputPrice1M": 30.00,
        "speed": "High-Res Image Generation",
        "reasoning": "Text-to-Image",
        "tag": "Image Gen (Multimodal)"
    },
    "alibaba-token-plan-intl/qwen-audio-3.0-realtime-plus": {
        "name": "Qwen Audio 3.0 Realtime Plus",
        "providerId": "alibaba-token-plan-intl",
        "providerName": "Alibaba Token Plan",
        "context": "Audio Stream",
        "contextTokens": 128000,
        "inputPrice1M": 2.00,
        "cachedPrice1M": 0.50,
        "outputPrice1M": 6.00,
        "speed": "Realtime Audio Streaming",
        "reasoning": "Audio/Voice",
        "tag": "Audio Realtime (Multimodal)"
    },
    "combo/Fallback": {
        "name": "Fallback Router (OpenCodex)",
        "providerId": "google-antigravity",
        "providerName": "OpenCodex Failover",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.15,
        "cachedPrice1M": 0.0375,
        "outputPrice1M": 0.60,
        "speed": "Automatic Failover Router",
        "reasoning": "Failover",
        "tag": "High Availability"
    }
    ,
    # Nous Research (Hermes Agent OAuth / inference-api.nousresearch.com)
    "nous/stealth-ox-alpha": {
        "name": "Stealth Ox Alpha",
        "providerId": "nous",
        "providerName": "Nous Research",
        "context": "1M",
        "contextTokens": 1048576,
        "inputPrice1M": 0.0,
        "cachedPrice1M": 0.0,
        "outputPrice1M": 0.0,
        "speed": "Stealth Coding Agent (1M Context)",
        "reasoning": "High Reasoning (low-xhigh)",
        "tag": "Nous Stealth Tier"
    },
    "nous/tencent-hy3-free": {
        "name": "Tencent Hy3",
        "providerId": "nous",
        "providerName": "Nous Research",
        "context": "256k",
        "contextTokens": 262144,
        "inputPrice1M": 0.0,
        "cachedPrice1M": 0.0,
        "outputPrice1M": 0.0,
        "speed": "MoE Fast Inference",
        "reasoning": "Hybrid Thinking",
        "tag": "Free Tier"
    },
    "nous/stepfun-step-3.7-flash-free": {
        "name": "StepFun Step 3.7 Flash",
        "providerId": "nous",
        "providerName": "Nous Research",
        "context": "256k",
        "contextTokens": 262144,
        "inputPrice1M": 0.0,
        "cachedPrice1M": 0.0,
        "outputPrice1M": 0.0,
        "speed": "Ultra Fast Free Tier",
        "reasoning": "Medium-Max Reasoning",
        "tag": "Best Free Value"
    }
}

MODEL_ALIASES = {
    "alibaba-token-plan-intl/deepseek-v4-flash": "alibaba-token-plan-intl/deepseek-v4-flash-0731",
    "alibaba-token-plan-intl/deepseek-v4-pro": "alibaba-token-plan-intl/deepseek-v4-pro-0813",
    "alibaba-token-plan-intl/qwen3.8-max-preview": "alibaba-token-plan-intl/qwen3.8-max",
}

def format_inferred_model_name(raw_id):
    clean = raw_id.split("/")[-1]
    tokens = re.split(r'[-_]', clean)
    formatted = []
    for t in tokens:
        tl = t.lower()
        if tl == "qwen":
            formatted.append("Qwen")
        elif tl.startswith("qwen"):
            formatted.append("Qwen " + t[4:])
        elif tl == "gemini":
            formatted.append("Gemini")
        elif tl == "deepseek":
            formatted.append("DeepSeek")
        elif tl == "claude":
            formatted.append("Claude")
        elif tl == "minimax":
            formatted.append("MiniMax")
        elif tl == "stepfun":
            formatted.append("StepFun")
        elif tl == "tencent":
            formatted.append("Tencent")
        elif tl == "kimi":
            formatted.append("Kimi")
        elif tl == "glm":
            formatted.append("GLM")
        elif tl == "gpt":
            formatted.append("GPT")
        elif tl == "free":
            formatted.append("Free")
        elif t.isdigit() and len(t) == 4:
            formatted.append(f"({t})")
        else:
            formatted.append(t.capitalize() if not any(c.isupper() for c in t) else t)
    return " ".join(formatted)

def infer_model_spec(full_id, ocx_meta=None):
    if full_id in OFFICIAL_SPECS:
        spec = OFFICIAL_SPECS[full_id].copy()
        if ocx_meta and ocx_meta.get("contextWindow"):
            cw = ocx_meta["contextWindow"]
            spec["contextTokens"] = cw
            spec["context"] = f"{round(cw / 1000000, 1)}M".replace(".0M", "M") if cw >= 1000000 else f"{round(cw / 1000)}k"
        return spec

    if "/" in full_id:
        prov_id, m_part = full_id.split("/", 1)
    else:
        prov_id = "openai"
        m_part = full_id

    prov_names = {
        "google-antigravity": "Google Antigravity",
        "openai": "OpenAI Codex",
        "alibaba-token-plan-intl": "Alibaba Token Plan",
        "nous": "Nous Research",
        "combo": "OpenCodex Failover"
    }
    p_name = prov_names.get(prov_id, prov_id.replace("-", " ").title())

    ctx_tokens = 1048576
    if ocx_meta and ocx_meta.get("contextWindow"):
        ctx_tokens = int(ocx_meta["contextWindow"])
    elif "256k" in full_id.lower() or "flash" in full_id.lower():
        ctx_tokens = 262144

    ctx_str = f"{round(ctx_tokens / 1000000, 1)}M".replace(".0M", "M") if ctx_tokens >= 1000000 else f"{round(ctx_tokens / 1000)}k"

    if prov_id == "alibaba-token-plan-intl":
        in_p, out_p = (0.167, 0.488) if "flash" in m_part.lower() else (0.30, 1.20)
    elif prov_id == "google-antigravity":
        in_p, out_p = (0.15, 0.60) if "flash" in m_part.lower() else (1.25, 5.00)
    elif prov_id == "nous":
        in_p, out_p = (0.0, 0.0)
    elif prov_id == "openai":
        in_p, out_p = (0.20, 1.20) if "luna" in m_part.lower() else (2.00, 12.00)
    else:
        in_p, out_p = (0.50, 2.00)

    cached_p = round(in_p * 0.25, 4)

    is_multimodal = bool(ocx_meta and ocx_meta.get("inputModalities") and "image" in ocx_meta["inputModalities"])
    tag = "Multimodal" if is_multimodal else ("Active" if not ocx_meta or not ocx_meta.get("isDefault") else "Default Model")
    speed = "Fast Inference" if "flash" in m_part.lower() else "High Speed Inference"
    reasoning = "Standard"
    if ocx_meta and ocx_meta.get("reasoningEfforts"):
        reasoning = "High Reasoning" if any(x in ocx_meta["reasoningEfforts"] for x in ["high", "xhigh", "max"]) else "Medium Reasoning"

    spec = {
        "name": format_inferred_model_name(full_id),
        "providerId": prov_id,
        "providerName": p_name,
        "context": ctx_str,
        "contextTokens": ctx_tokens,
        "inputPrice1M": in_p,
        "cachedPrice1M": cached_p,
        "outputPrice1M": out_p,
        "speed": speed,
        "reasoning": reasoning,
        "tag": tag
    }
    if prov_id == "google-antigravity":
        spec["pool"] = "gemini" if "gemini" in m_part.lower() else "claude-gpt"

    return spec

def discover_opencodex_catalog():
    active_models_meta = {}
    cfg = {}
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f: cfg = json.load(f)
        except Exception as e: print('Config read note:', e)
    disabled_raw = set(cfg.get('disabledModels', []))
    # gpt-6-astra fails upstream: 'The gpt-6-astra model is not supported when using Codex with a ChatGPT account.'
    disabled_raw.add('gpt-6-astra')
    norm_disabled = {d.replace(':', '-').replace('/', '-') for d in disabled_raw}
    def is_disabled(mid):
        if mid in disabled_raw or mid.replace(':', '-').replace('/', '-') in norm_disabled: return True
        if '/' in mid:
            sub = mid.split('/')[-1]
            if sub in disabled_raw or sub.replace(':', '-').replace('/', '-') in norm_disabled: return True
        return False
    def _nous_normalize(fid):
        if not fid.startswith('nous/'): return fid
        rest = fid[len('nous/'):]
        if '/' in rest:
            vendor, model = rest.split('/', 1)
            return 'nous/' + (vendor + '-' + model).lower().replace(':', '-')
        return fid.replace(':', '-')
    injected_files = [os.path.expanduser('~/.codex/opencodex-catalog.json'), os.path.expanduser('~/.codex/models_cache.json')]
    for cfile in injected_files:
        if os.path.exists(cfile):
            try:
                with open(cfile, 'r', encoding='utf-8') as f: cdata = json.load(f)
                injected = cdata.get('models', [])
                if injected:
                    for m in injected:
                        slug = m.get('slug')
                        if not slug or is_disabled(slug): continue
                        norm_slug = _nous_normalize(slug)
                        if is_disabled(norm_slug): continue
                        prov = norm_slug.split('/')[0] if '/' in norm_slug else 'openai'
                        active_models_meta[norm_slug] = {'provider': prov, 'model': norm_slug.split('/')[-1] if '/' in norm_slug else norm_slug, 'contextWindow': m.get('context_window') or m.get('contextWindow')}
                    break
            except Exception as e: print('Injected catalog note:', e)
    if not active_models_meta:
        for m in ['google-antigravity/gemini-3.8-flash', 'google-antigravity/claude-sonnet-4-6', 'combo/Fallback', 'gpt-6-astra', 'gpt-5.6-terra', 'gpt-5.6-luna', 'alibaba-token-plan-intl/qwen3.8-max', 'alibaba-token-plan-intl/qwen3.8-flash', 'alibaba-token-plan-intl/deepseek-v4-pro-0813', 'alibaba-token-plan-intl/deepseek-v4-flash-0731', 'nous/tencent-hy3-free', 'nous/stepfun-step-3.7-flash-free']:
            if not is_disabled(m):
                prov = m.split('/')[0] if '/' in m else 'openai'
                active_models_meta[m] = {'provider': prov, 'model': m.split('/')[-1] if '/' in m else m}
    provider_order = {'google-antigravity': 1, 'openai': 2, 'alibaba-token-plan-intl': 3, 'nous': 4, 'combo': 5}
    spec_keys_order = list(OFFICIAL_SPECS.keys())
    def sort_key(mid):
        spec = infer_model_spec(mid, active_models_meta.get(mid))
        p_order = provider_order.get(spec.get('providerId'), 99)
        idx = spec_keys_order.index(mid) if mid in spec_keys_order else 900
        is_def = 0 if active_models_meta.get(mid, {}).get('isDefault') else 1
        return (p_order, is_def, idx, mid)
    sorted_mids = sorted(active_models_meta.keys(), key=sort_key)
    catalog = {mid: infer_model_spec(mid, active_models_meta.get(mid)) for mid in sorted_mids}
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
    # If cached data is missing key models or older than 1 hour, refresh
    if not force and (now_ms - last_updated < 3600 * 1000) and cached_data.get("models"):
        # Quick validation: ensure cached models has at least standard active count
        if len(cached_data.get("models", {})) >= 20:
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
