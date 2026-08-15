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
  Bot,
  Calendar
} from 'lucide-react';

interface ModelInfo {
  id: string;
  name: string;
  speed?: string;
  context?: string;
  reasoning?: string;
  status: 'active' | 'rate_limited' | 'standby';
}

const DEFAULT_TELEMETRY = {
  environment: 'Local Mac Daemon (Live ocx)',
  summary: {
    totalProviders: 3,
    healthyProviders: 2,
    exhaustedProviders: 1,
    totalLinkedAccounts: 5,
    activeLLMCount: 13,
    availableModelCount: 5,
    rateLimitedModelCount: 8
  },
  antigravity: {
    provider: 'google-antigravity',
    name: 'Google Antigravity',
    status: 'healthy',
    account: 's***1@gmail.com',
    fiveHourWindow: {
      label: 'Gemini 5시간 롤링 사용량',
      usagePercent: 0.08,
      resetAt: 1786787166000, // ~18:46 KST
    },
    weeklyWindow: {
      label: 'Gemini 주간 누적 사용량',
      usagePercent: 4.57,
      resetAt: 1787337600000,
    },
    claudeCompact: {
      label: 'Claude (3rd Party)',
      status: 'exhausted',
      badge: '주간 쿼터 소진',
      models: ['Sonnet 4.6', 'Opus 4.6 Thinking']
    },
    models: [
      { id: 'google-antigravity/gemini-3.7-flash', name: 'Gemini 3.7 Flash', speed: 'Ultra High Speed', context: '1,000,000 (1M)', reasoning: 'Hybrid (Low-High)', status: 'active' },
      { id: 'google-antigravity/gemini-3.1-pro', name: 'Gemini 3.1 Pro', speed: 'High Speed', context: '1,000,000 (1M)', reasoning: 'Deep Reasoning', status: 'active' },
      { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', speed: 'Balanced', context: '200,000 (200k)', reasoning: 'High Nuance', status: 'rate_limited' },
      { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', speed: 'Deep Thinking', context: '200,000 (200k)', reasoning: 'Max Reasoning', status: 'rate_limited' }
    ]
  },
  openai: {
    provider: 'openai',
    name: 'OpenAI Codex',
    status: 'healthy',
    plan: 'Free Multi-Account Pool',
    accountCount: 3,
    activeAccount: 's***n@gmail.com',
    pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
    monthlyUsagePercent: 9.0,
    monthlyResetAt: 1789273515000,
    models: [
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', speed: 'High Throughput', context: '128,000 (128k)', reasoning: 'Low-Ultra', status: 'active' },
      { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', speed: 'Balanced Reasoning', context: '128,000 (128k)', reasoning: 'Medium-Ultra', status: 'active' },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', speed: 'Cost-Effective', context: '128,000 (128k)', reasoning: 'Medium-Max', status: 'active' }
    ]
  },
  alibaba: {
    provider: 'alibaba-token-plan-intl',
    name: 'Alibaba Token Plan',
    status: 'exhausted',
    badge: 'HTTP 429 · Insufficient Quota',
    region: 'ap-southeast-1 (Singapore)',
    account: 'sk-s****HZew',
    weeklyUsagePercent: 100.0,
    resetAt: 1786782180000, // 17:23:00 KST
    message: '1-week quota exhausted. Auto-resets at 17:23:00 KST.',
    models: [
      { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', speed: 'Heavy Duty', context: '128,000 (128k)', reasoning: 'XHigh Reasoning', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/qwen3.7-plus', name: 'Qwen 3.7 Plus', speed: 'High Speed', context: '128,000 (128k)', reasoning: 'Medium Reasoning', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/qwen3.6-flash', name: 'Qwen 3.6 Flash', speed: 'Ultra Fast', context: '128,000 (128k)', reasoning: 'Low-Medium', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/deepseek-v4-pro', name: 'DeepSeek V4 Pro', speed: 'Code & Math', context: '128,000 (128k)', reasoning: 'High-Max', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', speed: 'Fast Inference', context: '128,000 (128k)', reasoning: 'Standard', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/glm-5.2', name: 'GLM 5.2', speed: 'Bilingual Pro', context: '128,000 (128k)', reasoning: 'Medium Reasoning', status: 'rate_limited' }
    ]
  },
  integrations: [
    { name: 'OpenCodex Proxy', endpoint: 'http://127.0.0.1:10100', status: 'online' },
    { name: 'Hermes Gateway', runtime: 'launchd (PID 33929)', status: 'online' },
    { name: 'ElevenLabs Voice', service: 'Voice Synth (41b6...6484)', status: 'ready' },
    { name: 'Firecrawl Tool', service: 'Web Extract (fc-5...b8ae)', status: 'ready' }
  ]
};

export default function QuotaDashboard() {
  const [data, setData] = useState<any>(DEFAULT_TELEMETRY);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number>(15);

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quota');
      if (!res.ok) throw new Error('API fetch failed');
      const json = await res.json();
      if (json.providers) {
        setData({
          ...DEFAULT_TELEMETRY,
          antigravity: json.providers[0] || DEFAULT_TELEMETRY.antigravity,
          openai: json.providers[1] || DEFAULT_TELEMETRY.openai,
          alibaba: json.providers[2] || DEFAULT_TELEMETRY.alibaba,
          environment: json.environment
        });
      }
      setLastSync(new Date());
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

  const allModels = useMemo(() => {
    const list: Array<{ providerName: string; providerId: string; model: ModelInfo }> = [];
    
    ag.models?.forEach((m: any) => {
      if (filterProvider === 'all' || filterProvider === 'google-antigravity') {
        if (!searchTerm || m.id.toLowerCase().includes(searchTerm.toLowerCase()) || m.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          list.push({ providerName: 'Google Antigravity', providerId: 'google-antigravity', model: m });
        }
      }
    });

    oa.models?.forEach((m: any) => {
      if (filterProvider === 'all' || filterProvider === 'openai') {
        if (!searchTerm || m.id.toLowerCase().includes(searchTerm.toLowerCase()) || m.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          list.push({ providerName: 'OpenAI Codex', providerId: 'openai', model: m });
        }
      }
    });

    al.models?.forEach((m: any) => {
      if (filterProvider === 'all' || filterProvider === 'alibaba-token-plan-intl') {
        if (!searchTerm || m.id.toLowerCase().includes(searchTerm.toLowerCase()) || m.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          list.push({ providerName: 'Alibaba Token Plan', providerId: 'alibaba-token-plan-intl', model: m });
        }
      }
    });

    return list;
  }, [ag, oa, al, filterProvider, searchTerm]);

  return (
    <div className="w-full min-h-[100dvh] bg-zinc-50 overflow-x-hidden box-border">
      <main className="w-full max-w-[1360px] mx-auto px-3 py-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 box-border">
        {/* Top Header */}
        <header className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 box-border">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 truncate">
                LLM Quota & Telemetry
              </h1>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold shrink-0">
                Live Monitor
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              실시간 AI 프로바이더 쿼터 사용량, 5시간/주간/월간 소모율 및 리셋 스케줄 통합 관제
            </p>
          </div>

          {/* Global Controls & Status */}
          <div className="flex items-center justify-between md:justify-end gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-zinc-100 flex-wrap">
            <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-zinc-700 font-medium shrink-0">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{currentTime.toLocaleTimeString('ko-KR', { hour12: false })}</span>
            </div>

            <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-xl px-2 py-1.5 text-[11px] sm:text-xs shrink-0">
              <span className="text-zinc-500 mr-1 font-medium">갱신:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent text-zinc-800 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={5}>5초</option>
                <option value={15}>15초</option>
                <option value={30}>30초</option>
                <option value={0}>수동</option>
              </select>
            </div>

            <button
              onClick={fetchTelemetry}
              disabled={loading}
              className="flex items-center gap-1 bg-zinc-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>동기화</span>
            </button>
          </div>
        </header>

        {/* KPI Overview Strip */}
        <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 box-border">
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-600 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">정상 가동</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 mt-0.5 truncate">
                2 / 3 <span className="text-[10px] sm:text-xs font-semibold text-emerald-600">Optimal</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-600 shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">소진 / 쿨다운</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 mt-0.5 truncate">
                8 <span className="text-[10px] sm:text-xs font-semibold text-amber-600">Models Cooldown</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-sky-50 border border-sky-200/80 rounded-xl text-sky-600 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">연동 계정 풀</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 mt-0.5 truncate">
                5 계정 <span className="text-[10px] sm:text-xs font-semibold text-zinc-600">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200/90 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center gap-2.5 min-w-0">
            <div className="p-2 sm:p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-600 shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] sm:text-xs text-zinc-500 font-medium truncate">즉시 호출 가능</div>
              <div className="text-sm sm:text-xl font-bold text-zinc-900 mt-0.5 truncate">
                5 / 13 <span className="text-[10px] sm:text-xs font-semibold text-emerald-600">Ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Provider Telemetry Grid (Balanced Card Heights) */}
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 box-border items-stretch">
          {/* 1. Google Antigravity Card (Usage % + Exhausted Claude Strip) */}
          <div className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 truncate">Google Antigravity</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
                  정상 (Optimal)
                </span>
              </div>

              <div className="text-xs text-zinc-600 flex items-center justify-between">
                <span>계정: <strong className="text-zinc-900 font-mono">s***1@gmail.com</strong></span>
                <span className="text-zinc-500 font-mono text-[11px]">OAuth 2.0</span>
              </div>

              {/* 5-Hour Rolling Usage */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Gemini 5시간 롤링 사용량
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {getCountdown(ag.fiveHourWindow?.resetAt || 1786787166000)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-zinc-500 text-[11px]">현재 사용률</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {ag.fiveHourWindow?.usagePercent ?? 0.08}% 사용
                  </span>
                </div>

                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(ag.fiveHourWindow?.usagePercent ?? 0.08, 2)}%` }}
                  />
                </div>
              </div>

              {/* Weekly Usage */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Gemini 주간 누적 사용량
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {getCountdown(ag.weeklyWindow?.resetAt || 1787337600000)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-zinc-500 text-[11px]">주간 누적 사용률</span>
                  <span className="font-mono font-bold text-emerald-600 text-sm">
                    {ag.weeklyWindow?.usagePercent ?? 4.57}% 사용
                  </span>
                </div>

                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(ag.weeklyWindow?.usagePercent ?? 4.57, 3)}%` }}
                  />
                </div>
              </div>

              {/* Compact Claude 3rd Party Quota Exhausted Strip */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-amber-900 truncate">Claude 3rd Party 풀</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                  주간 쿼터 소진 (쿨다운)
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">주요 모델</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">Gemini 3.7 Flash</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">Gemini 3.1 Pro</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 font-medium line-through">Claude Sonnet 4.6</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 font-medium line-through">Claude Opus 4.6</span>
              </div>
            </div>
          </div>

          {/* 2. OpenAI Codex Card (Usage %) */}
          <div className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 truncate">OpenAI Codex</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 shrink-0">
                  3개 계정 풀
                </span>
              </div>

              <div className="text-xs text-zinc-600 flex items-center justify-between">
                <span>메인: <strong className="text-zinc-900 font-mono">s***n@gmail.com</strong></span>
                <span className="text-zinc-500 font-mono text-[11px]">Free Pool</span>
              </div>

              {/* Monthly Quota Usage */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-600" />
                    월간 쿼터 사용량 (09/13)
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-700">
                    {getCountdown(oa.monthlyResetAt || 1789273515000)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-zinc-500 text-[11px]">월간 소모율</span>
                  <span className="font-mono font-bold text-sky-600 text-sm">
                    {oa.monthlyUsagePercent ?? 9.0}% 사용
                  </span>
                </div>

                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${oa.monthlyUsagePercent ?? 9.0}%` }}
                  />
                </div>
              </div>

              {/* Pooled Accounts Detail */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3 space-y-1.5">
                <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  연동 계정 풀 현황 (3개)
                </div>
                <div className="text-[11px] font-mono text-zinc-600 space-y-0.5">
                  <div className="text-zinc-800 font-semibold">• s***n@gmail.com (Main Active)</div>
                  <div>• s***2@naver.com (Standby)</div>
                  <div>• s***9@gmail.com (Standby)</div>
                </div>
              </div>

              {/* Pool Health Strip */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-sky-900">풀 로테이션 헬스</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  자동 장애조치 정상 (Active)
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">주요 모델</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">GPT-5.6 Sol</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">GPT-5.6 Terra</span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">GPT-5.6 Luna</span>
              </div>
            </div>
          </div>

          {/* 3. Alibaba Token Plan Card (Usage %) */}
          <div className="w-full bg-white border border-amber-200/90 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 truncate">Alibaba Token Plan</h2>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
                  한도 소진 (429)
                </span>
              </div>

              <div className="text-xs text-zinc-600 flex items-center justify-between">
                <span>엔드포인트: <strong className="text-zinc-900 font-mono">ap-southeast-1</strong></span>
                <span className="text-zinc-500 font-mono text-[11px]">API Key</span>
              </div>

              {/* Weekly Quota Usage (100% Exhausted) */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    주간 쿼터 사용량
                  </span>
                  <span className="font-mono text-xs font-black text-amber-800">
                    100% 소진 (429)
                  </span>
                </div>
                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
                <p className="text-[11px] text-zinc-700 leading-tight pt-0.5">
                  주간 한도 전량 소진으로 현재 요청이 429로 거절됩니다.
                </p>
              </div>

              {/* Today's Reset Countdown */}
              <div className="bg-zinc-50 border border-zinc-200/90 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    오늘 리셋 (17:23 KST)
                  </span>
                  <span className="font-mono text-xs font-black text-amber-700">
                    {getCountdown(al.resetAt || 1786782180000)}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  리셋 시 전 모델 자동 복구 및 호출 재개
                </div>
              </div>

              {/* Routing Failover Alert Strip */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-900">장애조치 상태</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Gemini / Codex 우회 중
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2.5 border-t border-zinc-100">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">영향받는 모델 (쿨다운)</div>
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center gap-1 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Qwen 3.8 Max
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center gap-1 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Qwen 3.7 Plus
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center gap-1 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> DeepSeek V4 Pro
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center gap-1 line-through">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> GLM 5.2
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Model Capability & Routing Matrix */}
        <section className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-600 shrink-0" />
                전체 모델 라우팅 매트릭스 ({allModels.length}개 모델)
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                각 프로바이더별 즉시 호출 가능 여부 상태
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
                  className="bg-zinc-50 border border-zinc-200 rounded-xl pl-8 pr-3 py-1 text-xs text-zinc-800 focus:outline-none focus:border-zinc-400 w-full sm:w-48 font-medium"
                />
              </div>

              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-xl px-2.5 py-1 text-xs text-zinc-700 font-medium focus:outline-none cursor-pointer shrink-0"
              >
                <option value="all">전체 프로바이더</option>
                <option value="google-antigravity">Google Antigravity</option>
                <option value="openai">OpenAI Codex</option>
                <option value="alibaba-token-plan-intl">Alibaba Token Plan</option>
              </select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-zinc-200 rounded-xl bg-zinc-50/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 uppercase tracking-wider font-semibold border-b border-zinc-200">
                <tr>
                  <th className="py-3 px-4">모델 식별자 (ID)</th>
                  <th className="py-3 px-4">프로바이더</th>
                  <th className="py-3 px-4">처리 속도 / 특성</th>
                  <th className="py-3 px-4">컨텍스트 윈도우</th>
                  <th className="py-3 px-4">현재 라우팅 상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 font-mono">
                {allModels.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white transition-colors">
                    <td className="py-3.5 px-4 font-bold text-zinc-900">
                      {item.model.id}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-700 font-sans">
                      {item.providerName}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-sans">
                      {item.model.speed || item.model.reasoning || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600">
                      {item.model.context || '128,000'}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {item.model.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 호출 가능
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> 쿨다운 중 (소진)
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
            {allModels.map((item, idx) => (
              <div key={idx} className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1.5 box-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-zinc-900 break-all">
                    {item.model.id}
                  </div>
                  {item.model.status === 'active' ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 가능
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-semibold">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> 소진
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-200/60">
                  <span>{item.providerName}</span>
                  <span className="font-mono text-[10px]">{item.model.context || '128k'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Infrastructure & Auxiliary Services */}
        <section className="w-full bg-white border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-sm box-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-zinc-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-zinc-500 shrink-0" />
              연동 인프라 및 보조 서비스 상태
            </div>
            <span className="text-[10px] sm:text-[11px] text-zinc-500">macOS (Darwin)</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 text-[11px] font-medium truncate">OpenCodex Proxy</div>
              <div className="text-emerald-700 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 127.0.0.1:10100
              </div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 text-[11px] font-medium truncate">Hermes Gateway</div>
              <div className="text-emerald-700 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> launchd (PID 33929)
              </div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 text-[11px] font-medium truncate">ElevenLabs Voice</div>
              <div className="text-zinc-800 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> Voice Synth
              </div>
            </div>
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 min-w-0">
              <div className="text-zinc-500 text-[11px] font-medium truncate">Firecrawl Tool</div>
              <div className="text-zinc-800 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> Web Extract
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-zinc-500 pt-2 pb-6 space-y-1">
          <div className="font-medium text-zinc-600">LLM Quota & Telemetry Cockpit · Designed for 삼균 님</div>
          <div className="font-mono text-[11px] text-zinc-400">Last Synced: {lastSync.toLocaleTimeString('ko-KR')} · Mode: {data?.environment || 'Live'}</div>
        </footer>
      </main>
    </div>
  );
}
