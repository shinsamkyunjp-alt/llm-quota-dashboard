// ─────────────────────────────────────────────────────────────────────────────
// Telemetry type definitions — single source of truth for all components
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenUsagePeriod {
  input: number;
  uncached: number;
  cached: number;
  output: number;
  total: number;
  requests: number;
}

export interface ActualUsage {
  daily: TokenUsagePeriod;
  weekly: TokenUsagePeriod;
  monthly: TokenUsagePeriod;
  allTime: TokenUsagePeriod;
  currentCycle?: TokenUsagePeriod;
}

export interface ModelInfo {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  pool?: string;
  speed?: string;
  context?: string;
  contextTokens?: number;
  inputPrice1M?: number;
  cachedPrice1M?: number;
  outputPrice1M?: number;
  reasoning?: string;
  tag?: string;
  status: 'active' | 'rate_limited' | 'standby';
  actualUsage?: ActualUsage;
}

export interface QuotaWindow {
  label: string;
  remainingPercent: number | null;
  usagePercent: number | null;
  resetAt: number | null;
  desc?: string;
  status?: string;
  badge?: string | null;
}

export interface ProviderPool {
  label: string;
  status: string;
  isLive?: boolean;
  fiveHourWindow: QuotaWindow;
  weeklyWindow: QuotaWindow;
  models: string[];
  badge?: string;
}

export interface ProviderInfo {
  provider: string;
  name: string;
  plan?: string;
  status: string;
  account?: string;
  geminiPool?: ProviderPool;
  claudeGptPool?: ProviderPool;
  liveQuotaSource?: string;
  accountCount?: number;
  activeAccount?: string;
  pooledAccounts?: string[];
  pooledAccountDetails?: PooledAccountDetail[];
  monthlyUsagePercent?: number | null;
  monthlyRemainingPercent?: number | null;
  monthlyResetAt?: number | null;
  badge?: string;
  region?: string;
  weeklyUsagePercent?: number | null;
  weeklyRemainingPercent?: number | null;
  resetAt?: number | null;
  message?: string;
  promotion?: AlibabaPromotion;
  endpoint?: string;
  models?: ModelInfo[];
}

export interface PooledAccountDetail {
  account: string;
  accountId: string;
  usagePercent: number;
  remainingPercent: number;
  resetAt: number | null;
  state: 'active' | 'standby' | 'exhausted';
}

export interface AlibabaPromotion {
  isPromoActive: boolean;
  promoTitle: string;
  discountBadge: string;
  nightDiscountHours: string;
  discountRate: number;
  eligibleModels: { id: string; name: string; note?: string }[];
  tiers?: { name: string; originalPrice: string; promoPrice: string; quota: string; agents: string }[];
  highlights?: string[];
}

export interface TelemetrySummary {
  totalProviders: number;
  healthyProviders: number;
  exhaustedProviders: number;
  totalLinkedAccounts: number;
  activeLLMCount: number;
  availableModelCount: number;
  rateLimitedModelCount: number;
}

export interface TelemetryPayload {
  updatedAt?: number;
  environment: string;
  summary: TelemetrySummary;
  actualUsageMap: Record<string, ActualUsage>;
  antigravity: ProviderInfo;
  openai: ProviderInfo;
  alibaba: ProviderInfo;
  nous: ProviderInfo;
  allModels: ModelInfo[];
  integrations?: IntegrationInfo[];
  providers?: ProviderInfo[];
}

export interface IntegrationInfo {
  name: string;
  endpoint?: string;
  runtime?: string;
  service?: string;
  status: string;
  latency?: string;
}
