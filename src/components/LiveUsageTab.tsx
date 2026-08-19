'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Award,
  Flame,
  Zap,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Sliders,
  ArrowUpRight,
  Info,
  Clock,
  Coins
} from 'lucide-react';

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
  outputPrice1M?: number;
  reasoning?: string;
  tag?: string;
  status: 'active' | 'rate_limited' | 'standby';
}

interface LiveUsageTabProps {
  models: ModelInfo[];
  isNightDiscountNow?: boolean;
}

// 기본 모델별 기본 상대적 사용 가중치 (실제 에이전트/개발 환경 기준 분포)
const DEFAULT_MODEL_WEIGHTS: Record<string, number> = {
  // Fast 코딩 & 데일리 주력 모델들 (높은 사용 빈도)
  'google-antigravity/gemini-3.7-flash': 35,
  'alibaba-token-plan-intl/qwen3.6-flash': 18,
  'gpt-5.6-luna': 15,
  'google-antigravity/claude-sonnet-4-6': 12,
  'alibaba-token-plan-intl/deepseek-v4-flash-0731': 8,
  'alibaba-token-plan-intl/qwen3.7-plus': 5,
  'google-antigravity/gemini-3.1-pro': 3,
  'alibaba-token-plan-intl/deepseek-v4-pro-0813': 2,
  'alibaba-token-plan-intl/qwen3.8-max': 1,
  'google-antigravity/claude-opus-4-6-thinking': 0.5,
  'gpt-5.6-sol': 0.3,
  'gpt-5.6-terra': 0.2,
};

type WorkloadPreset = 'standard' | 'heavy' | 'light' | 'agent' | 'custom';
type Timeframe = 'daily' | 'weekly' | 'monthly';
type RankCriteria = 'tokens' | 'cost' | 'requests';

