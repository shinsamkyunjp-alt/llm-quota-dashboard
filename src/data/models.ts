import type { ModelInfo } from '@/types/telemetry';

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_MODELS — 실제 활성화된 12개 모델 메타데이터 단일 출처 (Single Source of Truth)
// OpenCodex runtime (opencodex-catalog.json / models_cache.json)과 100% 일치
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MODELS: ModelInfo[] = [
  // Google Antigravity (2 Active Models)
  { id: 'google-antigravity/gemini-3.8-flash', name: 'Gemini 3.8 Flash', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Ultra High (180+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 0.15, cachedPrice1M: 0.0375, outputPrice1M: 0.60, reasoning: 'Hybrid Thinking', tag: 'Best Speed & Quality', status: 'active' },
  { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Balanced (60+ t/s)', context: '250k', contextTokens: 250000, inputPrice1M: 3.00, cachedPrice1M: 0.30, outputPrice1M: 15.00, reasoning: 'High Nuance Coding', tag: 'Top Coder', status: 'active' },

  // OpenAI Codex (3 Active Models)
  { id: 'gpt-6-astra', name: 'GPT-6 Astra', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Next-Gen Flagship Intelligence', context: '1M', contextTokens: 1048576, inputPrice1M: 5.00, cachedPrice1M: 1.25, outputPrice1M: 30.00, reasoning: 'Ultra Reasoning (low-ultra)', tag: 'Flagship AI', status: 'active' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Balanced Daily Workload', context: '1M', contextTokens: 1048576, inputPrice1M: 2.00, cachedPrice1M: 0.50, outputPrice1M: 12.00, reasoning: 'Medium-Ultra', tag: 'Balanced Daily', status: 'active' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Fast & Cost-Effective', context: '1M', contextTokens: 1048576, inputPrice1M: 0.20, cachedPrice1M: 0.05, outputPrice1M: 1.20, reasoning: 'Medium-Max', tag: 'Best OpenAI Value', status: 'active' },

  // Alibaba Token Plan (4 Active Models)
  { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Heavy Duty MoE (2.4T)', context: '984k', contextTokens: 983616, inputPrice1M: 1.60, cachedPrice1M: 0.32, outputPrice1M: 6.40, reasoning: 'XHigh Reasoning', tag: 'Flagship MoE', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.8-flash', name: 'Qwen 3.8 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Ultra Fast Multimodal', context: '128k', contextTokens: 128000, inputPrice1M: 0.167, cachedPrice1M: 0.0334, outputPrice1M: 0.488, reasoning: 'Low-Medium', tag: 'Flash Multimodal', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro (0813 Snapshot)', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist (Snapshot)', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, cachedPrice1M: 0.07, outputPrice1M: 1.10, reasoning: 'High-Max Reasoning', tag: 'Snapshot Stable', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Fast Inference', context: '128k', contextTokens: 128000, inputPrice1M: 0.14, cachedPrice1M: 0.035, outputPrice1M: 0.28, reasoning: 'Standard', tag: 'Fast Coder', status: 'active' },

  // Nous Research (2 Active Models)
  { id: 'nous/tencent-hy3-free', name: 'Tencent Hy3', providerId: 'nous', providerName: 'Nous Research', speed: 'MoE Fast Inference', context: '128k', contextTokens: 131072, inputPrice1M: 0, cachedPrice1M: 0, outputPrice1M: 0, reasoning: 'Hybrid Thinking', tag: 'Free Tier', status: 'active' },
  { id: 'nous/stepfun-step-3.7-flash-free', name: 'StepFun Step 3.7 Flash', providerId: 'nous', providerName: 'Nous Research', speed: 'Ultra Fast Free Tier', context: '128k', contextTokens: 131072, inputPrice1M: 0, cachedPrice1M: 0, outputPrice1M: 0, reasoning: 'Medium-Max Reasoning', tag: 'Best Free Value', status: 'active' },

  // OpenCodex Failover Combo (1 Active Model)
  { id: 'combo/Fallback', name: 'Fallback Router (OpenCodex)', providerId: 'combo', providerName: 'OpenCodex Failover', speed: 'Automatic Failover Router', context: '128k', contextTokens: 131072, inputPrice1M: 0.15, cachedPrice1M: 0.0375, outputPrice1M: 0.60, reasoning: 'Failover', tag: 'High Availability', status: 'active' },
];

/** 야간 50% 할인 적용 대상 모델 ID 집합 */
export const NIGHT_DISCOUNT_MODEL_IDS = new Set([
  'alibaba-token-plan-intl/qwen3.8-max',
  'alibaba-token-plan-intl/deepseek-v4-pro-0813',
  'alibaba-token-plan-intl/deepseek-v4-flash-0731',
]);

/** 야간 50% 할인 대상 여부 확인 */
export function isNightEligibleModel(id: string): boolean {
  return NIGHT_DISCOUNT_MODEL_IDS.has(id);
}

/** 프로바이더 정렬 순서 */
export const PROVIDER_SORT_ORDER: Record<string, number> = {
  'google-antigravity': 1,
  'openai': 2,
  'alibaba-token-plan-intl': 3,
  'nous': 4,
  'combo': 5,
};

/** 모델 표시 정렬 순서 */
export const MODEL_SORT_ORDER: Record<string, number> = {
  // Google
  'google-antigravity/gemini-3.8-flash': 11,
  'google-antigravity/claude-sonnet-4-6': 12,
  // OpenAI
  'gpt-6-astra': 21,
  'gpt-5.6-terra': 22,
  'gpt-5.6-luna': 23,
  // Alibaba
  'alibaba-token-plan-intl/qwen3.8-max': 31,
  'alibaba-token-plan-intl/qwen3.8-flash': 32,
  'alibaba-token-plan-intl/deepseek-v4-pro-0813': 33,
  'alibaba-token-plan-intl/deepseek-v4-flash-0731': 34,
  // Nous
  'nous/tencent-hy3-free': 41,
  'nous/stepfun-step-3.7-flash-free': 42,
  // Combo
  'combo/Fallback': 51,
};

/** Gist URL — 환경변수 우선, 없으면 기본값 사용 */
export const GIST_URL =
  process.env.NEXT_PUBLIC_GIST_URL ??
  'https://api.github.com/gists/67c16a5d365eddf3da98129350171338';
