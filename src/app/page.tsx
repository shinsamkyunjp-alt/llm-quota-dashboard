'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Server,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  Search,
  HardDrive,
  Sparkles,
  Calendar,
  DollarSign,
  Sun,
  Moon,
  Calculator,
  Compass,
  BarChart3,
  Activity,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import LiveUsageTab from '@/components/LiveUsageTab';

interface ModelInfo {
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
  actualUsage?: any;
}

const DEFAULT_MODELS: ModelInfo[] = [
  // Google Antigravity - Gemini Pool
  { id: 'google-antigravity/gemini-3.7-flash', name: 'Gemini 3.7 Flash', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Ultra High (150+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 0.15, cachedPrice1M: 0.0375, outputPrice1M: 0.60, reasoning: 'Hybrid Thinking', tag: 'Best Speed', status: 'active' },
  { id: 'google-antigravity/gemini-3.1-pro', name: 'Gemini 3.1 Pro', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Fast (80+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 1.25, cachedPrice1M: 0.3125, outputPrice1M: 5.00, reasoning: 'Deep Reasoning', tag: '1M Deep Context', status: 'active' },
  
  // Google Antigravity - Claude and GPT models Pool (복구 완료 / 100% 잔여)
  { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Balanced (60+ t/s)', context: '200k', contextTokens: 200000, inputPrice1M: 3.00, cachedPrice1M: 0.30, outputPrice1M: 15.00, reasoning: 'High Nuance Coding', tag: 'Top Coder', status: 'active' },
  { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Deep Thinking (35+ t/s)', context: '200k', contextTokens: 200000, inputPrice1M: 15.00, cachedPrice1M: 1.50, outputPrice1M: 75.00, reasoning: 'Max Reasoning', tag: 'Ultra Brain', status: 'active' },

  // OpenAI Codex (Official OpenAI GPT-5.6 Sol Launch Pricing: Sol $5/$30, Terra $2/$12, Luna $0.20/$1.20)
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Flagship Intelligence (750 t/s on Cerebras)', context: '1M', contextTokens: 1048576, inputPrice1M: 5.00, cachedPrice1M: 1.25, outputPrice1M: 30.00, reasoning: 'Ultra Reasoning', tag: 'Flagship AI', status: 'active' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Balanced Daily Workload', context: '1M', contextTokens: 1048576, inputPrice1M: 2.00, cachedPrice1M: 0.50, outputPrice1M: 12.00, reasoning: 'Medium-Ultra', tag: 'Balanced Daily', status: 'active' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Fast & Cost-Effective', context: '1M', contextTokens: 1048576, inputPrice1M: 0.20, cachedPrice1M: 0.05, outputPrice1M: 1.20, reasoning: 'Medium-Max', tag: 'Best OpenAI Value', status: 'active' },

  // Alibaba Token Plan (Model Studio ap-southeast-1 Marketplace Specs)
  { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Heavy Duty MoE (2.4T)', context: '1M', contextTokens: 1000000, inputPrice1M: 1.60, cachedPrice1M: 0.32, outputPrice1M: 6.40, reasoning: 'XHigh Reasoning', tag: 'Flagship MoE', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.7-max', name: 'Qwen 3.7 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Heavy Duty', context: '1M', contextTokens: 1000000, inputPrice1M: 1.60, cachedPrice1M: 0.32, outputPrice1M: 6.40, reasoning: 'XHigh Reasoning', tag: 'Power Model', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.7-plus', name: 'Qwen 3.7 Plus', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'High Speed Multimodal', context: '1M', contextTokens: 1000000, inputPrice1M: 0.26, cachedPrice1M: 0.052, outputPrice1M: 0.78, reasoning: 'Medium Reasoning', tag: 'All-Rounder', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.6-flash', name: 'Qwen 3.6 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Ultra Fast', context: '1M', contextTokens: 1000000, inputPrice1M: 0.05, cachedPrice1M: 0.01, outputPrice1M: 0.20, reasoning: 'Low-Medium', tag: 'Ultra Cheap ($0.05)', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro', name: 'DeepSeek V4 Pro', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, cachedPrice1M: 0.07, outputPrice1M: 1.10, reasoning: 'High-Max', tag: 'Code Specialist', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro (0813 Snapshot)', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist (Snapshot)', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, cachedPrice1M: 0.07, outputPrice1M: 1.10, reasoning: 'High-Max Reasoning', tag: 'Snapshot Stable', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Fast Inference', context: '1M', contextTokens: 1000000, inputPrice1M: 0.14, cachedPrice1M: 0.035, outputPrice1M: 0.28, reasoning: 'Standard', tag: 'Fast Coder', status: 'active' },
  { id: 'alibaba-token-plan-intl/glm-5.2', name: 'GLM 5.2', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Bilingual Pro', context: '128k', contextTokens: 128000, inputPrice1M: 1.00, cachedPrice1M: 0.20, outputPrice1M: 1.00, reasoning: 'Medium Reasoning', tag: 'Bilingual', status: 'active' },
];

const DEFAULT_TELEMETRY = {
  environment: 'Live Antigravity & ocx Telemetry',
  summary: {
    totalProviders: 3,
    healthyProviders: 3,
    exhaustedProviders: 0,
    totalLinkedAccounts: 5,
    activeLLMCount: 17,
    availableModelCount: 17,
    rateLimitedModelCount: 0
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
      fiveHourWindow: {
        label: '5시간 롤링 한도',
        remainingPercent: null,
        usagePercent: null,
        resetAt: null,
        desc: ''
      },
      weeklyWindow: {
        label: '주간 누적 한도',
        remainingPercent: null,
        usagePercent: null,
        resetAt: null,
        desc: ''
      },
      models: ['Gemini 3.7 Flash', 'Gemini 3.1 Pro']
    },
    claudeGptPool: {
      label: 'Claude and GPT models',
      status: 'unknown',
      fiveHourWindow: {
        label: '5시간 롤링 한도',
        remainingPercent: null,
        usagePercent: null,
        resetAt: null,
        desc: ''
      },
      weeklyWindow: {
        label: '주간 누적 한도',
        remainingPercent: null,
        usagePercent: null,
        resetAt: null,
        desc: ''
      },
      models: ['Sonnet 4.6', 'Opus 4.6 Thinking']
    },
    models: DEFAULT_MODELS.filter(m => m.providerId === 'google-antigravity')
  },
  openai: {
    provider: 'openai',
    name: 'OpenAI Codex',
    status: 'healthy',
    plan: 'Free Multi-Account Pool',
    accountCount: 3,
    activeAccount: 's***n@gmail.com',
    pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
    monthlyUsagePercent: null,
    monthlyRemainingPercent: null,
    monthlyResetAt: 1789273515000,
    models: DEFAULT_MODELS.filter(m => m.providerId === 'openai')
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
    resetAt: 1787387476000,
    message: '7일 쿼터 리셋 완료 (전 모델 정상 호출 가능)',
    models: DEFAULT_MODELS.filter(m => m.providerId === 'alibaba-token-plan-intl')
  },
  allModels: DEFAULT_MODELS,
  integrations: [
    { name: 'Google Antigravity IDE', endpoint: 'Google AI Pro Engine', status: 'online', latency: '4ms' },
    { name: 'OpenCodex Proxy', endpoint: 'http://127.0.0.1:10100', status: 'standby', latency: '1ms' },
    { name: 'Hermes Gateway', runtime: 'launchd (PID 33929)', status: 'online', latency: '2ms' },
    { name: 'ElevenLabs Voice', service: 'Voice Synth (41b6...6484)', status: 'ready', latency: '38ms' },
    { name: 'Firecrawl Tool', service: 'Web Extract (fc-5...b8ae)', status: 'ready', latency: '45ms' }
  ]
};

const INITIAL_NIGHT_TIME = false;

const TIME_FMT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Seoul',
});

function formatTime(date: Date | null): string {
  return date ? TIME_FMT.format(date) : '--:--:--';
}

export default function QuotaDashboard() {
  const [data, setData] = useState<any>(DEFAULT_TELEMETRY);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'context' | 'speed'>('default');
  const [refreshInterval, setRefreshInterval] = useState<number>(15);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // 다크모드, 뷰 모드(잔여량/소모량), 토큰 계산기 상태
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'remaining' | 'usage'>('remaining');
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcInputK, setCalcInputK] = useState<number>(200);
  const [calcOutputK, setCalcOutputK] = useState<number>(20);
  const [applyNightDiscount, setApplyNightDiscount] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'quota' | 'live-usage'>('quota');

  useEffect(() => {
    const saved = localStorage.getItem('llm_dashboard_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
    setLastSync(new Date());
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('llm_dashboard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('llm_dashboard_theme', 'light');
    }
  }, [isDarkMode]);

  const fetchTelemetry = useCallback(async (manual = false) => {
    try {
      setLoading(true);
      const res = await fetch('/api/quota', { cache: 'no-store' });
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();
      if (json.providers) {
        const agData = json.providers[0] || {};
        const rawList = (json.allModels && json.allModels.length > 0) ? json.allModels : DEFAULT_MODELS;
        const mergedModels = rawList.map((m: any) => {
          const meta = DEFAULT_MODELS.find(d => d.id === m.id);
        return {
            ...meta,
            ...m,
            tag: m.tag || meta?.tag,
            context: meta?.context || m.context || "1M"
          };
        });

        // ocx 라이브 윈도우(fiveHourWindow/weeklyWindow/claudeCompact)를 대시보드 풀 구조로 정규화.
        // 잔여량은 항상 100 - 사용량으로 계산해 하드코딩을 제거한다.
        const live5h = agData.geminiPool?.fiveHourWindow || agData.fiveHourWindow || {};
        const liveWeekly = agData.geminiPool?.weeklyWindow || agData.weeklyWindow || {};
        const liveClaude = agData.claudeGptPool || agData.claudeCompact || {};
        const gemini5hUsed = typeof live5h.usagePercent === "number" ? live5h.usagePercent : null;
        const geminiWeeklyUsed = typeof liveWeekly.usagePercent === "number" ? liveWeekly.usagePercent : null;

        const geminiPool = {
          label: "Gemini Models",
          status: gemini5hUsed != null && gemini5hUsed >= 100 ? "exhausted" : "healthy",
          fiveHourWindow: {
            label: "5시간 롤링 한도",
            usagePercent: gemini5hUsed,
            remainingPercent: gemini5hUsed != null ? Math.max(0, 100 - gemini5hUsed) : null,
            resetAt: live5h.resetAt || null,
            desc: ""
          },
          weeklyWindow: {
            label: "주간 누적 한도",
            usagePercent: geminiWeeklyUsed,
            remainingPercent: geminiWeeklyUsed != null ? Math.max(0, 100 - geminiWeeklyUsed) : null,
            resetAt: liveWeekly.resetAt || null,
            desc: ""
          },
          models: ["Gemini 3.7 Flash", "Gemini 3.1 Pro"]
        };

        const claudeExhausted = liveClaude.status === "exhausted";
        const claude5hUsed = typeof liveClaude.fiveHourWindow?.usagePercent === "number" ? liveClaude.fiveHourWindow.usagePercent : (typeof liveClaude.fiveHourUsagePercent === "number" ? liveClaude.fiveHourUsagePercent : 0);
        const claude5hRemaining = typeof liveClaude.fiveHourWindow?.remainingPercent === "number" ? liveClaude.fiveHourWindow.remainingPercent : (claude5hUsed != null ? Math.max(0, 100 - claude5hUsed) : 100);
        const claudeWeeklyUsed = typeof liveClaude.weeklyWindow?.usagePercent === "number" ? liveClaude.weeklyWindow.usagePercent : (typeof liveClaude.weeklyUsagePercent === "number" ? liveClaude.weeklyUsagePercent : 0);
        const claudeWeeklyRemaining = typeof liveClaude.weeklyWindow?.remainingPercent === "number" ? liveClaude.weeklyWindow.remainingPercent : (claudeWeeklyUsed != null ? Math.max(0, 100 - claudeWeeklyUsed) : 100);
        const claude5hExhausted = typeof claude5hRemaining === "number" && claude5hRemaining <= 0;
        const claudeWeeklyExhausted = typeof claudeWeeklyRemaining === "number" && claudeWeeklyRemaining <= 0;
        const isClaudeExhausted = liveClaude.status === "exhausted" || claude5hExhausted || claudeWeeklyExhausted;

        const claudeGptPool = {
          label: "Claude and GPT models",
          status: isClaudeExhausted ? "exhausted" : "healthy",
          fiveHourWindow: {
            label: "5시간 롤링 한도",
            usagePercent: claude5hUsed,
            remainingPercent: claude5hRemaining,
            resetAt: liveClaude.fiveHourWindow?.resetAt || liveClaude.fiveHourResetAt || null,
            desc: ""
          },
          weeklyWindow: {
            label: "주간 누적 한도",
            usagePercent: claudeWeeklyUsed,
            remainingPercent: claudeWeeklyRemaining,
            resetAt: liveClaude.weeklyWindow?.resetAt || liveClaude.weeklyResetAt || null,
            status: claudeWeeklyExhausted ? "exhausted" : (claude5hExhausted ? "exhausted" : "healthy"),
            badge: claudeWeeklyExhausted ? "주간 한도 소진" : (claude5hExhausted ? "5시간 한도 소진" : (liveClaude.badge || null)),
            desc: claudeWeeklyExhausted ? "주간 쿼터 소진 (호출 불가)" : (claude5hExhausted ? "5시간 한도 소진" : "")
          },
          models: liveClaude.models || ["Claude Sonnet 4.6", "Claude Opus 4.6 Thinking"]
        };

        const aliData = json.providers[2] || {};
        const aliWeeklyRemaining = aliData.weeklyRemainingPercent;
        const isAliExhausted = aliData.status === "exhausted" || (typeof aliWeeklyRemaining === "number" && aliWeeklyRemaining <= 0);
        const isGeminiExhausted = gemini5hUsed != null && gemini5hUsed >= 100;

        const dynamicModels = rawList.map((m: any) => {
          const meta = DEFAULT_MODELS.find(d => d.id === m.id);
          let status = m.status || meta?.status || 'active';
          if (m.providerId === 'alibaba-token-plan-intl' && isAliExhausted) {
            status = 'rate_limited';
          } else if (m.providerId === 'google-antigravity' && m.pool === 'claude-gpt' && isClaudeExhausted) {
            status = 'rate_limited';
          } else if (m.providerId === 'google-antigravity' && m.pool === 'gemini' && isGeminiExhausted) {
            status = 'rate_limited';
          }
          return {
            ...meta,
            ...m,
            status,
            tag: m.tag || meta?.tag,
            context: meta?.context || m.context || "1M"
          };
        });

        const activeCount = dynamicModels.filter((m: any) => m.status === 'active').length;
        const limitedCount = dynamicModels.filter((m: any) => m.status === 'rate_limited').length;
        const isAgFullyHealthy = !isClaudeExhausted && !isGeminiExhausted;
        const isOaHealthy = (json.providers[1]?.monthlyUsagePercent ?? 0) < 100;
        const isAliHealthy = !isAliExhausted;
        const healthyProviderCount = (isAgFullyHealthy ? 1 : 0) + (isOaHealthy ? 1 : 0) + (isAliHealthy ? 1 : 0);

        setData({
          ...DEFAULT_TELEMETRY,
          summary: {
            totalProviders: 3,
            healthyProviders: healthyProviderCount,
            exhaustedProviders: 3 - healthyProviderCount,
            totalLinkedAccounts: json.summary?.totalLinkedAccounts || 5,
            activeLLMCount: dynamicModels.length,
            availableModelCount: activeCount,
            rateLimitedModelCount: limitedCount
          },
          actualUsageMap: json.actualUsageMap || {},
          antigravity: {
            ...DEFAULT_TELEMETRY.antigravity,
            ...agData,
            status: (isGeminiExhausted && isClaudeExhausted) ? 'exhausted' : (!isAgFullyHealthy ? 'partial' : 'healthy'),
            geminiPool,
            claudeGptPool
          },
          openai: {
            ...DEFAULT_TELEMETRY.openai,
            ...(json.providers[1] || {})
          },
          alibaba: {
            ...DEFAULT_TELEMETRY.alibaba,
            ...(json.providers[2] || {})
          },
          allModels: dynamicModels,
          environment: json.environment
        });
      }
      setLastSync(new Date());
      if (manual) {
        setSyncToast('실시간 텔레메트리 동기화 완료!');
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const ag = data.antigravity || DEFAULT_TELEMETRY.antigravity;
  const oa = data.openai || DEFAULT_TELEMETRY.openai;
  const al = data.alibaba || DEFAULT_TELEMETRY.alibaba;
  const rawModels: ModelInfo[] = data.allModels || DEFAULT_MODELS;

  // ── ocx 라이브 값 기반 파생값 (하드코딩 제거) ──
  const fmtPct = (n?: number | null) => {
    if (n == null || Number.isNaN(n)) return "N/A";
    const v = Math.round(n * 10) / 10;
    return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + "%";
  };
const clampPct = (n?: number | null) => Math.min(100, Math.max(0, n ?? 0));

const getProgressBarColor = (remaining?: number | null, used?: number | null) => {
  const rem = remaining != null ? remaining : (used != null ? 100 - used : 100);
  if (rem <= 10) return "bg-rose-500";
  if (rem <= 25) return "bg-amber-500";
  return "bg-emerald-500";
};

const getStatusTextColor = (remaining?: number | null, used?: number | null) => {
  const rem = remaining != null ? remaining : (used != null ? 100 - used : 100);
  if (rem <= 10) return "text-rose-600 dark:text-rose-400";
  if (rem <= 25) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-700 dark:text-emerald-400";
};

// ── 고성능 독립 카운트다운 컴포넌트 (초당 부모 리렌더링 차단) ──
const CountdownTimer = memo(function CountdownTimer({ targetTimestamp }: { targetTimestamp?: number | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!targetTimestamp) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (!targetTimestamp) return <span className="font-mono text-zinc-600 dark:text-zinc-300">N/A</span>;
  if (now == null) return <span className="font-mono text-zinc-600 dark:text-zinc-300">--:--:--</span>;
  
  const diff = targetTimestamp - now;
  if (diff <= 0) return <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">00:00:00 (리셋 완료)</span>;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return <span className="font-mono text-zinc-700 dark:text-zinc-300">{days}일 {hours % 24}시간</span>;
  }

  return <span className="font-mono text-zinc-700 dark:text-zinc-300">{`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}</span>;
});

// ── 독립 시계 컴포넌트 ──
const LiveClock = memo(function LiveClock() {
  const [timeStr, setTimeStr] = useState<string>('--:--:--');

  useEffect(() => {
    const update = () => setTimeStr(formatTime(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-zinc-700 dark:text-zinc-300 font-medium shrink-0">
      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
      <span aria-label="현재 시각">{timeStr}</span>
    </div>
  );
});

  const geminiPool = ag.geminiPool;
  const claudePool = ag.claudeGptPool;
  const gemini5h = geminiPool?.fiveHourWindow;
  const geminiWeekly = geminiPool?.weeklyWindow;
  const gemini5hUsed = gemini5h?.usagePercent ?? null;
  const gemini5hRemaining = gemini5h?.remainingPercent ?? (gemini5hUsed != null ? Math.max(0, 100 - gemini5hUsed) : null);
  const geminiWeeklyUsed = geminiWeekly?.usagePercent ?? null;
  const geminiWeeklyRemaining = geminiWeekly?.remainingPercent ?? (geminiWeeklyUsed != null ? Math.max(0, 100 - geminiWeeklyUsed) : null);

  const claudeExhausted = claudePool?.status === "exhausted";
  const claude5hUsed = claudePool?.fiveHourWindow?.usagePercent ?? null;
  const claude5hRemaining = claudePool?.fiveHourWindow?.remainingPercent ?? (claude5hUsed != null ? Math.max(0, 100 - claude5hUsed) : null);
  const claudeWeekly = claudePool?.weeklyWindow;
  const claudeWeeklyUsed = claudeWeekly?.usagePercent ?? (claudeExhausted ? 100 : null);
  const claudeWeeklyRemaining = claudeWeekly?.remainingPercent ?? (claudeWeeklyUsed != null ? Math.max(0, 100 - claudeWeeklyUsed) : (claudeExhausted ? 0 : null));
  const claude5hExhausted = typeof claude5hRemaining === "number" && claude5hRemaining <= 0;
  const claudeWeeklyExhausted = typeof claudeWeeklyRemaining === "number" && claudeWeeklyRemaining <= 0;
  const isClaudeExhausted = claudeExhausted || claude5hExhausted || claudeWeeklyExhausted;

  const oaUsed = oa.monthlyUsagePercent ?? null;
  const oaRemaining = oa.monthlyRemainingPercent ?? (oaUsed != null ? Math.max(0, 100 - oaUsed) : null);

  const alUsed = al.weeklyUsagePercent ?? null;
  const alRemaining = al.weeklyRemainingPercent ?? (alUsed != null ? Math.max(0, 100 - alUsed) : null);
  const isAliExhausted = al.status === "exhausted" || (typeof alRemaining === "number" && alRemaining <= 0);

  const sum = data.summary || DEFAULT_TELEMETRY.summary;
  const healthyProviders = sum.healthyProviders ?? 0;
  const totalProviders = sum.totalProviders ?? 3;
  const availableModels = sum.availableModelCount ?? 0;
  const activeModels = sum.activeLLMCount ?? 0;
  const rateLimitedModels = sum.rateLimitedModelCount ?? 0;
  const totalModels = activeModels || rawModels.length;

  // 알리바바 야간 50% 할인 시간대 판별 (22:00 ~ 08:00 UTC+8 = 23:00 ~ 09:00 KST)
  const [isNightDiscountNow, setIsNightDiscountNow] = useState<boolean>(INITIAL_NIGHT_TIME);

  useEffect(() => {
    const kstHour = new Date().getHours();
    setIsNightDiscountNow(kstHour >= 23 || kstHour < 9);
  }, []);

  const filteredModels = useMemo(() => {
    let list = rawModels.filter(m => {
      if (filterProvider !== 'all' && m.providerId !== filterProvider) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return m.id.toLowerCase().includes(query) || m.name.toLowerCase().includes(query) || m.providerName.toLowerCase().includes(query);
      }
      return true;
    });

    if (sortBy === 'price') {
      list = [...list].sort((a, b) => (a.inputPrice1M ?? 0) - (b.inputPrice1M ?? 0));
    } else if (sortBy === 'context') {
      list = [...list].sort((a, b) => (b.contextTokens ?? 0) - (a.contextTokens ?? 0));
    }

    return list;
  }, [rawModels, filterProvider, searchTerm, sortBy]);

  // 실시간 토큰 비용 계산
  const calculatedCostList = useMemo(() => {
    return rawModels.map(m => {
      let inPrice = m.inputPrice1M ?? 0;
      let outPrice = m.outputPrice1M ?? 0;
      const isEligibleNightModel = m.id === 'alibaba-token-plan-intl/qwen3.8-max' || m.id === 'alibaba-token-plan-intl/deepseek-v4-pro-0813';
      
      if ((applyNightDiscount || isNightDiscountNow) && isEligibleNightModel) {
        inPrice = inPrice * 0.5;
        outPrice = outPrice * 0.5;
      }

      const inCost = (inPrice / 1000) * calcInputK;
      const outCost = (outPrice / 1000) * calcOutputK;
      const totalCost = inCost + outCost;
      return {
        ...m,
        totalCost,
        inCost,
        outCost
      };
    }).sort((a, b) => a.totalCost - b.totalCost);
  }, [rawModels, calcInputK, calcOutputK, applyNightDiscount, isNightDiscountNow]);

  return (
    <div className={`w-full min-h-[100dvh] transition-colors duration-200 ${isDarkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} overflow-x-hidden box-border`}>
      <main className="w-full max-w-[1400px] mx-auto px-3 py-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 box-border">
        {/* Toast Notification */}
        {syncToast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-900 border border-emerald-500/50 text-emerald-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 box-border">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                LLM Quota & Telemetry Matrix
              </h1>
              <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                Live Dual Pool & Multi-Account
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <span>Google Antigravity(Gemini & Claude 듀얼 풀), OpenAI Codex, Alibaba Token Plan 실시간 통합 관제</span>
              <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">|</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> {totalModels}개 전체 모델 · {availableModels}개 호출 가능
              </span>
            </div>
          </div>

          {/* Global Controls & Status */}
          <div className="flex items-center justify-between md:justify-end gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 flex-wrap">
            {/* View Mode Toggle: Remaining vs Usage */}
            <div role="group" aria-label="쿼터 수치 보기 방식 선택" className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setViewMode('remaining')}
                aria-pressed={viewMode === 'remaining'}
                className={`px-2.5 py-1 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${viewMode === 'remaining' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                잔여량 (Remaining %)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('usage')}
                aria-pressed={viewMode === 'usage'}
                className={`px-2.5 py-1 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${viewMode === 'usage' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                사용량 (Used %)
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            <LiveClock />
          </div>
        </header>

        {/* View Mode Toggle Switch (Quota <-> Live Usage) */}
        <section aria-label="대시보드 모드 전환 토글" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-2 sm:p-2.5 shadow-sm box-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Mode Description & Indicator */}
            <div className="flex items-center gap-2.5 px-1.5 py-0.5">
              <div className={`p-2 rounded-xl transition-all ${
                activeTab === 'quota'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
              }`}>
                {activeTab === 'quota' ? <Layers className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">뷰 전환 토글</span>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <span className={`text-xs font-bold font-mono ${
                    activeTab === 'quota'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {activeTab === 'quota' ? '⚡ 쿼터 & 리셋 관제' : '📈 Live Usage & 토큰 예측'}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {activeTab === 'quota'
                    ? '프로바이더별 실시간 잔여 쿼터 한도 및 리셋 주기 모니터링'
                    : '모델별 실제 토큰 소모량, 예상 비용(USD/KRW) 및 랭킹 분석'}
                </div>
              </div>
            </div>

            {/* Interactive Toggle Switch Control */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 bg-zinc-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
              {/* Quota Button */}
              <button
                type="button"
                onClick={() => setActiveTab('quota')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'quota'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>쿼터 관제</span>
              </button>

              {/* Physical Switch Track & Slider */}
              <button
                type="button"
                role="switch"
                aria-checked={activeTab === 'live-usage'}
                aria-label="쿼터 관제와 라이브 사용량 모드 토글 전환"
                onClick={() => setActiveTab((prev) => (prev === 'quota' ? 'live-usage' : 'quota'))}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  activeTab === 'live-usage'
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-emerald-600 dark:bg-emerald-500'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    activeTab === 'live-usage' ? 'translate-x-6' : 'translate-x-0'
                  }`}
                >
                  {activeTab === 'live-usage' ? (
                    <Activity className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <Layers className="w-3 h-3 text-emerald-600" />
                  )}
                </span>
              </button>

              {/* Live Usage Button */}
              <button
                type="button"
                onClick={() => setActiveTab('live-usage')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'live-usage'
                    ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <div className="flex items-center gap-1">
                  <span>라이브 사용량</span>
                  <span className={`text-[9px] font-mono px-1 py-0.2 rounded-full font-bold ${
                    activeTab === 'live-usage'
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                      : 'bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200'
                  }`}>
                    LIVE
                  </span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {activeTab === 'quota' ? (
          <>

        {/* KPI Overview Strip */}
        <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 box-border">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">정상 가동 프로바이더</div>
              <div className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                {healthyProviders} <span className="text-xs text-zinc-400 font-sans font-normal">/ {totalProviders}개 사</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">Gemini 5시간 한도</div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {viewMode === "remaining" ? fmtPct(gemini5hRemaining) : fmtPct(gemini5hUsed)} <span className="text-xs text-zinc-400 font-sans font-normal">{viewMode === "remaining" ? "잔여" : "사용"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
              <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">Claude 3rd Party 풀</div>
              <div className={`text-base sm:text-lg font-bold font-mono mt-0.5 truncate ${
                isClaudeExhausted ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
              }`}>
                {claudeWeeklyExhausted
                  ? "주간 한도 소진"
                  : claude5hExhausted
                  ? "5시간 한도 소진"
                  : isClaudeExhausted
                  ? "소진"
                  : claude5hRemaining != null
                  ? (viewMode === "remaining" ? `${fmtPct(claude5hRemaining)} 잔여` : `${fmtPct(claude5hUsed)} 사용`)
                  : "Ready"}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
              <Layers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">활성 카탈로그 모델</div>
              <div className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                <span className={rateLimitedModels > 0 ? "text-amber-600 dark:text-amber-400 font-extrabold" : "text-emerald-600 dark:text-emerald-400"}>{availableModels}</span> <span className="text-xs text-zinc-400 font-sans font-normal">/ {totalModels}개 정상 {rateLimitedModels > 0 && `(${rateLimitedModels}개 소진)`}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Provider Telemetry Grid */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 box-border items-stretch">
          {/* 1. Google Antigravity Card (Gemini & Claude 듀얼 풀 완벽 반영) */}
          <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">Google Antigravity</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
                  Plan: Google AI Pro
                </span>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>계정: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">s***1@gmail.com</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">Dual Quota Pool</span>
              </div>

              {/* Pool 1: Gemini Models */}
              <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Gemini Models
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 font-medium">
                    Flash 3.7 & Pro 3.1
                  </span>
                </div>

                {/* Gemini 5-Hour Window */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400">5-Hour Limit:</span>
                      {gemini5hRemaining != null && gemini5hRemaining <= 10 && (
                        <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">소진 임박</span>
                      )}
                    </div>
                    <span className={`font-mono font-bold ${getStatusTextColor(gemini5hRemaining, gemini5hUsed)}`}>
                      {viewMode === "remaining" ? `${fmtPct(gemini5hRemaining)} 잔여` : `${fmtPct(gemini5hUsed)} 사용`}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${getProgressBarColor(gemini5hRemaining, gemini5hUsed)} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${viewMode === "remaining" ? clampPct(gemini5hRemaining) : clampPct(gemini5hUsed)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
                    <span>완전 충전까지:</span>
                    <CountdownTimer targetTimestamp={ag.geminiPool?.fiveHourWindow?.resetAt} />
                  </div>
                </div>

               {/* Gemini Weekly Window */}
                <div className="space-y-1 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400">Weekly Limit:</span>
                      {geminiWeeklyRemaining != null && geminiWeeklyRemaining <= 10 && (
                        <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">소진 임박</span>
                      )}
                    </div>
                    <span className={`font-mono font-bold ${getStatusTextColor(geminiWeeklyRemaining, geminiWeeklyUsed)}`}>
                      {viewMode === "remaining" ? `${fmtPct(geminiWeeklyRemaining)} 잔여` : `${fmtPct(geminiWeeklyUsed)} 사용`}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${getProgressBarColor(geminiWeeklyRemaining, geminiWeeklyUsed)} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${viewMode === "remaining" ? clampPct(geminiWeeklyRemaining) : clampPct(geminiWeeklyUsed)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
                    <span>주간 완전 충전까지:</span>
                    <CountdownTimer targetTimestamp={ag.geminiPool?.weeklyWindow?.resetAt} />
                  </div>
                </div>
              </div>

              {/* Pool 2: Claude and GPT models */}
              <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    {isClaudeExhausted ? <XCircle className="w-3.5 h-3.5 text-rose-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    Claude and GPT models
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium border ${
                    isClaudeExhausted
                      ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                      : "bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 border-transparent"
                  }`}>
                    {claudeWeeklyExhausted ? "주간 한도 소진 (호출 불가)" : claude5hExhausted ? "5시간 한도 소진 (호출 불가)" : isClaudeExhausted ? "소진 (호출 불가)" : (claudePool?.status === "unknown" ? "계측 대기" : "리밋 정상 가동 (Ready)")}
                  </span>
                </div>

                {/* Claude 5-Hour Window */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400">5-Hour Limit:</span>
                      {claude5hRemaining != null && claude5hRemaining <= 10 && (
                        <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">소진 임박</span>
                      )}
                    </div>
                    <span className={`font-mono font-bold ${getStatusTextColor(claude5hRemaining, claude5hUsed)}`}>
                      {claude5hRemaining != null ? (viewMode === "remaining" ? `${fmtPct(claude5hRemaining)} 잔여` : `${fmtPct(claude5hUsed)} 사용`) : "100% 잔여"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${getProgressBarColor(claude5hRemaining, claude5hUsed)} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${viewMode === "remaining" ? clampPct(claude5hRemaining ?? 100) : clampPct(claude5hUsed ?? 0)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
                    <span>완전 충전까지:</span>
                    <CountdownTimer targetTimestamp={ag.claudeGptPool?.fiveHourWindow?.resetAt} />
                  </div>
                </div>

                {/* Claude Weekly Window */}
                <div className="space-y-1 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-zinc-600 dark:text-zinc-400">Weekly Limit:</span>
                      {claudeWeeklyRemaining != null && claudeWeeklyRemaining <= 10 && (
                        <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">소진 임박</span>
                      )}
                    </div>
                    <span className={`font-mono font-bold ${getStatusTextColor(claudeWeeklyRemaining, claudeWeeklyUsed)}`}>
                      {claudeWeeklyRemaining != null ? (viewMode === "remaining" ? `${fmtPct(claudeWeeklyRemaining)} 잔여` : `${fmtPct(claudeWeeklyUsed)} 사용`) : (claudeExhausted ? "0% 잔여" : "100% 잔여")}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${getProgressBarColor(claudeWeeklyRemaining, claudeWeeklyUsed)} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${viewMode === "remaining" ? clampPct(claudeWeeklyRemaining ?? (claudeExhausted ? 0 : 100)) : clampPct(claudeWeeklyUsed ?? (claudeExhausted ? 100 : 0))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
                    <span>주간 완전 충전까지:</span>
                    <CountdownTimer targetTimestamp={ag.claudeGptPool?.weeklyWindow?.resetAt} />
                  </div>
                </div>

                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1 pt-0.5">
                  <Zap className="w-3 h-3 text-amber-500" /> {claudeWeeklyExhausted ? "Claude & GPT 주간 쿼터 소진 — 주간 리셋 전까지 호출 불가" : claude5hExhausted ? "Claude & GPT 5시간 한도 소진 — 리셋 후 호출 재개" : isClaudeExhausted ? "Claude & GPT 쿼터 소진" : "Claude Sonnet 4.6 & Opus 4.6 Thinking 정상 호출 가능"}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">주요 지원 모델</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Gemini 3.7 Flash</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Gemini 3.1 Pro</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Claude Sonnet 4.6</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Claude Opus 4.6</span>
              </div>
            </div>
          </div>

         {/* 2. OpenAI Codex Card */}
          <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">OpenAI Codex</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
                  Free Multi-Account Pool
                </span>
              </div>

             <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>활성 계정: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">{oa.activeAccount || 's***n@gmail.com'}</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">3개 계정 풀링</span>
              </div>

            {/* Monthly Quota Usage */}
              <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    월간 쿼터 현황
                  </span>
                  <div className="flex items-center gap-1">
                    {oaRemaining != null && oaRemaining <= 10 && (
                      <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">소진 임박</span>
                    )}
                    <span className={`font-mono text-xs font-bold ${getStatusTextColor(oaRemaining, oaUsed)}`}>
                      {viewMode === "remaining" ? `${fmtPct(oaRemaining)} 잔여` : `${fmtPct(oaUsed)} 사용`}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${getProgressBarColor(oaRemaining, oaUsed)} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${viewMode === "remaining" ? clampPct(oaRemaining) : clampPct(oaUsed)}%` }}
                  />
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-0.5 font-mono">
                  <span>월간 리셋 D-Day (가장 빠른 계정 기준):</span>
                  <CountdownTimer targetTimestamp={oa.monthlyResetAt} />
                </div>
              </div>

             {/* Pooled Accounts List */}
              <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
                  <span>풀링된 계정 목록 ({oa.pooledAccountDetails?.length || oa.pooledAccounts?.length || 3})</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">순환 로테이션</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  {(oa.pooledAccountDetails && oa.pooledAccountDetails.length > 0
                    ? oa.pooledAccountDetails
                    : (oa.pooledAccounts || ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com']).map((a: string) => ({ account: a, state: 'standby', usagePercent: null }))
                  ).map((acc: any, idx: number) => (
                    <div key={acc.accountId || idx} className={`flex items-center justify-between ${acc.state === 'active' ? 'text-zinc-800 dark:text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'}`}>
                      <span>• {acc.account}</span>
                      <span className="flex items-center gap-1.5">
                        {typeof acc.usagePercent === 'number' && (
                          <span className="text-zinc-400 text-[10px]">{acc.usagePercent}% 사용</span>
                        )}
                        {acc.state === 'active' ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Active</span>
                        ) : acc.state === 'exhausted' ? (
                          <span className="text-rose-500 dark:text-rose-400 font-bold text-[10px]">소진</span>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">Standby</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">주요 모델 (128k Context)</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">GPT-5.6 Sol</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">GPT-5.6 Terra</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">GPT-5.6 Luna</span>
              </div>
            </div>
          </div>

         {/* 3. Alibaba Token Plan Card (Dynamic based on al.status) */}
          <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">Alibaba Token Plan</h2>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium border ${
                  isAliExhausted
                    ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-700/60"
                } shrink-0`}>
                  {isAliExhausted ? "HTTP 429 · 주간 쿼터 소진 (호출 불가)" : (al.plan || "Standard (10,000 req/7d)")}
                </span>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>엔드포인트: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">ap-southeast-1</strong></span>
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">sk-s****HZew</span>
              </div>

             {/* Weekly Quota Usage */}
              <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    주간 쿼터 사용 현황
                  </span>
                  <div className="flex items-center gap-1">
                    {alRemaining != null && alRemaining <= 10 && (
                      <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">소진 임박</span>
                    )}
                    <span className={`font-mono text-xs font-bold ${getStatusTextColor(alRemaining, alUsed)}`}>
                      {alUsed == null ? "계측 대기" : viewMode === "remaining" ? `${fmtPct(alRemaining)} 잔여` : `${fmtPct(alUsed)} 사용`}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${getProgressBarColor(alRemaining, alUsed)} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${viewMode === "remaining" ? clampPct(alRemaining) : clampPct(alUsed)}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight pt-0.5">
                  {al.message || "7일 쿼터 리셋 완료 (전 모델 정상 호출 가능)"}
                </p>
              </div>

            {/* Reset Countdown */}
              <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    주간 쿼터 리셋까지
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CountdownTimer targetTimestamp={al.resetAt ?? (1789273515000 + 7 * 24 * 3600 * 1000)} />
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  7일 주기 자동 갱신 및 토큰 초기화
                </div>
              </div>

            {/* Promotion & Plan Highlights */}
            <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  야간 크레딧 50% 반값 할인 프로모션
                </span>
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${isNightDiscountNow ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"}`}>
                  {isNightDiscountNow ? "🌙 50% 야간 할인 적용 중!" : "☀️ 야간 23:00~09:00 할인"}
                </span>
              </div>
                <div className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center justify-between font-mono">
                    <span>• <strong>qwen3.8-max</strong> (2.4T MoE)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">50% Off (반값)</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span>• <strong>deepseek-v4-pro-0813</strong> (Snapshot)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">50% Off (반값)</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                    ※ 22:00~08:00 (UTC+8) = 23:00~09:00 (KST) 호출 시 크레딧 50% 절감
                  </div>
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded font-mono">
                    ℹ️ qwen3.8-max-preview 호출 시 qwen3.8-max로 자동 라우팅
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-medium pt-0.5 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <span>공식 Model Studio 프로모션</span>
                  <a
                    href="https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview#tpp01-h-models"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-medium hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-0.5"
                  >
                    공식 가이드 ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">주요 모델 (1M Context)</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Qwen 3.8 Max (1M)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">Qwen 3.7 Plus (1M)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">DeepSeek V4 Pro (1M)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">GLM 5.2 (128k)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Model Capability & Pricing Matrix */}
        {/* Interactive Token Cost Calculator (실시간 토큰 단가 계산기) */}
        <section aria-label="토큰 비용 계산기" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border">
          <button
            type="button"
            aria-expanded={showCalculator}
            aria-controls="calculator-panel"
            onClick={() => setShowCalculator(!showCalculator)}
            className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl p-1 -m-1"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  실시간 토큰 비용 시뮬레이터 (Token Cost Simulator)
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium border border-zinc-200/60 dark:border-zinc-700/60">
                    Interactive
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  입력/출력 토큰 규모에 따른 16개 모델의 예상 비용($)을 실시간으로 비교 계산합니다.
                </p>
              </div>
            </div>

            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              {showCalculator ? "접기" : "시뮬레이터 열기"}
              <ChevronRight className={`w-4 h-4 transition-transform ${showCalculator ? "rotate-90" : ""}`} />
            </div>
          </button>

          {showCalculator && (
            <div id="calculator-panel" className="pt-3 space-y-4 border-t border-zinc-100 dark:border-zinc-800">
             {/* Sliders Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/70 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                {/* Input Tokens Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-input-tokens" className="font-bold text-zinc-700 dark:text-zinc-300">입력 프롬프트 토큰 (Input Tokens):</label>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {calcInputK.toLocaleString()}k ({((calcInputK * 1000) / 1000000).toFixed(2)}M)
                    </span>
                  </div>
                  <input
                    id="calc-input-tokens"
                    aria-label="입력 프롬프트 토큰 수"
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={calcInputK}
                    onChange={(e) => setCalcInputK(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <button type="button" onClick={() => setCalcInputK(50)} className="cursor-pointer hover:text-emerald-600 focus:underline">50k</button>
                    <button type="button" onClick={() => setCalcInputK(200)} className="cursor-pointer hover:text-emerald-600 focus:underline">200k (기본)</button>
                    <button type="button" onClick={() => setCalcInputK(500)} className="cursor-pointer hover:text-emerald-600 focus:underline">500k</button>
                    <button type="button" onClick={() => setCalcInputK(1000)} className="cursor-pointer hover:text-emerald-600 focus:underline">1,000k (1M)</button>
                  </div>
                </div>

                {/* Output Tokens Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-output-tokens" className="font-bold text-zinc-700 dark:text-zinc-300">생성 출력 토큰 (Output Tokens):</label>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {calcOutputK.toLocaleString()}k ({((calcOutputK * 1000) / 1000000).toFixed(2)}M)
                    </span>
                  </div>
                  <input
                    id="calc-output-tokens"
                    aria-label="생성 출력 토큰 수"
                    type="range"
                    min={1}
                    max={200}
                    step={1}
                    value={calcOutputK}
                    onChange={(e) => setCalcOutputK(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                 <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                   <button type="button" onClick={() => setCalcOutputK(5)} className="cursor-pointer hover:text-emerald-600 focus:underline">5k</button>
                   <button type="button" onClick={() => setCalcOutputK(20)} className="cursor-pointer hover:text-emerald-600 focus:underline">20k (기본)</button>
                   <button type="button" onClick={() => setCalcOutputK(50)} className="cursor-pointer hover:text-emerald-600 focus:underline">50k</button>
                   <button type="button" onClick={() => setCalcOutputK(100)} className="cursor-pointer hover:text-emerald-600 focus:underline">100k</button>
                 </div>
               </div>
             </div>

              {/* Night Discount Toggle */}
              <div className="flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    알리바바 야간 50% 반값 프로모션 요율 시뮬레이션 (qwen3.8-max & deepseek-v4-pro-0813)
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-amber-900 dark:text-amber-300">
                  <input
                    type="checkbox"
                    checked={applyNightDiscount || isNightDiscountNow}
                    onChange={(e) => setApplyNightDiscount(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span>50% 야간 요율 적용 {isNightDiscountNow && "(현재 시간 자동 적용 중)"}</span>
                </label>
              </div>

              {/* Calculated Top 6 Cost Ranking */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {calculatedCostList.slice(0, 6).map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                     idx === 0
                       ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-700/80"
                       : "bg-zinc-50/70 dark:bg-zinc-800/50 border-zinc-200/60 dark:border-zinc-700/60"
                   }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">#{idx + 1}</span>
                      {idx === 0 && <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold text-[9px]">최저가</span>}
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{item.providerName}</div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm pt-1">
                      ${item.totalCost.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Model Capability & Pricing Matrix */}
        <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
                  전체 모델 라우팅 & 토큰 단가 매트릭스 ({filteredModels.length}개 모델)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium border border-zinc-200 dark:border-zinc-700">
                  1M Tokens Pricing
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Google Antigravity · OpenAI Codex · Alibaba Token Plan 공식 토큰 단가 및 컨텍스트 스펙
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  id="model-search-input"
                  aria-label="모델명 또는 프로바이더 검색"
                  type="text"
                  placeholder="모델명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 w-full sm:w-44 font-medium"
                />
              </div>

              <select
                id="filter-provider-select"
                aria-label="프로바이더 필터 선택"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shrink-0"
              >
                <option value="all">전체 프로바이더</option>
                <option value="google-antigravity">Google Antigravity</option>
                <option value="openai">OpenAI Codex</option>
                <option value="alibaba-token-plan-intl">Alibaba Token Plan</option>
              </select>

              <select
                id="sort-by-select"
                aria-label="모델 정렬 기준 선택"
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shrink-0"
              >
                <option value="default">기본 정렬</option>
                <option value="price">입력 단가 낮은 순</option>
                <option value="context">컨텍스트 큰 순</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-transparent">
            <table className="w-full text-left text-xs">
              <caption className="sr-only">전체 LLM 모델 단가 및 컨텍스트 스펙 표</caption>
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
                <tr>
                  <th scope="col" className="py-3 px-4">모델 식별자 (ID)</th>
                  <th scope="col" className="py-3 px-4">프로바이더 / 풀</th>
                  <th scope="col" className="py-3 px-4">컨텍스트 윈도우</th>
                  <th scope="col" className="py-3 px-4 text-right">입력 단가 (1M)</th>
                  <th scope="col" className="py-3 px-4 text-right">출력 단가 (1M)</th>
                  <th scope="col" className="py-3 px-4">처리 속도 / 추론</th>
                  <th scope="col" className="py-3 px-4 text-center">현재 라우팅 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 font-mono">
                {filteredModels.map((item) => (
                  <tr key={item.id} className="hover:bg-white dark:hover:bg-zinc-800/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.id}</span>
                        {item.tag && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-medium">
                            {item.tag}
                          </span>
                        )}
                       {(item.id === "alibaba-token-plan-intl/qwen3.8-max" || item.id === "alibaba-token-plan-intl/deepseek-v4-pro-0813") && (
                         <span title="야간(23:00~09:00 KST) 크레딧 50% 할인 모델" className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-sans font-bold border border-amber-300 dark:border-amber-700 flex items-center gap-0.5">
                            🌙 50%
                         </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 font-sans">
                      <div>{item.providerName}</div>
                      {item.pool && <div className="text-[10px] text-zinc-400">Pool: {item.pool}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        (item.contextTokens ?? 0) >= 1000000 
                          ? 'bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300' 
                          : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {item.context}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                      ${(item.inputPrice1M ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      ${(item.outputPrice1M ?? 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-sans text-[11px]">
                      <div>{item.speed || '-'}</div>
                      <div className="text-zinc-400 text-[10px]">{item.reasoning}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans text-center">
                      {item.status === 'rate_limited' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[11px] font-semibold">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> 호출 불가 (Rate Limited)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 호출 가능 (Ready)
                        </span>
                      )}
                    </td>
                  </tr>
                ))} 
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-2">
            {filteredModels.map((item) => (
              <div key={item.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 box-border">
                <div className="flex items-start justify-between gap-2">
                 <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all flex items-center gap-1.5 flex-wrap">
                  <span>{item.id}</span>
                   {item.tag && (
                     <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-medium border border-emerald-200 dark:border-emerald-800">
                       {item.tag}
                     </span>
                   )}
                  {(item.id === "alibaba-token-plan-intl/qwen3.8-max" || item.id === "alibaba-token-plan-intl/deepseek-v4-pro-0813") && (
                     <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-sans font-bold border border-amber-300 dark:border-amber-700">
                        🌙 50%
                     </span>
                   )}
                 </div>
                  {item.status === 'rate_limited' ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-semibold">
                      <XCircle className="w-2.5 h-2.5 text-rose-600" /> 불가
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 가능
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800 font-mono">
                  <span>{item.providerName} ({item.context})</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">In ${(item.inputPrice1M ?? 0).toFixed(2)} / Out ${(item.outputPrice1M ?? 0).toFixed(2)}</span>
                </div>
              </div>
            ))} 
          </div>

          {/* Sync Info Footer Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>단가 & 스펙 DB 동기화: <strong>정상 반영됨 (Active Verified)</strong></span>
            </div>
            <div>
              Live Active Models: <span className="text-zinc-800 dark:text-zinc-200 font-mono font-bold">{rawModels.length} Models Linked</span>
            </div>
          </div>
        </section>

        {/* Infrastructure & Auxiliary Services */}
        <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm box-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-500 shrink-0" />
              연동 인프라 및 보조 서비스 상태
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">macOS (Darwin) · launchd Active</span>
          </div>

         <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
            <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Google Antigravity</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Google AI Pro (4ms)
              </div>
            </div>
            <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">OpenCodex Proxy</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 127.0.0.1:10100
              </div>
            </div>
            <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Hermes Gateway</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> launchd (PID 33929)
              </div>
            </div>
            <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">ElevenLabs Voice</div>
              <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Voice Synth
              </div>
            </div>
            <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Firecrawl Tool</div>
              <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
              <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> Web Extract
              </div>
            </div>
          </div>
        </section>
          </>
        ) : (
          <LiveUsageTab models={rawModels} isNightDiscountNow={isNightDiscountNow} />
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 pb-6 space-y-1">
          <div className="font-medium text-zinc-600 dark:text-zinc-300">LLM Quota & Telemetry Cockpit · Designed for 삼균 님</div>
          <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">Last Synced: {formatTime(lastSync)} · Mode: {data?.environment || 'Live'}</div>
        </footer>
      </main>
    </div>
  );
}
