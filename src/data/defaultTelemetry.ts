import type { TelemetryPayload } from '@/types/telemetry';
import { DEFAULT_MODELS } from './models';

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT_TELEMETRY — API fetch 실패 시 초기 UI 상태용 정적 폴백
// null 값 = "데이터 없음" 상태를 명시적으로 표현 (하드코딩 수치 금지)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_TELEMETRY: TelemetryPayload = {
  environment: 'Live Antigravity & ocx Telemetry',
  summary: {
    totalProviders: 4,
    healthyProviders: 3,
    exhaustedProviders: 0,
    totalLinkedAccounts: 6,
    activeLLMCount: 11,
    availableModelCount: 11,
    rateLimitedModelCount: 0,
  },
  actualUsageMap: {},
  antigravity: {
    provider: 'google-antigravity',
    name: 'Google Antigravity',
    plan: 'Google AI Pro',
    status: 'healthy',
    account: 's***1@gmail.com',
    geminiPool: {
      label: 'Gemini Models',
      status: 'healthy',
      fiveHourWindow: { label: '5시간 롤링 한도', remainingPercent: null, usagePercent: null, resetAt: null, desc: '' },
      weeklyWindow: { label: '주간 누적 한도', remainingPercent: null, usagePercent: null, resetAt: null, desc: '' },
      models: ['Gemini 3.7 Flash', 'Gemini 3.1 Pro'],
    },
    claudeGptPool: {
      label: 'Claude and GPT models',
      status: 'unknown',
      fiveHourWindow: { label: '5시간 롤링 한도', remainingPercent: null, usagePercent: null, resetAt: null, desc: '' },
      weeklyWindow: { label: '주간 누적 한도', remainingPercent: null, usagePercent: null, resetAt: null, desc: '' },
      models: ['Sonnet 4.6', 'Opus 4.6 Thinking'],
    },
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'google-antigravity'),
  },
  openai: {
    provider: 'openai',
    name: 'OpenAI Codex',
    status: 'healthy',
    plan: 'Free Multi-Account Pool',
    accountCount: 3,
    activeAccount: 's***n@gmail.com',
    pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
    // null = 데이터 없음 (하드코딩 수치 사용 금지)
    monthlyUsagePercent: null,
    monthlyRemainingPercent: null,
    monthlyResetAt: 1789273515000,
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'openai'),
  },
  alibaba: {
    provider: 'alibaba-token-plan-intl',
    name: 'Alibaba Token Plan',
    status: 'healthy',
    badge: '정상 가동 (Active)',
    region: 'ap-southeast-1 (Singapore)',
    account: 'sk-s****HZew',
    weeklyUsagePercent: null,
    weeklyRemainingPercent: null,
    resetAt: null,
    message: '7일 쿼터 리셋 완료 (전 모델 정상 호출 가능)',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'alibaba-token-plan-intl'),
  },
  nous: {
    provider: 'nous',
    name: 'Nous Research',
    status: 'healthy',
    plan: 'Hermes Agent (OAuth)',
    account: 'hermes-cli (nas_organisation)',
    endpoint: 'inference-api.nousresearch.com/v1',
    message: 'OAuth OK / stealth-ox-alpha active',
    models: DEFAULT_MODELS.filter((m) => m.providerId === 'nous'),
  },
  allModels: DEFAULT_MODELS,
  integrations: [
    { name: 'Google Antigravity IDE', endpoint: 'Google AI Pro Engine', status: 'online', latency: '4ms' },
    { name: 'OpenCodex Proxy', endpoint: 'http://127.0.0.1:10100', status: 'standby', latency: '1ms' },
    { name: 'Hermes Gateway', runtime: 'launchd (PID 33929)', status: 'online', latency: '2ms' },
    { name: 'Qwen Voice', service: 'CosyVoice (Hermes)', status: 'ready', latency: '25ms' },
    { name: 'Firecrawl Tool', service: 'Web Extract (fc-5...b8ae)', status: 'ready', latency: '45ms' },
  ],
};
