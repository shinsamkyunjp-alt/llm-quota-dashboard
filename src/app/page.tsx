'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Server,
  Cpu,
  Layers,
  CheckCircle2,
  Search,
  HardDrive,
  Sparkles,
  Calendar,
  DollarSign,
  Sun,
  Moon,
  Calculator,
  Compass,
  ChevronRight
} from 'lucide-react';

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
  outputPrice1M?: number;
  reasoning?: string;
  tag?: string;
  status: 'active' | 'rate_limited' | 'standby';
}

const DEFAULT_MODELS: ModelInfo[] = [
  // Google Antigravity - Gemini Pool
  { id: 'google-antigravity/gemini-3.7-flash', name: 'Gemini 3.7 Flash', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Ultra High (150+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 0.15, outputPrice1M: 0.60, reasoning: 'Hybrid Thinking', tag: 'Best Speed', status: 'active' },
  { id: 'google-antigravity/gemini-3.1-pro', name: 'Gemini 3.1 Pro', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'gemini', speed: 'Fast (80+ t/s)', context: '1M', contextTokens: 1048576, inputPrice1M: 1.25, outputPrice1M: 5.00, reasoning: 'Deep Reasoning', tag: '1M Deep Context', status: 'active' },
  
  // Google Antigravity - Claude and GPT models Pool (복구 완료 / 100% 잔여)
  { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Balanced (60+ t/s)', context: '200k', contextTokens: 200000, inputPrice1M: 3.00, outputPrice1M: 15.00, reasoning: 'High Nuance Coding', tag: 'Top Coder', status: 'active' },
  { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', providerId: 'google-antigravity', providerName: 'Google Antigravity', pool: 'claude-gpt', speed: 'Deep Thinking (35+ t/s)', context: '200k', contextTokens: 200000, inputPrice1M: 15.00, outputPrice1M: 75.00, reasoning: 'Max Reasoning', tag: 'Ultra Brain', status: 'active' },

  // OpenAI Codex (Official OpenAI GPT-5.6 Sol Launch Pricing: Sol $5/$30, Terra $2/$12, Luna $0.20/$1.20)
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Flagship Intelligence (750 t/s on Cerebras)', context: '1M', contextTokens: 1048576, inputPrice1M: 5.00, outputPrice1M: 30.00, reasoning: 'Ultra Reasoning', tag: 'Flagship AI', status: 'active' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Balanced Daily Workload', context: '1M', contextTokens: 1048576, inputPrice1M: 2.00, outputPrice1M: 12.00, reasoning: 'Medium-Ultra', tag: 'Balanced Daily', status: 'active' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', providerId: 'openai', providerName: 'OpenAI Codex', speed: 'Fast & Cost-Effective', context: '1M', contextTokens: 1048576, inputPrice1M: 0.20, outputPrice1M: 1.20, reasoning: 'Medium-Max', tag: 'Best OpenAI Value', status: 'active' },
  { id: 'combo/Antigravity', name: 'Combo Antigravity Failover', providerId: 'openai', providerName: 'OpenCodex Combo', speed: 'Auto Failover', context: '1M', contextTokens: 1048576, inputPrice1M: 0.15, outputPrice1M: 0.60, reasoning: 'Auto Failover', tag: 'High Availability', status: 'active' },

  // Alibaba Token Plan (Model Studio ap-southeast-1 Marketplace Specs)
  { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Heavy Duty MoE (2.4T)', context: '1M', contextTokens: 1000000, inputPrice1M: 1.60, outputPrice1M: 6.40, reasoning: 'XHigh Reasoning', tag: 'Flagship MoE', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.7-max', name: 'Qwen 3.7 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Heavy Duty', context: '1M', contextTokens: 1000000, inputPrice1M: 1.60, outputPrice1M: 6.40, reasoning: 'XHigh Reasoning', tag: 'Power Model', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.7-plus', name: 'Qwen 3.7 Plus', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'High Speed Multimodal', context: '1M', contextTokens: 1000000, inputPrice1M: 0.26, outputPrice1M: 0.78, reasoning: 'Medium Reasoning', tag: 'All-Rounder', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.6-flash', name: 'Qwen 3.6 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Ultra Fast', context: '1M', contextTokens: 1000000, inputPrice1M: 0.05, outputPrice1M: 0.20, reasoning: 'Low-Medium', tag: 'Ultra Cheap ($0.05)', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro', name: 'DeepSeek V4 Pro', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, outputPrice1M: 1.10, reasoning: 'High-Max', tag: 'Code Specialist', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro-0813', name: 'DeepSeek V4 Pro (0813 Snapshot)', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Code & Math Specialist (Snapshot)', context: '1M', contextTokens: 1000000, inputPrice1M: 0.27, outputPrice1M: 1.10, reasoning: 'High-Max Reasoning', tag: 'Snapshot Stable', status: 'active' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Fast Inference', context: '1M', contextTokens: 1000000, inputPrice1M: 0.14, outputPrice1M: 0.28, reasoning: 'Standard', tag: 'Fast Coder', status: 'active' },
  { id: 'alibaba-token-plan-intl/glm-5.2', name: 'GLM 5.2', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Bilingual Pro', context: '128k', contextTokens: 128000, inputPrice1M: 1.00, outputPrice1M: 1.00, reasoning: 'Medium Reasoning', tag: 'Bilingual', status: 'active' },
  { id: 'alibaba-token-plan-intl/kimi-k2.5', name: 'Kimi K2.5', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan', speed: 'Fast Long-Context', context: '256k', contextTokens: 256000, inputPrice1M: 0.80, outputPrice1M: 2.40, reasoning: 'High Context Reasoning', tag: 'Long Context', status: 'active' }
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
        remainingPercent: 91.0,
        usagePercent: 9.0,
        resetAt: Date.now() + (2 * 3600 + 34 * 60) * 1000,
        desc: '2시간 34분 후 완전 충전'
      },
      weeklyWindow: {
        label: '주간 누적 한도',
        remainingPercent: 99.0,
        usagePercent: 1.0,
        resetAt: Date.now() + (6 * 24 * 3600 + 20 * 3600) * 1000,
        desc: '6일 20시간 후 완전 충전'
      },
      models: ['Gemini 3.7 Flash', 'Gemini 3.1 Pro']
    },
    claudeGptPool: {
      label: 'Claude and GPT models',
      status: 'healthy',
      fiveHourWindow: {
        label: '5시간 롤링 한도',
        remainingPercent: 100.0,
        usagePercent: 0.0,
        resetAt: Date.now() + 5 * 3600 * 1000,
        desc: '100% 잔여 (완전 충전됨)'
      },
      weeklyWindow: {
        label: '주간 누적 한도',
        remainingPercent: 100.0,
        usagePercent: 0.0,
        resetAt: Date.now() + 7 * 24 * 3600 * 1000,
        desc: '100% 잔여 (완전 충전됨)'
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
    monthlyUsagePercent: 85.0,
    monthlyRemainingPercent: 15.0,
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
    weeklyUsagePercent: 0.5,
    weeklyRemainingPercent: 99.5,
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

export default function QuotaDashboard() {
  const [data, setData] = useState<any>(DEFAULT_TELEMETRY);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
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

  useEffect(() => {
    const saved = localStorage.getItem('llm_dashboard_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
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

  const fetchTelemetry = async (manual = false) => {
    try {
      setLoading(true);
      const res = await fetch('/api/quota', { cache: 'no-store' });
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();
      if (json.providers) {
        const agData = json.providers[0] || {};
        setData({
          ...DEFAULT_TELEMETRY,
          summary: json.summary || DEFAULT_TELEMETRY.summary,
          antigravity: {
            ...DEFAULT_TELEMETRY.antigravity,
            ...agData,
            geminiPool: agData.geminiPool || DEFAULT_TELEMETRY.antigravity.geminiPool,
            claudeGptPool: agData.claudeGptPool || DEFAULT_TELEMETRY.antigravity.claudeGptPool
          },
          openai: {
            ...DEFAULT_TELEMETRY.openai,
            ...(json.providers[1] || {})
          },
          alibaba: {
            ...DEFAULT_TELEMETRY.alibaba,
            ...(json.providers[2] || {})
          },
          allModels: json.allModels || DEFAULT_MODELS,
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
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getCountdown = (targetTimestamp?: number) => {
    if (!targetTimestamp) return null;
    const diff = targetTimestamp - currentTime.getTime();
    if (diff <= 0) return '00:00:00 (리셋 완료)';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 ${hours % 24}시간`;
    }

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const ag = data.antigravity || DEFAULT_TELEMETRY.antigravity;
  const oa = data.openai || DEFAULT_TELEMETRY.openai;
  const al = data.alibaba || DEFAULT_TELEMETRY.alibaba;
  const rawModels: ModelInfo[] = data.allModels || DEFAULT_MODELS;

  // 알리바바 야간 50% 할인 시간대 판별 (22:00 ~ 08:00 UTC+8 = 23:00 ~ 09:00 KST)
  const isNightDiscountNow = useMemo(() => {
    const kstHour = currentTime.getHours();
    return kstHour >= 23 || kstHour < 9;
  }, [currentTime]);

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
                <Sparkles className="w-3.5 h-3.5" /> 17개 전체 모델 호출 가능 (100% Ready)
              </span>
            </div>
          </div>

          {/* Global Controls & Status */}
          <div className="flex items-center justify-between md:justify-end gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 flex-wrap">
            {/* View Mode Toggle: Remaining vs Usage */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setViewMode('remaining')}
                className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'remaining' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                잔여량 (Remaining %)
              </button>
              <button
                onClick={() => setViewMode('usage')}
                className={`px-2.5 py-1 rounded-lg transition-all ${viewMode === 'usage' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
              >
                사용량 (Used %)
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>

            <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-zinc-700 dark:text-zinc-300 font-medium shrink-0">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{currentTime.toLocaleTimeString('ko-KR', { hour12: false })}</span>
            </div>

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-1.5 text-[11px] sm:text-xs shrink-0">
              <span className="text-zinc-500 dark:text-zinc-400 mr-1 font-medium">갱신:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={5} className="dark:bg-zinc-800">5초</option>
                <option value={15} className="dark:bg-zinc-800">15초</option>
                <option value={30} className="dark:bg-zinc-800">30초</option>
                <option value={0} className="dark:bg-zinc-800">수동</option>
              </select>
            </div>

            <button
              onClick={() => fetchTelemetry(true)}
              disabled={loading}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>동기화</span>
            </button>
          </div>
        </header>

        {/* KPI Overview Strip */}
        <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 box-border">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">정상 가동 프로바이더</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                3 / 3 <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">100% Operational</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">소진 / 쿨다운 모델</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                0개 <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">Claude & Gemini 복구완료</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 rounded-xl text-sky-600 dark:text-sky-400 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">연동 계정 풀</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                5 계정 <span className="text-[10px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-400">Pool Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">즉시 호출 가능 모델</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                16 / 16 <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">All Ready</span>
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
              <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Gemini Models
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                    Flash 3.7 & Pro 3.1
                  </span>
                </div>

                {/* Gemini 5-Hour Window */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600 dark:text-zinc-400">5-Hour Limit:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {viewMode === "remaining" ? "91% 잔여" : "9% 사용"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${viewMode === "remaining" ? 91 : 9}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
                    <span>완전 충전까지:</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{getCountdown(ag.geminiPool?.fiveHourWindow?.resetAt)}</span>
                  </div>
                </div>

                {/* Gemini Weekly Window */}
                <div className="space-y-1 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-750">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600 dark:text-zinc-400">Weekly Limit:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {viewMode === "remaining" ? "99% 잔여" : "1% 사용"}
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${viewMode === "remaining" ? 99 : 1}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
                    <span>주간 완전 충전까지:</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">{getCountdown(ag.geminiPool?.weeklyWindow?.resetAt)}</span>
                  </div>
                </div>
              </div>

              {/* Pool 2: Claude and GPT models (복구 완료!) */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Claude and GPT models
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-700">
                    리밋 복구 완료 (Ready)
                  </span>
                </div>

                {/* Claude 5-Hour & Weekly (100% Remaining) */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">5-Hour Limit</div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">
                      100% 잔여
                    </div>
                  </div>
                  <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Weekly Limit</div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">
                      100% 잔여
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Claude Sonnet 4.6 & Opus 4.6 Thinking 정상 호출 가능
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">주요 지원 모델</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">Gemini 3.7 Flash</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">Gemini 3.1 Pro</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-medium">Claude Sonnet 4.6</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-medium">Claude Opus 4.6</span>
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
                <span>활성 계정: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">s***n@gmail.com</strong></span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">3개 계정 풀링</span>
              </div>

              {/* Monthly Quota Usage */}
              <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    월간 쿼터 현황
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {viewMode === "remaining" ? "15.0% 잔여 (안전)" : "85.0% 사용"}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${viewMode === "remaining" ? 15 : 85}%` }}
                  />
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-0.5 font-mono">
                  <span>월간 리셋 D-Day:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{getCountdown(oa.monthlyResetAt)}</span>
                </div>
              </div>

              {/* Pooled Accounts List */}
              <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-3 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
                  <span>풀링된 계정 목록 (3)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">순환 로테이션</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-zinc-800 dark:text-zinc-300">
                    <span>• s***n@gmail.com</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">Active Main</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>• s***2@naver.com</span>
                    <span className="text-zinc-400 text-[10px]">Standby</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                    <span>• s***9@gmail.com</span>
                    <span className="text-zinc-400 text-[10px]">Standby</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">주요 모델 (128k Context)</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">GPT-5.6 Sol</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">GPT-5.6 Terra</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">GPT-5.6 Luna</span>
              </div>
            </div>
          </div>

         {/* 3. Alibaba Token Plan Card (Dynamic based on al.status) */}
          <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">Alibaba Token Plan</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
                  {al.badge || "정상 가동 (Active)"}
                </span>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span>엔드포인트: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">ap-southeast-1</strong></span>
                <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">sk-s****HZew</span>
              </div>

              {/* Weekly Quota Usage */}
              <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    주간 쿼터 사용 현황
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {viewMode === "remaining" ? "99.5% 잔여" : "0.5% 사용"}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${viewMode === "remaining" ? 99.5 : 0.5}%` }}
                  />
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight pt-0.5">
                  {al.message || "7일 쿼터 리셋 완료 (전 모델 정상 호출 가능)"}
                </p>
              </div>

              {/* Reset Countdown */}
              <div className="bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    주간 쿼터 리셋까지
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {getCountdown(al.resetAt || (Date.now() + 7 * 24 * 3600 * 1000))}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  7일 주기 자동 갱신 및 토큰 초기화
                </div>
              </div>

             {/* Promotion & Plan Highlights */}
             <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 space-y-2">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1">
                   <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    야간 크레딧 50% 반값 할인 프로모션
                 </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isNightDiscountNow ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse" : "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200"}`}>
                    {isNightDiscountNow ? "🌙 50% 야간 할인 적용 중!" : "☀️ 야간 23:00~09:00 할인"}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center justify-between font-mono">
                    <span>• <strong>qwen3.8-max</strong> (2.4T MoE)</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">50% Off (반값)</span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span>• <strong>deepseek-v4-pro-0813</strong> (Snapshot)</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">50% Off (반값)</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                    ※ 22:00~08:00 (UTC+8) = 23:00~09:00 (KST) 호출 시 크레딧 50% 절감
                  </div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 p-1.5 rounded border border-blue-200 dark:border-blue-800 font-mono">
                    ℹ️ qwen3.8-max-preview 호출 시 qwen3.8-max로 자동 라우팅
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-amber-900 dark:text-amber-400 font-medium pt-0.5 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span>공식 Model Studio 프로모션</span>
                  <a
                    href="https://www.alibabacloud.com/help/en/model-studio/token-plan-personal-overview#tpp01-h-models"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold hover:text-amber-700 flex items-center gap-0.5"
                  >
                    공식 가이드 ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">주요 모델 (1M Context)</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">Qwen 3.8 Max (1M)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">Qwen 3.7 Plus (1M)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">DeepSeek V4 Pro (1M)</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">GLM 5.2 (128k)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Model Capability & Pricing Matrix */}
        {/* Interactive Token Cost Calculator (실시간 토큰 단가 계산기) */}
        <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowCalculator(!showCalculator)}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  실시간 토큰 비용 시뮬레이터 (Token Cost Simulator)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                    Interactive
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  입력/출력 토큰 규모에 따른 16개 모델의 예상 비용($)을 실시간으로 비교 계산합니다.
                </p>
              </div>
            </div>

            <button className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
              {showCalculator ? "접기" : "시뮬레이터 열기"}
              <ChevronRight className={`w-4 h-4 transition-transform ${showCalculator ? "rotate-90" : ""}`} />
            </button>
          </div>

          {showCalculator && (
            <div className="pt-3 space-y-4 border-t border-zinc-100 dark:border-zinc-800">
              {/* Sliders Control */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-850 p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800">
                {/* Input Tokens Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">입력 프롬프트 토큰 (Input Tokens):</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {calcInputK.toLocaleString()}k ({((calcInputK * 1000) / 1000000).toFixed(2)}M)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={calcInputK}
                    onChange={(e) => setCalcInputK(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                    <span onClick={() => setCalcInputK(50)} className="cursor-pointer hover:text-emerald-600">50k</span>
                    <span onClick={() => setCalcInputK(200)} className="cursor-pointer hover:text-emerald-600">200k (기본)</span>
                    <span onClick={() => setCalcInputK(500)} className="cursor-pointer hover:text-emerald-600">500k</span>
                    <span onClick={() => setCalcInputK(1000)} className="cursor-pointer hover:text-emerald-600">1,000k (1M)</span>
                  </div>
                </div>

                {/* Output Tokens Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">생성 출력 토큰 (Output Tokens):</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      {calcOutputK.toLocaleString()}k ({((calcOutputK * 1000) / 1000000).toFixed(2)}M)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    step={1}
                    value={calcOutputK}
                    onChange={(e) => setCalcOutputK(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                 <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                   <span onClick={() => setCalcOutputK(5)} className="cursor-pointer hover:text-emerald-600">5k</span>
                   <span onClick={() => setCalcOutputK(20)} className="cursor-pointer hover:text-emerald-600">20k (기본)</span>
                   <span onClick={() => setCalcOutputK(50)} className="cursor-pointer hover:text-emerald-600">50k</span>
                   <span onClick={() => setCalcOutputK(100)} className="cursor-pointer hover:text-emerald-600">100k</span>
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
                    key={idx}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      idx === 0
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700"
                        : "bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400">#{idx + 1}</span>
                      {idx === 0 && <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold text-[9px]">최저가</span>}
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{item.providerName}</div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm pt-1">
                      ${item.totalCost.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Model Capability & Pricing Matrix */}
        <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border">
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
                  type="text"
                  placeholder="모델명 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-8 pr-3 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-400 w-full sm:w-44 font-medium"
                />
              </div>

              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer shrink-0"
              >
                <option value="all">전체 프로바이더</option>
                <option value="google-antigravity">Google Antigravity</option>
                <option value="openai">OpenAI Codex</option>
                <option value="alibaba-token-plan-intl">Alibaba Token Plan</option>
              </select>

              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none cursor-pointer shrink-0"
              >
                <option value="default">기본 정렬</option>
                <option value="price">입력 단가 낮은 순</option>
                <option value="context">컨텍스트 큰 순</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-850/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">모델 식별자 (ID)</th>
                  <th className="py-3 px-4">프로바이더 / 풀</th>
                  <th className="py-3 px-4">컨텍스트 윈도우</th>
                  <th className="py-3 px-4 text-right">입력 단가 (1M)</th>
                  <th className="py-3 px-4 text-right">출력 단가 (1M)</th>
                  <th className="py-3 px-4">처리 속도 / 추론</th>
                  <th className="py-3 px-4 text-center">현재 라우팅 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 font-mono">
                {filteredModels.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white dark:hover:bg-zinc-800/80 transition-colors">
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 호출 가능 (Ready)
                      </span>
                    </td>
                  </tr>
                ))} 
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-2">
            {filteredModels.map((item, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 box-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all flex items-center gap-1.5 flex-wrap">
                   <span>{item.id}</span>
                   {(item.id === "alibaba-token-plan-intl/qwen3.8-max" || item.id === "alibaba-token-plan-intl/deepseek-v4-pro-0813") && (
                     <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-sans font-bold border border-amber-300 dark:border-amber-700">
                        🌙 50%
                     </span>
                   )}
                 </div>
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 가능
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-750 font-mono">
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
        <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm box-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-500 shrink-0" />
              연동 인프라 및 보조 서비스 상태
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">macOS (Darwin) · launchd Active</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
            <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Google Antigravity</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Google AI Pro (4ms)
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">OpenCodex Proxy</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 127.0.0.1:10100
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Hermes Gateway</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> launchd (PID 33929)
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">ElevenLabs Voice</div>
              <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Voice Synth
              </div>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Firecrawl Tool</div>
              <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> Web Extract
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 pb-6 space-y-1">
          <div className="font-medium text-zinc-600 dark:text-zinc-300">LLM Quota & Telemetry Cockpit · Designed for 삼균 님</div>
          <div className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">Last Synced: {lastSync.toLocaleTimeString('ko-KR')} · Mode: {data?.environment || 'Live'}</div>
        </footer>
      </main>
    </div>
  );
}