export default function LiveUsageTab({ models, isNightDiscountNow = false }: LiveUsageTabProps) {
  // 제어 상태
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [workloadPreset, setWorkloadPreset] = useState<WorkloadPreset>('standard');
  const [dailyTotalTokensK, setDailyTotalTokensK] = useState<number>(3000); // 3,000k = 3M 토큰/일
  const [inputRatioPercent, setInputRatioPercent] = useState<number>(75); // 입력 75%, 출력 25%
  const [krwExchangeRate, setKrwExchangeRate] = useState<number>(1450); // 환율
  const [applyNightDiscount, setApplyNightDiscount] = useState<boolean>(false);
  const [rankCriteria, setRankCriteria] = useState<RankCriteria>('tokens');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 프리셋 변경 핸들러
  const handlePresetChange = (preset: WorkloadPreset) => {
    setWorkloadPreset(preset);
    if (preset === 'light') {
      setDailyTotalTokensK(800); // 800K 토큰/일 (가벼운 검색 및 질의)
      setInputRatioPercent(80);
    } else if (preset === 'standard') {
      setDailyTotalTokensK(3000); // 3M 토큰/일 (일반 풀타임 개발)
      setInputRatioPercent(75);
    } else if (preset === 'heavy') {
      setDailyTotalTokensK(8000); // 8M 토큰/일 (대용량 컨텍스트 & 복합 코딩)
      setInputRatioPercent(70);
    } else if (preset === 'agent') {
      setDailyTotalTokensK(15000); // 15M 토큰/일 (24시간 멀티 에이전트 자동화)
      setInputRatioPercent(70);
    }
  };

  // 기간별 승수 계산 (Daily: 1, Weekly: 7, Monthly: 30)
  const multiplier = useMemo(() => {
    switch (timeframe) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      default: return 30;
    }
  }, [timeframe]);

  const timeframeLabel = useMemo(() => {
    switch (timeframe) {
      case 'daily': return '일별 (Daily)';
      case 'weekly': return '주간 (Weekly - 7일)';
      case 'monthly': return '월간 (Monthly - 30일)';
    }
  }, [timeframe]);

  // 모델별 예측 연산 매트릭스
  const modelCalculations = useMemo(() => {
    // 1. 가중치 합산 계산
    const totalWeight = models.reduce((acc, m) => {
      return acc + (DEFAULT_MODEL_WEIGHTS[m.id] || 0.1);
    }, 0);

    const inputRatio = inputRatioPercent / 100;
    const outputRatio = (100 - inputRatioPercent) / 100;

    return models.map((m) => {
      const weight = DEFAULT_MODEL_WEIGHTS[m.id] || 0.1;
      const share = weight / totalWeight; // 전체 대비 비중 (0~1)

      // 일별 기본 토큰량
      const dailyTokens = (dailyTotalTokensK * 1000) * share;
      const periodTokens = dailyTokens * multiplier;

      // 입력 / 출력 토큰 분할
      const periodInputTokens = periodTokens * inputRatio;
      const periodOutputTokens = periodTokens * outputRatio;

      // 단가 계산 (야간 할인 적용 여부)
      let inPrice1M = m.inputPrice1M ?? 0;
      let outPrice1M = m.outputPrice1M ?? 0;
      const isEligibleNight = m.id === 'alibaba-token-plan-intl/qwen3.8-max' || m.id === 'alibaba-token-plan-intl/deepseek-v4-pro-0813';
      const isDiscounted = (applyNightDiscount || isNightDiscountNow) && isEligibleNight;

      if (isDiscounted) {
        inPrice1M *= 0.5;
        outPrice1M *= 0.5;
      }

      // 기간별 비용 (USD)
      const inputCostUSD = (periodInputTokens / 1000000) * inPrice1M;
      const outputCostUSD = (periodOutputTokens / 1000000) * outPrice1M;
      const totalCostUSD = inputCostUSD + outputCostUSD;
      const totalCostKRW = totalCostUSD * krwExchangeRate;

      // 1일 / 1주 / 1달 개별 수치 미리 계산
      const dailyCostUSD = totalCostUSD / multiplier;
      const weeklyCostUSD = dailyCostUSD * 7;
      const monthlyCostUSD = dailyCostUSD * 30;

      const dailyTokensVal = dailyTokens;
      const weeklyTokensVal = dailyTokens * 7;
      const monthlyTokensVal = dailyTokens * 30;

      // 추정 호출 횟수 (평균 1회 호출당 약 4,000토큰 가정)
      const estimatedRequests = Math.round(periodTokens / 4000);

      // 가성비 점수 산출: 토큰당 비용 효율 (1M 토큰당 복합 비용)
      const blendedPrice1M = (inPrice1M * inputRatio) + (outPrice1M * outputRatio);
      let efficiencyGrade = 'A';
      if (blendedPrice1M < 0.2) efficiencyGrade = 'S+';
      else if (blendedPrice1M < 0.8) efficiencyGrade = 'S';
      else if (blendedPrice1M < 2.5) efficiencyGrade = 'A+';
      else if (blendedPrice1M < 6.0) efficiencyGrade = 'A';
      else if (blendedPrice1M < 15.0) efficiencyGrade = 'B';
      else efficiencyGrade = 'Pro Max';

      return {
        ...m,
        sharePercent: share * 100,
        periodTokens,
        periodInputTokens,
        periodOutputTokens,
        totalCostUSD,
        totalCostKRW,
        dailyTokens: dailyTokensVal,
        weeklyTokens: weeklyTokensVal,
        monthlyTokens: monthlyTokensVal,
        dailyCostUSD,
        weeklyCostUSD,
        monthlyCostUSD,
        dailyCostKRW: dailyCostUSD * krwExchangeRate,
        weeklyCostKRW: weeklyCostUSD * krwExchangeRate,
        monthlyCostKRW: monthlyCostUSD * krwExchangeRate,
        estimatedRequests,
        blendedPrice1M,
        efficiencyGrade,
        isDiscounted
      };
    });
  }, [models, dailyTotalTokensK, inputRatioPercent, multiplier, applyNightDiscount, isNightDiscountNow, krwExchangeRate]);

  // 전체 요약 수치
  const summary = useMemo(() => {
    const totalPeriodTokens = modelCalculations.reduce((acc, m) => acc + m.periodTokens, 0);
    const totalCostUSD = modelCalculations.reduce((acc, m) => acc + m.totalCostUSD, 0);
    const totalCostKRW = totalCostUSD * krwExchangeRate;
    const totalDailyTokens = totalPeriodTokens / multiplier;
    const totalDailyCostUSD = totalCostUSD / multiplier;
    const totalRequests = modelCalculations.reduce((acc, m) => acc + m.estimatedRequests, 0);

    // 프로바이더별 점유율 및 비용
    const providerStats: Record<string, { name: string; tokens: number; costUSD: number; color: string }> = {
      'google-antigravity': { name: 'Google Antigravity', tokens: 0, costUSD: 0, color: '#10b981' },
      'openai': { name: 'OpenAI Codex', tokens: 0, costUSD: 0, color: '#3b82f6' },
      'alibaba-token-plan-intl': { name: 'Alibaba Token Plan', tokens: 0, costUSD: 0, color: '#f59e0b' }
    };

    modelCalculations.forEach((m) => {
      if (providerStats[m.providerId]) {
        providerStats[m.providerId].tokens += m.periodTokens;
        providerStats[m.providerId].costUSD += m.totalCostUSD;
      }
    });

    return {
      totalPeriodTokens,
      totalCostUSD,
      totalCostKRW,
      totalDailyTokens,
      totalDailyCostUSD,
      totalWeeklyTokens: totalDailyTokens * 7,
      totalWeeklyCostUSD: totalDailyCostUSD * 7,
      totalMonthlyTokens: totalDailyTokens * 30,
      totalMonthlyCostUSD: totalDailyCostUSD * 30,
      totalRequests,
      providerStats
    };
  }, [modelCalculations, multiplier, krwExchangeRate]);

  // 랭킹 정렬
  const rankedModels = useMemo(() => {
    let sorted = [...modelCalculations];
    if (rankCriteria === 'tokens') {
      sorted.sort((a, b) => b.periodTokens - a.periodTokens);
    } else if (rankCriteria === 'cost') {
      sorted.sort((a, b) => b.totalCostUSD - a.totalCostUSD);
    } else if (rankCriteria === 'requests') {
      sorted.sort((a, b) => b.estimatedRequests - a.estimatedRequests);
    }
    return sorted;
  }, [modelCalculations, rankCriteria]);

  // 필터링된 모델 목록
  const filteredModels = useMemo(() => {
    return rankedModels.filter((m) => {
      if (filterProvider !== 'all' && m.providerId !== filterProvider) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.providerName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [rankedModels, filterProvider, searchQuery]);

  // 포맷 헬퍼 함수
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000000) return (tokens / 1000000000).toFixed(2) + 'B';
    if (tokens >= 1000000) return (tokens / 1000000).toFixed(2) + 'M';
    if (tokens >= 1000) return (tokens / 1000).toFixed(1) + 'k';
    return tokens.toLocaleString();
  };

  const formatUSD = (usd: number): string => {
    if (usd < 0.001) return '< $0.001';
    if (usd < 1) return '$' + usd.toFixed(3);
    if (usd < 100) return '$' + usd.toFixed(2);
    return '$' + usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatKRW = (krw: number): string => {
    if (krw < 10) return '< ₩10';
    return '₩' + Math.round(krw).toLocaleString();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. 상단 컨트롤 바 (기간 선택 / 프리셋 / 환율 & 단위 설정) */}
      <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 box-border">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Live Usage & Token Forecast Cockpit
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                실시간 토큰 예측
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              전체 및 모델별 일별/주간/월간 예측 토큰 소모량과 달러($)·원화(₩) 환산 금액을 실시간 계산합니다.
            </p>
          </div>

          {/* Timeframe Selector Buttons */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0">
            <button
              type="button"
              onClick={() => setTimeframe('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'daily' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}
            >
              📅 일별 (Daily)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'weekly' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}
            >
              📊 주간 (Weekly)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'monthly' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}
            >
              🗓️ 월간 (Monthly)
            </button>
          </div>
        </div>

        {/* 워크로드 프리셋 및 파라미터 조절 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 워크로드 프리셋 */}
          <div className="bg-zinc-50/80 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
              <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> 작업 강도 프리셋</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatTokens(dailyTotalTokensK * 1000)}/일</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <button
                type="button"
                onClick={() => handlePresetChange('light')}
                className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${workloadPreset === 'light' ? 'bg-emerald-600 text-white' : 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300'}`}
              >
                라이트
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('standard')}
                className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${workloadPreset === 'standard' ? 'bg-emerald-600 text-white' : 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300'}`}
              >
                표준(3M)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('heavy')}
                className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${workloadPreset === 'heavy' ? 'bg-emerald-600 text-white' : 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300'}`}
              >
                헤비(8M)
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange('agent')}
                className={`py-1 rounded-lg text-[11px] font-semibold transition-all ${workloadPreset === 'agent' ? 'bg-emerald-600 text-white' : 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-700 dark:text-zinc-300'}`}
              >
                에이전트
              </button>
            </div>
          </div>

          {/* 일일 총 토큰 슬라이더 */}
          <div className="bg-zinc-50/80 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
              <span>일일 총 토큰량 (Daily Budget)</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {(dailyTotalTokensK / 1000).toFixed(1)}M 토큰
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={30000}
              step={200}
              value={dailyTotalTokensK}
              onChange={(e) => {
                setDailyTotalTokensK(Number(e.target.value));
                setWorkloadPreset('custom');
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>200k</span>
              <span>3M</span>
              <span>10M</span>
              <span>30M</span>
            </div>
          </div>

          {/* In/Out 비율 슬라이더 */}
          <div className="bg-zinc-50/80 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 font-medium">
              <span>입력 : 출력 토큰 비율</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                {inputRatioPercent}% : {100 - inputRatioPercent}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={inputRatioPercent}
              onChange={(e) => setInputRatioPercent(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>50:50 (대화형)</span>
              <span>75:25 (코딩 기본)</span>
              <span>90:10 (문서 리서치)</span>
            </div>
          </div>

          {/* 환율 & 야간 할인 옵션 */}
          <div className="bg-zinc-50/80 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col justify-between space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">환율 (KRW/USD)</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-zinc-500 text-[10px]">₩</span>
                <input
                  type="number"
                  value={krwExchangeRate}
                  onChange={(e) => setKrwExchangeRate(Number(e.target.value) || 1450)}
                  className="w-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none"
                />
              </div>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
              <input
                type="checkbox"
                checked={applyNightDiscount || isNightDiscountNow}
                onChange={(e) => setApplyNightDiscount(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-600 rounded"
              />
              <span>🌙 알리바바 야간 50% 요율 적용</span>
            </label>
          </div>
        </div>
      </section>

      {/* 2. 종합 요약 카드 (총 토큰량, 총 금액 USD/KRW, 프로바이더별 비중) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 총 예측 토큰 사용량 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {timeframeLabel} 총 예측 토큰
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              16개 모델 합산
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {formatTokens(summary.totalPeriodTokens)}
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <div>일별: <strong className="text-zinc-700 dark:text-zinc-200">{formatTokens(summary.totalDailyTokens)}</strong></div>
            <div>주간: <strong className="text-zinc-700 dark:text-zinc-200">{formatTokens(summary.totalWeeklyTokens)}</strong></div>
            <div>월간: <strong className="text-zinc-700 dark:text-zinc-200">{formatTokens(summary.totalMonthlyTokens)}</strong></div>
          </div>
        </div>

        {/* 총 예상 금액 (USD / KRW) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {timeframeLabel} 총 예상 비용
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              종량제 환산 기준
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {formatUSD(summary.totalCostUSD)}
            </span>
            <span className="text-sm font-semibold font-mono text-zinc-500 dark:text-zinc-400">
              ({formatKRW(summary.totalCostKRW)})
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
            <div>일별: <strong className="text-emerald-600">{formatUSD(summary.totalDailyCostUSD)}</strong></div>
            <div>주간: <strong className="text-emerald-600">{formatUSD(summary.totalWeeklyCostUSD)}</strong></div>
            <div>월간: <strong className="text-emerald-600">{formatUSD(summary.totalMonthlyCostUSD)}</strong></div>
          </div>
        </div>

        {/* 최다 사용 & 최고 가성비 모델 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              주력 모델 & 효율 지표
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
              Top Pick
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">사용량 1위:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                {rankedModels[0]?.name || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">가성비 1위 (S+):</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Qwen 3.6 Flash ($0.05)</span>
            </div>
          </div>
          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
            <span>예상 총 API 호출 수:</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{summary.totalRequests.toLocaleString()} 회</span>
          </div>
        </div>

        {/* 프로바이더별 토큰 점유율 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-sky-500" />
              프로바이더 점유율
            </span>
            <span className="text-[10px] font-mono text-zinc-400">비중 %</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(summary.providerStats).map(([pid, p]) => {
              const pct = summary.totalPeriodTokens > 0 ? (p.tokens / summary.totalPeriodTokens) * 100 : 0;
              return (
                <div key={pid} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="truncate">{p.name}</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. 모델별 사용 순위 (Ranking Leaderboard) */}
      <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 box-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                모델별 사용 순위 랭킹 (Usage Leaderboard)
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                Top Ranking
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              선택한 기간({timeframeLabel}) 동안 모델별 예상 토큰 사용량, 지출 금액 및 전체 대비 비중 순위입니다.
            </p>
          </div>

          {/* 랭킹 기준 정렬 탭 */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold shrink-0">
            <span className="text-zinc-500 mr-2 ml-1 text-[11px]">정렬 기준:</span>
            <button
              type="button"
              onClick={() => setRankCriteria('tokens')}
              className={`px-2.5 py-1 rounded-lg transition-all ${rankCriteria === 'tokens' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}
            >
              📊 토큰 사용량 순
            </button>
            <button
              type="button"
              onClick={() => setRankCriteria('cost')}
              className={`px-2.5 py-1 rounded-lg transition-all ${rankCriteria === 'cost' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}
            >
              💵 예상 지출 금액 순
            </button>
            <button
              type="button"
              onClick={() => setRankCriteria('requests')}
              className={`px-2.5 py-1 rounded-lg transition-all ${rankCriteria === 'requests' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'}`}
            >
              ⚡ 호출 빈도 순
            </button>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {rankedModels.slice(0, 3).map((item, idx) => {
            const medal = idx === 0 ? '🥇 1위' : idx === 1 ? '🥈 2위' : '🥉 3위';
            const borderHighlight = idx === 0
              ? 'border-amber-400/80 dark:border-amber-500/80 bg-gradient-to-b from-amber-50/40 dark:from-amber-950/20 to-white dark:to-zinc-900'
              : idx === 1
              ? 'border-slate-300 dark:border-slate-700 bg-zinc-50/50 dark:bg-zinc-800/30'
              : 'border-amber-700/30 dark:border-amber-800/30 bg-zinc-50/50 dark:bg-zinc-800/30';

            return (
              <div key={item.id} className={`p-4 rounded-2xl border-2 ${borderHighlight} shadow-sm space-y-3 relative overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                    {medal}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                    점유율 {item.sharePercent.toFixed(1)}%
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.name}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{item.providerName} · {item.speed}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-sans">예측 토큰 소모</div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">{formatTokens(item.periodTokens)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-sans">예상 비용 ({timeframeLabel.split(' ')[0]})</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{formatUSD(item.totalCostUSD)}</div>
                    <div className="text-[10px] text-zinc-400 font-sans">{formatKRW(item.totalCostKRW)}</div>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, item.sharePercent * 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. 전체 모델별 토큰 & 비용 예측 상세 매트릭스 (일별 / 주간 / 월간 세부 표) */}
      <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 box-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                전체 모델별 일별/주간/월간 예측 사용량 & 금액 매트릭스
              </h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {filteredModels.length}개 모델
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              각 모델의 일별, 주간, 월간 토큰 소비량 및 USD($)/KRW(₩) 환산 비용을 비교합니다.
            </p>
          </div>

          {/* 검색 & 프로바이더 필터 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="모델 또는 프로바이더 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 w-full sm:w-48 font-medium"
              />
            </div>

            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            >
              <option value="all">전체 프로바이더</option>
              <option value="google-antigravity">Google Antigravity</option>
              <option value="openai">OpenAI Codex</option>
              <option value="alibaba-token-plan-intl">Alibaba Token Plan</option>
            </select>
          </div>
        </div>

        {/* Desktop Detailed Matrix Table */}
        <div className="hidden lg:block overflow-x-auto border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider font-medium border-b border-zinc-200/80 dark:border-zinc-800/80 font-sans">
              <tr>
                <th scope="col" className="py-3 px-3.5 text-center">순위</th>
                <th scope="col" className="py-3 px-4">모델 정보 (Model & Provider)</th>
                <th scope="col" className="py-3 px-3 text-right">점유율</th>
                <th scope="col" className="py-3 px-3.5 text-right">1M 단가 (In/Out)</th>
                <th scope="col" className="py-3 px-4 text-right bg-emerald-50/30 dark:bg-emerald-950/20 border-l border-r border-zinc-200/60 dark:border-zinc-800">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300">일별 예측 (Daily)</div>
                  <div className="text-[10px] font-normal text-zinc-400">토큰 / 금액 ($ · ₩)</div>
                </th>
                <th scope="col" className="py-3 px-4 text-right bg-blue-50/20 dark:bg-blue-950/10 border-r border-zinc-200/60 dark:border-zinc-800">
                  <div className="font-bold text-blue-800 dark:text-blue-300">주간 예측 (Weekly)</div>
                  <div className="text-[10px] font-normal text-zinc-400">토큰 / 금액 ($ · ₩)</div>
                </th>
                <th scope="col" className="py-3 px-4 text-right bg-purple-50/20 dark:bg-purple-950/10">
                  <div className="font-bold text-purple-800 dark:text-purple-300">월간 예측 (Monthly)</div>
                  <div className="text-[10px] font-normal text-zinc-400">토큰 / 금액 ($ · ₩)</div>
                </th>
                <th scope="col" className="py-3 px-3 text-center">효율 등급</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 font-mono">
              {filteredModels.map((item, idx) => (
                <tr key={item.id} className="hover:bg-white dark:hover:bg-zinc-800/80 transition-colors">
                  {/* 순위 */}
                  <td className="py-3.5 px-3.5 text-center font-bold text-zinc-600 dark:text-zinc-400">
                    {idx < 3 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-sans font-bold text-[11px]">
                        #{idx + 1}
                      </span>
                    ) : (
                      <span>#{idx + 1}</span>
                    )}
                  </td>

                  {/* 모델명 & 프로바이더 */}
                  <td className="py-3.5 px-4 font-sans">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                      <span>{item.name}</span>
                      {item.tag && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium">
                          {item.tag}
                        </span>
                      )}
                      {item.isDiscounted && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold">
                          🌙 50%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{item.id}</div>
                  </td>

                  {/* 점유율 */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">{item.sharePercent.toFixed(1)}%</div>
                    <div className="w-16 ml-auto bg-zinc-200 dark:bg-zinc-700 rounded-full h-1 mt-1">
                      <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${Math.min(100, item.sharePercent * 2.5)}%` }} />
                    </div>
                  </td>

                  {/* 1M 단가 */}
                  <td className="py-3.5 px-3.5 text-right font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    <div>In ${(item.inputPrice1M ?? 0).toFixed(2)}</div>
                    <div>Out ${(item.outputPrice1M ?? 0).toFixed(2)}</div>
                  </td>

                  {/* 일별 예측 */}
                  <td className="py-3.5 px-4 text-right bg-emerald-50/20 dark:bg-emerald-950/10 border-l border-r border-zinc-200/60 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{formatTokens(item.dailyTokens)}</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">{formatUSD(item.dailyCostUSD)}</div>
                    <div className="text-[10px] text-zinc-400">{formatKRW(item.dailyCostKRW)}</div>
                  </td>

                  {/* 주간 예측 */}
                  <td className="py-3.5 px-4 text-right bg-blue-50/10 dark:bg-blue-950/5 border-r border-zinc-200/60 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{formatTokens(item.weeklyTokens)}</div>
                    <div className="font-bold text-blue-700 dark:text-blue-400">{formatUSD(item.weeklyCostUSD)}</div>
                    <div className="text-[10px] text-zinc-400">{formatKRW(item.weeklyCostKRW)}</div>
                  </td>

                  {/* 월간 예측 */}
                  <td className="py-3.5 px-4 text-right bg-purple-50/10 dark:bg-purple-950/5">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{formatTokens(item.monthlyTokens)}</div>
                    <div className="font-bold text-purple-700 dark:text-purple-400">{formatUSD(item.monthlyCostUSD)}</div>
                    <div className="text-[10px] text-zinc-400">{formatKRW(item.monthlyCostKRW)}</div>
                  </td>

                  {/* 효율 등급 */}
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      item.efficiencyGrade.startsWith('S')
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        : item.efficiencyGrade.startsWith('A')
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                    >
                      {item.efficiencyGrade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Detailed Card View */}
        <div className="lg:hidden space-y-2.5">
          {filteredModels.map((item, idx) => (
            <div key={item.id} className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{item.name}</h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">{item.providerName}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                  비중 {item.sharePercent.toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60">
                <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg">
                  <div className="text-[9px] text-zinc-400 font-sans font-medium">일별 (Daily)</div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] mt-0.5">{formatTokens(item.dailyTokens)}</div>
                  <div className="font-bold text-emerald-600 text-[10px]">{formatUSD(item.dailyCostUSD)}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg">
                  <div className="text-[9px] text-zinc-400 font-sans font-medium">주간 (Weekly)</div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] mt-0.5">{formatTokens(item.weeklyTokens)}</div>
                  <div className="font-bold text-blue-600 text-[10px]">{formatUSD(item.weeklyCostUSD)}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg">
                  <div className="text-[9px] text-zinc-400 font-sans font-medium">월간 (Monthly)</div>
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 text-[11px] mt-0.5">{formatTokens(item.monthlyTokens)}</div>
                  <div className="font-bold text-purple-600 text-[10px]">{formatUSD(item.monthlyCostUSD)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. 안내 풋터 스트립 */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <span>예측 사용량은 선택된 일일 토큰 예산 및 입력/출력 비율을 기반으로 실시간 시뮬레이션됩니다.</span>
        </div>
        <div className="font-mono text-[11px]">
          적용 환율: 1 USD = {krwExchangeRate.toLocaleString()} KRW
        </div>
      </div>
    </div>
  );
}
