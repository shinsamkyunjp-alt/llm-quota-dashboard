'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Server,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  Search,
  HardDrive,
  DollarSign,
  Calendar,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface ModelItem {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
  context: string;
  contextTokens: number;
  inputPrice1M: number;
  outputPrice1M: number;
  speed: string;
  reasoning: string;
  status: 'active' | 'rate_limited' | 'standby';
}

interface ProviderData {
  provider: string;
  name: string;
  status: 'healthy' | 'exhausted' | 'warning';
  account?: string;
  badge?: string;
  usagePercent?: number;
  remainingPercent?: number;
  monthlyUsagePercent?: number;
  monthlyRemainingPercent?: number;
  resetAt?: number;
  monthlyResetAt?: number;
  windowType?: string;
  plan?: string;
  accountCount?: number;
  pooledAccounts?: string[];
  region?: string;
  message?: string;
  models?: ModelItem[];
}

const INITIAL_MODELS: ModelItem[] = [
  { id: 'google-antigravity/gemini-3.7-flash', name: 'Gemini 3.7 Flash', providerId: 'google-antigravity', providerName: 'Google Antigravity', context: '1,000,000 (1M)', contextTokens: 1000000, inputPrice1M: 0.15, outputPrice1M: 0.60, speed: 'Ultra High (150+ t/s)', reasoning: 'Hybrid Thinking (Low-High)', status: 'active' },
  { id: 'google-antigravity/gemini-3.1-pro', name: 'Gemini 3.1 Pro', providerId: 'google-antigravity', providerName: 'Google Antigravity', context: '1,000,000 (1M)', contextTokens: 1000000, inputPrice1M: 1.25, outputPrice1M: 5.00, speed: 'Fast (80+ t/s)', reasoning: 'Deep Reasoning', status: 'active' },
  { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', providerId: 'google-antigravity', providerName: 'Google Antigravity', context: '200,000 (200k)', contextTokens: 200000, inputPrice1M: 3.00, outputPrice1M: 15.00, speed: 'Balanced (60+ t/s)', reasoning: 'High Nuance', status: 'active' },
  { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', providerId: 'google-antigravity', providerName: 'Google Antigravity', context: '200,000 (200k)', contextTokens: 200000, inputPrice1M: 15.00, outputPrice1M: 75.00, speed: 'Deep Thinking (35+ t/s)', reasoning: 'Max Reasoning', status: 'active' },
  { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', providerId: 'openai', providerName: 'OpenAI Codex Pool', context: '128,000 (128k)', contextTokens: 128000, inputPrice1M: 2.50, outputPrice1M: 10.00, speed: 'High Throughput', reasoning: 'Low-Ultra', status: 'active' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', providerId: 'openai', providerName: 'OpenAI Codex Pool', context: '128,000 (128k)', contextTokens: 128000, inputPrice1M: 5.00, outputPrice1M: 20.00, speed: 'Balanced Reasoning', reasoning: 'Medium-Ultra', status: 'active' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', providerId: 'openai', providerName: 'OpenAI Codex Pool', context: '128,000 (128k)', contextTokens: 128000, inputPrice1M: 1.00, outputPrice1M: 4.00, speed: 'Cost-Effective', reasoning: 'Medium-Max', status: 'active' },
  { id: 'alibaba-token-plan-intl/qwen3.7-plus', name: 'Qwen 3.7 Plus', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '1,000,000 (1M)', contextTokens: 1000000, inputPrice1M: 0.26, outputPrice1M: 0.78, speed: 'High Speed', reasoning: 'Medium Reasoning', status: 'rate_limited' },
  { id: 'alibaba-token-plan-intl/qwen3.6-flash', name: 'Qwen 3.6 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '1,000,000 (1M)', contextTokens: 1000000, inputPrice1M: 0.05, outputPrice1M: 0.20, speed: 'Ultra Fast', reasoning: 'Low-Medium', status: 'rate_limited' },
  { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '131,072 (131k)', contextTokens: 131072, inputPrice1M: 1.60, outputPrice1M: 6.40, speed: 'Heavy Duty', reasoning: 'XHigh Reasoning', status: 'rate_limited' },
  { id: 'alibaba-token-plan-intl/qwen3.7-max', name: 'Qwen 3.7 Max', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '131,072 (131k)', contextTokens: 131072, inputPrice1M: 1.60, outputPrice1M: 6.40, speed: 'Heavy Duty', reasoning: 'XHigh Reasoning', status: 'rate_limited' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-pro', name: 'DeepSeek V4 Pro', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '128,000 (128k)', contextTokens: 128000, inputPrice1M: 0.27, outputPrice1M: 1.10, speed: 'Code & Math Specialist', reasoning: 'High-Max', status: 'rate_limited' },
  { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '128,000 (128k)', contextTokens: 128000, inputPrice1M: 0.14, outputPrice1M: 0.28, speed: 'Fast Inference', reasoning: 'Standard', status: 'rate_limited' },
  { id: 'alibaba-token-plan-intl/glm-5.2', name: 'GLM 5.2', providerId: 'alibaba-token-plan-intl', providerName: 'Alibaba Token Plan (Intl)', context: '128,000 (128k)', contextTokens: 128000, inputPrice1M: 1.00, outputPrice1M: 1.00, speed: 'Bilingual Pro', reasoning: 'Medium Reasoning', status: 'rate_limited' },
  { id: 'combo/Antigravity', name: 'Combo Antigravity Failover', providerId: 'openai', providerName: 'OpenCodex Combo', context: '1,000,000 (1M)', contextTokens: 1000000, inputPrice1M: 0.15, outputPrice1M: 0.60, speed: 'Adaptive Failover', reasoning: 'Auto Failover', status: 'active' }
];

const INITIAL_DATA = {
  updatedAt: Date.now(),
  environment: 'Local Mac Daemon (Live ocx Sync)',
  catalogSync: {
    isLiveConnected: true,
    totalCatalogModels: 15,
    lastWeeklySpecUpdate: '2026-08-15',
    nextWeeklySpecUpdate: '2026-08-22'
  },
  summary: {
    totalProviders: 3,
    healthyProviders: 2,
    exhaustedProviders: 1,
    totalLinkedAccounts: 5,
    activeLLMCount: 15
  },
  providers: [
    {
      provider: 'google-antigravity',
      name: 'Google Antigravity',
      status: 'healthy',
      account: 's***1@gmail.com',
      usagePercent: 11.96,
      remainingPercent: 88.04,
      resetAt: 1786787166000,
      windowType: 'Dynamic Rolling Window'
    },
    {
      provider: 'openai',
      name: 'OpenAI Codex Pool',
      status: 'healthy',
      plan: 'Free Multi-Account Pool',
      accountCount: 3,
      activeAccount: 's***n@gmail.com',
      pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
      monthlyUsagePercent: 9.0,
      monthlyRemainingPercent: 91.0,
      monthlyResetAt: 1789273515000
    },
    {
      provider: 'alibaba-token-plan-intl',
      name: 'Alibaba Token Plan (Intl)',
      status: 'exhausted',
      badge: 'HTTP 429 · Insufficient Quota',
      region: 'ap-southeast-1 (Singapore)',
      account: 'sk-s****HZew',
      resetAt: 1786782180000,
      message: '1-week quota exhausted. Auto-resets at 17:23:00 KST.'
    }
  ],
  allModels: INITIAL_MODELS
};

export default function QuotaDashboard() {
  const [data, setData] = useState<any>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'context'>('default');
  const [refreshInterval, setRefreshInterval] = useState<number>(15);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Fetch telemetry from API
  const fetchTelemetry = async (manual = false) => {
    try {
      setLoading(true);
      const res = await fetch('/api/quota', { cache: 'no-store' });
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();
      setData(json);
      setLastSync(new Date());
      if (manual) {
        setSyncToast('OpenCodex 카탈로그 및 쿼터 실시간 동기화 완료!');
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

  // Clock & countdown tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Helper to format countdown duration
  const getCountdown = (targetTimestamp?: number) => {
    if (!targetTimestamp) return null;
    const diff = targetTimestamp - currentTime.getTime();
    if (diff <= 0) return '00:00:00 (리셋 완료 대기)';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 ${hours % 24}시간 ${mins}분`;
    }

    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const providers: ProviderData[] = data?.providers || INITIAL_DATA.providers;
  const rawModels: ModelItem[] = data?.allModels || INITIAL_MODELS;

  // Filtered & Sorted Models
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
      list = [...list].sort((a, b) => a.inputPrice1M - b.inputPrice1M);
    } else if (sortBy === 'context') {
      list = [...list].sort((a, b) => b.contextTokens - a.contextTokens);
    }

    return list;
  }, [rawModels, filterProvider, searchTerm, sortBy]);

  return (
    <main className="min-h-[100dvh] bg-[#09090b] text-zinc-100 p-4 md:p-8 max-w-[1480px] mx-auto space-y-8">
      {/* Toast Notification */}
      {syncToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              LLM Quota & Telemetry Matrix
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">
              Live Monitor
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm text-zinc-400">
            <span>실시간 AI 프로바이더 쿼터 잔여량, 주간/월간 한도 및 리셋 스케줄 통합 관제</span>
            <span className="text-zinc-600 hidden md:inline">|</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono text-xs">
              <Sparkles className="w-3.5 h-3.5" /> OpenCodex 카탈로그 실시간 연동 ({rawModels.length}개 모델)
            </span>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-zinc-200">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>KST {currentTime.toLocaleTimeString('ko-KR', { hour12: false })}</span>
          </div>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-zinc-400 mr-2">갱신:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value={5} className="bg-zinc-900">5초</option>
              <option value={15} className="bg-zinc-900">15초</option>
              <option value={30} className="bg-zinc-900">30초</option>
              <option value={0} className="bg-zinc-900">수동</option>
            </select>
          </div>

          <button
            onClick={() => fetchTelemetry(true)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-100 hover:bg-white text-zinc-900 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>동기화</span>
          </button>
        </div>
      </header>

      {/* KPI Overview Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-medium">정상 가동 프로바이더</div>
            <div className="text-xl font-bold text-white mt-0.5">2 / 3 <span className="text-xs font-semibold text-emerald-400">Optimal</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-medium">쿼터 소진 (쿨다운)</div>
            <div className="text-xl font-bold text-white mt-0.5">1 Provider <span className="text-xs font-semibold text-amber-400">Alibaba</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-medium">연동 계정 풀 (Accounts)</div>
            <div className="text-xl font-bold text-white mt-0.5">5 계정 <span className="text-xs font-semibold text-zinc-300">Active</span></div>
          </div>
        </div>

        <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-zinc-300 font-medium">카탈로그 라우팅 모델</div>
            <div className="text-xl font-bold text-white mt-0.5">{rawModels.length} Models <span className="text-xs font-semibold text-zinc-300">Live Sync</span></div>
          </div>
        </div>
      </section>

      {/* Main Provider Telemetry Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Google Antigravity Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h2 className="text-lg font-bold text-white">Google Antigravity</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                정상 (Optimal)
              </span>
            </div>

            <div className="text-xs text-zinc-300 flex items-center justify-between">
              <span>계정: <strong className="text-zinc-100 font-mono">s***1@gmail.com</strong></span>
              <span className="text-zinc-400 font-mono">OAuth 2.0</span>
            </div>

            {/* Quota Meter */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-zinc-300">가용 잔여 한도</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {providers[0]?.remainingPercent ?? 88.04}%
                </span>
              </div>
              
              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${providers[0]?.remainingPercent ?? 88.04}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>소모량: {providers[0]?.usagePercent ?? 11.96}%</span>
                <span>Dynamic Rolling Window</span>
              </div>
            </div>

            {/* Reset Countdown */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>롤링 리셋까지</span>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-300">
                {getCountdown(providers[0]?.resetAt || 1786787166000)}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">주요 모델 (최대 1M Context)</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">Gemini 3.7 Flash</span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">Gemini 3.1 Pro</span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">Claude Sonnet 4.6</span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">Claude Opus 4.6</span>
            </div>
          </div>
        </div>

        {/* 2. OpenAI Codex Card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <h2 className="text-lg font-bold text-white">OpenAI Codex</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-400">
                멀티 계정 풀 (3개)
              </span>
            </div>

            <div className="text-xs text-zinc-300 flex items-center justify-between">
              <span>메인: <strong className="text-zinc-100 font-mono">s***n@gmail.com</strong></span>
              <span className="text-zinc-400 font-mono">Free Pool</span>
            </div>

            {/* Quota Meter */}
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-semibold text-zinc-300">월간 잔여 한도</span>
                <span className="text-2xl font-black text-sky-400 font-mono">
                  {providers[1]?.monthlyRemainingPercent ?? 91.0}%
                </span>
              </div>
              
              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${providers[1]?.monthlyRemainingPercent ?? 91.0}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>월간 사용률: {providers[1]?.monthlyUsagePercent ?? 9.0}%</span>
                <span>3 Accounts Pooled</span>
              </div>
            </div>

            {/* Reset Countdown */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>월간 리셋 (09/13)</span>
              </div>
              <div className="font-mono text-sm font-bold text-sky-300">
                {getCountdown(providers[1]?.monthlyResetAt || 1789273515000)}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">주요 모델 (128k Context)</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">GPT-5.6 Sol</span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">GPT-5.6 Terra</span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 font-medium">GPT-5.6 Luna</span>
            </div>
          </div>
        </div>

        {/* 3. Alibaba Token Plan Card */}
        <div className="bg-zinc-900/80 border border-amber-900/40 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <h2 className="text-lg font-bold text-white">Alibaba Token Plan</h2>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300">
                한도 소진 (429)
              </span>
            </div>

            <div className="text-xs text-zinc-300 flex items-center justify-between">
              <span>엔드포인트: <strong className="text-zinc-100 font-mono">ap-southeast-1</strong></span>
              <span className="text-zinc-400 font-mono">API Key</span>
            </div>

            {/* Quota Status Box */}
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>주간 쿼터 소진 상태</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                현재 주간 토큰 플랜 쿼터가 소진되어 API 요청이 429로 거절됩니다. 오늘 17:23 리셋 시 자동 복구됩니다.
              </p>
            </div>

            {/* Reset Countdown */}
            <div className="bg-zinc-950/80 border border-amber-700/50 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">오늘 리셋까지</span>
              </div>
              <div className="font-mono text-sm font-bold text-amber-300">
                {getCountdown(providers[2]?.resetAt || 1786782180000)}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/60">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">영향받는 모델 (1M 및 131k Context)</div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-900 border border-amber-900/40 text-zinc-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Qwen 3.8 Max (131k)
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-900 border border-amber-900/40 text-zinc-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Qwen 3.7 Plus (1M)
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-900 border border-amber-900/40 text-zinc-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> DeepSeek V4 Pro (128k)
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-zinc-900 border border-amber-900/40 text-zinc-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> GLM 5.2 (128k)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Model Capability & Pricing Matrix */}
      <section className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" />
              <h3 className="text-base font-bold text-white">
                전체 모델 라우팅 & 토큰 단가 매트릭스 ({filteredModels.length}개 모델)
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">
                1M Tokens Pricing
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              OpenCodex 실시간 카탈로그 연동 · 1M 토큰당 입력/출력 공식 단가 및 정확한 컨텍스트 윈도우 명세
            </p>
          </div>

          {/* Controls: Search, Filter, Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="모델/프로바이더 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 w-44 md:w-56"
              />
            </div>

            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="all">전체 프로바이더</option>
              <option value="google-antigravity">Google Antigravity</option>
              <option value="openai">OpenAI Codex</option>
              <option value="alibaba-token-plan-intl">Alibaba Token Plan</option>
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="default">기본 정렬</option>
              <option value="price">입력 단가 낮은 순</option>
              <option value="context">컨텍스트 큰 순</option>
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-zinc-800/80 rounded-xl bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-300 uppercase tracking-wider font-semibold border-b border-zinc-800">
              <tr>
                <th className="py-3.5 px-4">모델 식별자 (Model ID)</th>
                <th className="py-3.5 px-4">프로바이더</th>
                <th className="py-3.5 px-4">컨텍스트 윈도우</th>
                <th className="py-3.5 px-4 text-right">입력 단가 (1M 토큰)</th>
                <th className="py-3.5 px-4 text-right">출력 단가 (1M 토큰)</th>
                <th className="py-3.5 px-4">처리 속도 / 추론</th>
                <th className="py-3.5 px-4 text-center">라우팅 상태</th>
              </tr>
            </thead>
            <tbody id="model-table-body" className="divide-y divide-zinc-800/60 font-mono">
              {filteredModels.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-zinc-200">
                    <div className="flex items-center gap-2">
                      <span>{item.id}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 font-sans">
                    {item.providerName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      item.contextTokens >= 1000000 
                        ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300' 
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                    }`}>
                      {item.context}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-zinc-200 font-mono">
                    ${item.inputPrice1M.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-400 font-mono">
                    ${item.outputPrice1M.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-sans text-[11px]">
                    <div>{item.speed}</div>
                    <div className="text-zinc-500">{item.reasoning}</div>
                  </td>
                  <td className="py-3.5 px-4 font-sans text-center">
                    {item.status === 'active' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> 호출 가능
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> 쿨다운 중 (429)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sync Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-zinc-500 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>단가 & 스펙 DB 주간 동기화: <strong>정상 반영됨 (Weekly Automated Sync)</strong></span>
          </div>
          <div>
            OpenCodex Live Models: <span className="text-zinc-300 font-mono font-bold">{rawModels.length} Models Linked</span>
          </div>
        </div>
      </section>

      {/* Infrastructure & Auxiliary Services */}
      <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-zinc-400" />
            연동 인프라 및 보조 서비스 상태
          </div>
          <span className="text-[11px] text-zinc-400">Host: macOS (Darwin 26.6.1)</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-zinc-400 font-medium">OpenCodex Proxy</div>
            <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> 127.0.0.1:10100
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-zinc-400 font-medium">Hermes Gateway</div>
            <div className="text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> launchd (PID 33929)
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-zinc-400 font-medium">ElevenLabs Voice</div>
            <div className="text-zinc-200 font-bold mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Voice Synth Active
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3">
            <div className="text-zinc-400 font-medium">Firecrawl Tool</div>
            <div className="text-zinc-200 font-bold mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" /> Web Extract Ready
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-zinc-500 pt-4 pb-8 space-y-1">
        <div>LLM Quota & Telemetry Cockpit · Designed for 삼균 님</div>
        <div className="font-mono text-[11px] text-zinc-500">Last Synced: {lastSync.toLocaleTimeString('ko-KR')} · Mode: {data?.environment || 'Live'}</div>
      </footer>
    </main>
  );
}
