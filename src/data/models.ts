import type { ModelInfo } from '@/types/telemetry';

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_MODELS — 모델 메타데이터 단일 출처 (Single Source of Truth)
// page.tsx, LiveUsageTab.tsx 모두 여기서 임포트해 사용한다.
// pricing 변경 시 이 파일만 수정하면 된다.
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_MODELS: ModelInfo[] = [
  // Google Antigravity - Gemini Pool
  { id: 'google-antigravity/gemini-3.7-flash', name: 'Gemini 3.7 Flash', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Ultra High (150+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 0.15, cachedPrice1M: 0.0375, outputPrice1M: 0.60, reasoning: 'Hybrid Thinking', tag: 'Best Speed', status: 'active' },
  { id: 'google-antigravity/gemini-3.1-pro', name: 'Gemini 3.1 Pro', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Fast (80+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 1.25, cachedPrice1M: 0.3125, outputPrice1M: 5.00, reasoning: 'Deep Reasoning', tag: '1M Deep Context', status: 'active' },

  // Google Antigravity - Claude and GPT models Pool
  { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Balanced (60+ t/s)', context: '200k', contextTokens: 200000, inputPrice1M: 3.00, cachedPrice1M: 0.30, outputPrice1M: 15.00, reasoning: 'High Nuance Coding', tag: 'Top Coder', status: 'active' },
  { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Deep Thinking (35+ t/s)', context: '200k', contextTokens: 200000, inputPrice1M: 15.00, cachedPrice1M: 1.50, outputPrice1M: 75.00, reasoning: 'Max Reasoning', tag: 'Ultra Brain', status: 'active' },

  // OpenAI Codex (Sol $5/$30, Terra $2/$12, Luna $0.20/$1.20)
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Flagship Intelligence (750 t/s on Cerebras)', context: '1M', contextTokens: 1048576, inputPrice1M: 5.00, cachedPrice1M: 1.25, outputPrice1M: 30.00, reasoning: 'Ultra Reasoning', tag: 'Flagship AI', status: 'active' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Balanced Daily Workload', context: '1M', contextTokens: 1048576, inputPrice1M: 2.00, cachedPrice1M: 0.50, outputPrice1M: 12.00, reasoning: 'Medium-Ultra', tag: 'Balanced Daily', status: 'active' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Fast & Cost-Effective', context: '1M', contextTokens: 1048576, inputPrice1M: 0.20, cachedPrice1M: 0.05, outputPrice1M: 1.20, reasoning: 'Medium-Max', tag: 'Best OpenAI Value', status: 'active' },

  // Alibaba Token Plan (Model Studio ap-southeast-1 Marketplace Specs)
  { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Heavy Duty MoE (2.4T)', context: '1M', contextTokens: 1000000, inputPrice1M: 1.60, cachedPrice1M: 0.32, outputPrice1M: 6.40, reasoning: 'XHigh Reasoning', tag: 'Flagship MoE', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.8-flash', name: 'Qwen 3.8 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Ultra Fast Multimodal', context: '256k', contextTokens: 256000, inputPrice1M: 0.167, cachedPrice1M: 0.0334, outputPrice1M: 0.488, reasoning: 'Low-Medium', tag: 'Flash Multimodal', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.7-plus', name: 'Qwen 3.7 Plus', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'High Speed Multimodal', context: '1M', contextTokens: 1000000, inputPrice1M: 0.26, cachedPrice1M: 0.052, outputPrice1M: 0.78, reasoning: 'Medium Reasoning', tag: 'All-Rounder', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.6-flash', name: 'Qwen 3.6 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Ultra Fast', context: '1M', contextTokens: 1000000, inputPrice1M: 0.05, cachedPrice1M: 0.01, outputPrice1M: 0.20, reasoning: 'Low-Medium', tag: 'Ultra Cheap ($0.05)', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro', name: 'DeepSeek V4 Pro', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, cachedPrice1M: 0.07, outputPrice1M: 1.10, reasoning: 'High-Max', tag: 'Code Specialist', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro (0813 Snapshot)', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist (Snapshot)', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, cachedPrice1M: 0.07, outputPrice1M: 1.10, reasoning: 'High-Max Reasoning', tag: 'Snapshot Stable', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Fast Inference', context: '1M', contextTokens: 1000000, inputPrice1M: 0.14, cachedPrice1M: 0.035, outputPrice1M: 0.28, reasoning: 'Standard', tag: 'Fast Coder', status: 'active' },
  { id: 'alibaba-token-plan-intl/glm-5.2', name: 'GLM 5.2', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Bilingual Pro', context: '128k', contextTokens: 128000, inputPrice1M: 1.00, cachedPrice1M: 0.20, outputPrice1M: 1.00, reasoning: 'Medium Reasoning', tag: 'Bilingual', status: 'active' },

  // Nous (Hermes Agent / inference-api.nousresearch.com / OAuth)
  { id: 'nous/stealth-ox-alpha', name: 'Stealth Ox Alpha', providerId: 'nous', providerName: 'Nous Research', speed: 'Stealth Coding Agent (1M Context)', context: '1M', contextTokens: 1048576, inputPrice1M: 0, cachedPrice1M: 0, outputPrice1M: 0, reasoning: 'High Reasoning (effort: low-xhigh)', tag: 'Nous Stealth Tier', status: 'active' },
  { id: 'nous/tencent-hy3-free', name: 'Tencent Hy3', providerId: 'nous', providerName: 'Nous Research', speed: 'MoE Fast Inference', context: '256k', contextTokens: 262144, inputPrice1M: 0, cachedPrice1M: 0, outputPrice1M: 0, reasoning: 'Hybrid Thinking', tag: 'Free Tier', status: 'active' },
  { id: 'nous/stepfun-step-3.7-flash-free', name: 'StepFun Step 3.7 Flash', providerId: 'nous', providerName: 'Nous Research', speed: 'Ultra Fast Free Tier', context: '256k', contextTokens: 262144, inputPrice1M: 0, cachedPrice1M: 0, outputPrice1M: 0, reasoning: 'Medium-Max Reasoning', tag: 'Best Free Value', status: 'active' },
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
};

/** 모델 표시 정렬 순서 */
export const MODEL_SORT_ORDER: Record<string, number> = {
  // Google
  'google-antigravity/gemini-3.7-flash': 11,
  'google-antigravity/gemini-3.1-pro': 12,
  'google-antigravity/claude-sonnet-4-6': 13,
  'google-antigravity/claude-opus-4-6-thinking': 14,
  // OpenAI
  'gpt-5.6-sol': 21,
  'gpt-5.6-terra': 22,
  'gpt-5.6-luna': 23,
  // Alibaba
  'alibaba-token-plan-intl/qwen3.8-max': 31,
  'alibaba-token-plan-intl/qwen3.8-flash': 32,
  'alibaba-token-plan-intl/qwen3.7-plus': 33,
  'alibaba-token-plan-intl/qwen3.6-flash': 34,
  'alibaba-token-plan-intl/deepseek-v4-pro': 43,
  'alibaba-token-plan-intl/deepseek-v4-pro-0813': 44,
  'alibaba-token-plan-intl/deepseek-v4-flash-0731': 45,
  'alibaba-token-plan-intl/glm-5.2': 46,
  // Nous
  'nous/stealth-ox-alpha': 51,
  'nous/tencent-hy3-free': 52,
  'nous/stepfun-step-3.7-flash-free': 53,
};

/** Gist URL — 환경변수 우선, 없으면 기본값 사용 */
export const GIST_URL =
  process.env.NEXT_PUBLIC_GIST_URL ??
  'https://api.github.com/gists/67c16a5d365eddf3da98129350171338';
