'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, BarChart3, DollarSign, Award, Zap, Activity,
  Calendar, Layers, ArrowUpRight, Clock, Hash, Sparkles, Moon,
} from 'lucide-react';
import type { ModelInfo } from '@/types/telemetry';
import { isNightEligibleModel } from '@/data/models';
import { fmtTokens, calcCostUSD } from '@/utils/formatters';

interface LiveUsageTabProps { models: ModelInfo[]; isNightDiscountNow?: boolean; }
type Timeframe = 'daily' | 'weekly' | 'monthly' | 'allTime';
type RankCriteria = 'tokens' | 'cost' | 'requests';
const KRW_RATE = 1390;

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  daily: '오늘 (24h)', weekly: '이번 주 (7일)', monthly: '이번 달 (30일)', allTime: '전체 누적',
};
const TF_BTN: Record<Timeframe, string> = { daily: '오늘', weekly: '주간', monthly: '월간', allTime: '전체' };

const PROVIDER_COLORS: Record<string, string> = {
  'google-antigravity': 'from-blue-500 to-cyan-400',
  'openai': 'from-emerald-500 to-teal-400',
  'alibaba-token-plan-intl': 'from-orange-500 to-amber-400',
  'nous': 'from-violet-500 to-fuchsia-400',
};
const PROVIDER_BG: Record<string, string> = {
  'google-antigravity': 'bg-blue-500/10 border-blue-500/20',
  'openai': 'bg-emerald-500/10 border-emerald-500/20',
  'alibaba-token-plan-intl': 'bg-orange-500/10 border-orange-500/20',
  'nous': 'bg-violet-500/10 border-violet-500/20',
};

const actCls = 'flex items-center gap-1';
const btnBase = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all';
const btnOn = 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow';
const btnOff = 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300';
const rankBtnBase = 'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all';
const rankBtnOn = 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow';
const rankBtnOff = 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300';

export default function LiveUsageTab({ models, isNightDiscountNow = false }: LiveUsageTabProps) {
  const [timeframe, setTimeframe]       = useState<Timeframe>('monthly');
  const [rankCriteria, setRankCriteria] = useState<RankCriteria>('tokens');
  const [applyNightDiscount, setApplyNightDiscount] = useState<boolean>(isNightDiscountNow);
  const [nightRatio, setNightRatio] = useState<number>(100);

  // ── 알리바바 10,000 크레딧(Standard Plan) 달러 환산 가치 & 7일 사이클 실사용 기반 분석 ──
  const alibabaCreditValue = useMemo(() => {
    const aliModels = models.filter(m => m.providerId === 'alibaba-token-plan-intl');
    let dayTotalUSD = 0;
    let simulatedTotalUSD = 0;
    let maxNightDiscountUSD = 0;
    let totalTokens = 0;

    const breakdown = aliModels.map(m => {
      const u = m.actualUsage?.currentCycle ?? { input: 0, uncached: 0, cached: 0, output: 0, total: 0, requests: 0 };
      const inTok = u.input || 0;
      const cachedTok = u.cached || 0;
      const uncachedTok = u.uncached ?? Math.max(0, inTok - cachedTok);
      const outTok = u.output || 0;
      const totTok = inTok + outTok;

      const inPrice = m.inputPrice1M ?? 0;
      const cachedPrice = m.cachedPrice1M ?? (inPrice * 0.2);
      const outPrice = m.outputPrice1M ?? 0;

      const uncachedCost = (uncachedTok / 1e6) * inPrice;
      const cachedCost = (cachedTok / 1e6) * cachedPrice;
      const outCost = (outTok / 1e6) * outPrice;
      const dayCost = uncachedCost + cachedCost + outCost;
      const eligible = isNightEligibleModel(m.id);

      let simCost = dayCost;
      let maxNightCost = dayCost;
      if (eligible) {
        maxNightCost = dayCost * 0.5;
        if (applyNightDiscount) {
          const discountRatio = 0.5 * (nightRatio / 100);
          simCost = dayCost * (1 - discountRatio);
        }
      }

      dayTotalUSD += dayCost;
      simulatedTotalUSD += simCost;
      maxNightDiscountUSD += maxNightCost;
      totalTokens += totTok;

      return {
        id: m.id,
        name: m.name,
        tokens: totTok,
        inTokens: inTok,
        uncachedTokens: uncachedTok,
        cachedTokens: cachedTok,
        outTokens: outTok,
        uncachedCost,
        cachedCost,
        outCost,
        dayCost,
        simCost,
        maxNightCost,
        isEligible: eligible,
        requests: u.requests,
      };
    });

    return {
      dayTotalUSD,
      simulatedTotalUSD,
      maxNightDiscountUSD,
      totalTokens,
      savedUSD: Math.max(0, dayTotalUSD - simulatedTotalUSD),
      breakdown,
    };
  }, [models, applyNightDiscount, nightRatio]);

  const rankedModels = useMemo(() => {
    return models
      .map(m => {
        const u = m.actualUsage?.[timeframe] ?? { input: 0, uncached: 0, cached: 0, output: 0, total: 0, requests: 0 };
        const rawCostUSD = calcCostUSD(m, { input: u.input, uncached: u.uncached, cached: u.cached, output: u.output });
        const eligible = isNightEligibleModel(m.id);
        
        let costUSD = rawCostUSD;
        let discountSavedUSD = 0;
        
        if (eligible && applyNightDiscount) {
          const effectiveDiscountRate = 0.5 * (nightRatio / 100);
          costUSD = rawCostUSD * (1 - effectiveDiscountRate);
          discountSavedUSD = rawCostUSD - costUSD;
        }

        return { model: m, usage: u, costUSD, rawCostUSD, discountSavedUSD, isEligible: eligible };
      })
      .filter(item => item.usage.total > 0)
      .sort((a, b) => {
        if (rankCriteria === 'tokens')   return b.usage.total    - a.usage.total;
        if (rankCriteria === 'cost')     return b.costUSD        - a.costUSD;
        return b.usage.requests - a.usage.requests;
      });
  }, [models, timeframe, rankCriteria, applyNightDiscount, nightRatio]);

  const totals = useMemo(() => ({
    allTokens: rankedModels.reduce((s, r) => s + r.usage.total,    0),
    allCost:   rankedModels.reduce((s, r) => s + r.costUSD,        0),
    allReqs:   rankedModels.reduce((s, r) => s + r.usage.requests, 0),
    allInput:  rankedModels.reduce((s, r) => s + r.usage.input,    0),
    allUncached: rankedModels.reduce((s, r) => s + (r.usage.uncached ?? Math.max(0, r.usage.input - (r.usage.cached ?? 0))), 0),
    allCached: rankedModels.reduce((s, r) => s + (r.usage.cached ?? 0), 0),
    allOutput: rankedModels.reduce((s, r) => s + r.usage.output,   0),
    allSaved:  rankedModels.reduce((s, r) => s + r.discountSavedUSD, 0),
  }), [rankedModels]);

  const providerStats = useMemo(() => {
    const map: Record<string, { tokens: number; cost: number; requests: number; name: string }> = {};
    for (const row of rankedModels) {
      const model = row.model, usage = row.usage, costUSD = row.costUSD;
      if (!map[model.providerId])
        map[model.providerId] = { tokens: 0, cost: 0, requests: 0, name: model.providerName };
      map[model.providerId].tokens   += usage.total;
      map[model.providerId].cost     += costUSD;
      map[model.providerId].requests += usage.requests;
    }
    return Object.entries(map).sort((a, b) => b[1].tokens - a[1].tokens);
  }, [rankedModels]);

  const isEmpty = rankedModels.length === 0;
  const fmtCost = (c: number) => (c > 0 && c < 0.01 ? '<$0.01' : '$' + c.toFixed(2));
  const fmtKrw  = (c: number) => 'KRW ' + Math.round(c * KRW_RATE).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            실제 누적 사용량
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            로컬 세션 텔레메트리 기반 · ~/.codex/sessions
          </p>
        </div>
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
          {(Object.keys(TIMEFRAME_LABELS) as Timeframe[]).map(tf => (
            <button key={tf} onClick={() => setTimeframe(tf)}
              className={[btnBase, timeframe === tf ? btnOn : btnOff].join(' ')}>
              {TF_BTN[tf]}
            </button>
          ))}
        </div>
      </div>

      {/* Night 50% Discount Simulator Control Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 dark:border-amber-700/50 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  알리바바 야간 50% 반값 할인 요율 시뮬레이터
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isNightDiscountNow
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                }`}>
                  {isNightDiscountNow ? "🌙 현재 야간 할인 시간대 적용 가능 (23:00~09:00 KST)" : "☀️ 야간 프로모션: 23:00 ~ 09:00 KST (50% OFF)"}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                대상 모델: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Qwen 3.8 Max</strong>, <strong className="font-semibold text-zinc-800 dark:text-zinc-200">DeepSeek V4 Pro</strong>, <strong className="font-semibold text-zinc-800 dark:text-zinc-200">DeepSeek V4 Flash</strong> (야간 시간대 사용 시 50% 요율 감면)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 rounded-xl shadow-sm hover:border-amber-400 transition-colors">
              <input
                type="checkbox"
                checked={applyNightDiscount}
                onChange={(e) => setApplyNightDiscount(e.target.checked)}
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <span>50% 야간 요율 적용</span>
            </label>
          </div>
        </div>

        {applyNightDiscount && (
          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-zinc-600 dark:text-zinc-400 font-medium">야간 시간대 사용 비중:</span>
              <div className="flex gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5">
                {[
                  { label: '30% 야간', val: 30 },
                  { label: '50% 혼합', val: 50 },
                  { label: '80% 주로 야간', val: 80 },
                  { label: '100% 야간 집중 (최대 절감)', val: 100 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setNightRatio(item.val)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                      nightRatio === item.val
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {totals.allSaved > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>야간 할인 절감액: -{fmtCost(totals.allSaved)} ({fmtKrw(totals.allSaved)} 절약)</span>
              </div>
            )}
          </div>
        )}

        {/* 10,000 크레딧(Standard Plan) 달러 환산 가치 & 실사용 분석 통합 패널 */}
        <div className="bg-white/90 dark:bg-zinc-900/90 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-3.5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 dark:border-amber-950 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 flex-wrap">
                  <span>10,000 크레딧(Standard Plan) 달러 환산 가치</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                    7일 쿼터 실측 기반
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Alibaba Model Studio 공식 API 단가 기준 · 주간 실측 {fmtTokens(alibabaCreditValue.totalTokens)} 토큰 가치 역산
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right font-mono text-[11px] text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
              <span>플랜 구독료: </span>
              <strong className="text-zinc-900 dark:text-zinc-100">CNY 139/월 (~$19.5)</strong>
            </div>
          </div>

          {/* 3-Way Cost Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Regular Day Rate */}
            <div className="bg-zinc-50/90 dark:bg-zinc-800/80 rounded-xl p-3 text-center border border-zinc-200/70 dark:border-zinc-700/70">
              <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">정가 요율 (보수적)</div>
              <div className="font-mono font-extrabold text-blue-700 dark:text-blue-300 text-lg sm:text-xl">
                ${alibabaCreditValue.dayTotalUSD.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{fmtKrw(alibabaCreditValue.dayTotalUSD)} · 야간 할인 미적용</div>
            </div>

            {/* 2. Simulation Value */}
            <div className="bg-amber-50/80 dark:bg-amber-950/40 rounded-xl p-3 text-center border border-amber-300/70 dark:border-amber-700/70 shadow-xs relative overflow-hidden">
              <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-0.5 flex items-center justify-center gap-1">
                <span>현재 시뮬레이션 적용 요율</span>
                {applyNightDiscount && <span className="text-[10px] font-mono font-normal">({nightRatio}% 야간)</span>}
              </div>
              <div className="font-mono font-black text-amber-600 dark:text-amber-400 text-lg sm:text-xl">
                ${alibabaCreditValue.simulatedTotalUSD.toFixed(2)}
              </div>
              <div className="text-[10px] text-amber-800 dark:text-amber-300 font-mono mt-0.5 font-medium">
                {fmtKrw(alibabaCreditValue.simulatedTotalUSD)}
                {alibabaCreditValue.savedUSD > 0 && ` (-$${alibabaCreditValue.savedUSD.toFixed(2)} 절약)`}
              </div>
            </div>

            {/* 3. Max Night Discount */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl p-3 text-center border border-emerald-300/70 dark:border-emerald-700/70">
              <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-0.5">야간 50% 최대 절감 (낙관적)</div>
              <div className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-lg sm:text-xl">
                ${alibabaCreditValue.maxNightDiscountUSD.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">{fmtKrw(alibabaCreditValue.maxNightDiscountUSD)} · 🌙 100% 야간 집중 시</div>
            </div>
          </div>

          {/* Per-Model Breakdown Grid */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Alibaba 모델별 소비 내역 & 환산 가치</span>
              <span className="text-zinc-400 font-normal">🌙 = 50% 야간 할인 대상 모델</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {alibabaCreditValue.breakdown.map(m => (
                <div key={m.name} className="bg-zinc-50/70 dark:bg-zinc-800/60 p-2.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                    <span className="flex items-center gap-1 truncate">
                      {m.isEligible && <span className="text-amber-500 text-xs">🌙</span>}
                      <span className="truncate">{m.name}</span>
                    </span>
                    <span className="text-zinc-500 text-[10px] shrink-0">{fmtTokens(m.tokens)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <span className="text-zinc-400 text-[10px]">시뮬레이션 가치:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      ${m.simCost.toFixed(2)}
                      {m.isEligible && applyNightDiscount && (
                        <span className="text-zinc-400 font-normal text-[10px] line-through ml-1">${m.dayCost.toFixed(2)}</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 pt-1.5 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>※ 7일 쿼터 리셋 주기(8/22 17:29 KST)에 맞춰 초기화된 실측 토큰 기준입니다.</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                현재 소모분 실질 가성비: {alibabaCreditValue.dayTotalUSD > 0 ? (alibabaCreditValue.dayTotalUSD / 0.426).toFixed(1) : "1.5"}배 (소모 구독료 $0.43 대비 ${alibabaCreditValue.dayTotalUSD.toFixed(2)} 가치 획득)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-zinc-400 dark:text-zinc-500 text-[10px]">
              <span>• 10,000 크레딧 완충 시 예상 총가치: 약 $7.55 (Flash 위주 1.5배) ~ 최대 $44.78 (Qwen 3.8 Max 위주 9.2배)</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">💡 Qwen 3.8 Max 등 고성능 모델 사용 시 가성비 레버리지 극대화</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={<Layers className="w-4 h-4" />} label="총 토큰 사용량"
          value={fmtTokens(totals.allTokens)}
          sub={'입력 ' + fmtTokens(totals.allInput) + ' / 출력 ' + fmtTokens(totals.allOutput)} color="blue" />
        <SummaryCard icon={<DollarSign className="w-4 h-4" />} label="총 소모 비용"
          value={'$' + totals.allCost.toFixed(2)}
          sub={totals.allSaved > 0 ? `${fmtKrw(totals.allCost)} (절감 -${fmtCost(totals.allSaved)})` : fmtKrw(totals.allCost)} color="emerald" />
        <SummaryCard icon={<Hash className="w-4 h-4" />} label="총 API 호출"
          value={totals.allReqs.toLocaleString() + '회'}
          sub={rankedModels.length + '개 모델 사용됨'} color="violet" />
        <SummaryCard icon={<Calendar className="w-4 h-4" />} label="조회 기간"
          value={TIMEFRAME_LABELS[timeframe]} sub="실제 세션 기록" color="amber" />
      </div>

      {!isEmpty && providerStats.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> 프로바이더별 토큰 점유율
          </h3>
          <div className="space-y-3">
            {providerStats.map((row) => {
              const pid = row[0] as string, stats = row[1];
              const pct = totals.allTokens > 0 ? (stats.tokens / totals.allTokens) * 100 : 0;
              const gradient = PROVIDER_COLORS[pid] ?? 'from-zinc-500 to-zinc-400';
              return (
                <div key={pid}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{stats.name}</span>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{fmtTokens(stats.tokens)}</span>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-200">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={'h-full rounded-full bg-gradient-to-r ' + gradient + ' transition-all duration-700'}
                      style={{ width: pct + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> 모델 사용 순위
          </h3>
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {([
              { key: 'tokens' as RankCriteria,   label: '토큰',   icon: <Layers className="w-3 h-3" /> },
              { key: 'cost' as RankCriteria,     label: '비용',   icon: <DollarSign className="w-3 h-3" /> },
              { key: 'requests' as RankCriteria, label: '호출수', icon: <Hash className="w-3 h-3" /> },
            ]).map((opt) => (
              <button key={opt.key} onClick={() => setRankCriteria(opt.key)}
                className={[rankBtnBase, rankCriteria === opt.key ? rankBtnOn : rankBtnOff].join(' ')}>
                {opt.icon}{opt.label}
              </button>
            ))}
          </div>
        </div>

        {isEmpty ? (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-600">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{TIMEFRAME_LABELS[timeframe]} 기간에 사용 기록이 없어요</p>
            <p className="text-xs mt-1 opacity-70">전체 기간으로 전환하면 누적 데이터를 볼 수 있어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankedModels.map((row, idx) => {
              const model = row.model, usage = row.usage, costUSD = row.costUSD;
              const first = rankedModels[0];
              const maxVal = rankCriteria === 'tokens' ? first.usage.total
                           : rankCriteria === 'cost'   ? first.costUSD : first.usage.requests;
              const curVal = rankCriteria === 'tokens' ? usage.total
                           : rankCriteria === 'cost'   ? costUSD : usage.requests;
              const barPct   = maxVal > 0 ? (curVal / maxVal) * 100 : 0;
              const gradient = PROVIDER_COLORS[model.providerId] ?? 'from-zinc-500 to-zinc-400';
              const bgCard   = PROVIDER_BG[model.providerId] ?? 'bg-zinc-50/50 border-zinc-200/50';
              const rankCls  = idx < 3 ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500';
              return (
                <div key={model.id}
                  className={'relative overflow-hidden border rounded-xl p-3 ' + bgCard + ' dark:bg-zinc-800/40 dark:border-zinc-700/40'}>
                  <div className={'absolute inset-y-0 left-0 bg-gradient-to-r ' + gradient + ' opacity-5 rounded-xl transition-all duration-700'}
                    style={{ width: barPct + '%' }} />
                  <div className="relative flex items-center gap-3">
                    <div className={'w-7 text-center flex-shrink-0 font-bold text-sm ' + rankCls}>#{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{model.name}</span>
                        {row.discountSavedUSD > 0 ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold flex-shrink-0">🌙 50% 야간 요율 (-{fmtCost(row.discountSavedUSD)})</span>
                        ) : null}
                        {model.tag ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-400 font-medium flex-shrink-0">{model.tag}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className={actCls}><Layers className="w-3 h-3" />{fmtTokens(usage.total)}</span>
                        <span className={actCls}><ArrowUpRight className="w-3 h-3 text-blue-400" />입력 {fmtTokens(usage.input)}</span>
                        <span className={actCls}><Zap className="w-3 h-3 text-orange-400" />출력 {fmtTokens(usage.output)}</span>
                        <span className={actCls}><Hash className="w-3 h-3" />{usage.requests}회</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {row.discountSavedUSD > 0 && (
                        <div className="text-[10px] text-zinc-400 line-through">{fmtCost(row.rawCostUSD)}</div>
                      )}
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{fmtCost(costUSD)}</div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">{fmtKrw(costUSD)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" /> 상세 사용 내역
          </h3>
          <table className="w-full text-xs min-w-[640px]">
            <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
                {['모델', '입력(신규)', '캐시(Cache)', '출력(Output)', '합계', '호출', '비용 (USD)', '비용 (KRW)'].map((h, i) => (
                  <th key={h} className={'pb-2 font-semibold text-zinc-500 dark:text-zinc-400 ' + (i === 0 ? 'text-left pl-1' : 'text-right') + (i === 7 ? ' pr-1' : '')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedModels.map((row, idx) => {
                const model = row.model, usage = row.usage, costUSD = row.costUSD;
                const uncachedTok = usage.uncached ?? Math.max(0, usage.input - (usage.cached ?? 0));
                const cachedTok = usage.cached ?? 0;
                return (
                  <tr key={model.id} className={'border-b border-zinc-100 dark:border-zinc-800/60 ' + (idx % 2 !== 0 ? 'bg-zinc-50/40 dark:bg-zinc-800/20' : '')}>
                    <td className="py-2 pl-1">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{model.name}</div>
                      {row.discountSavedUSD > 0 && (
                        <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-mono">🌙 50% 야간 할인 반영됨 (-{fmtCost(row.discountSavedUSD)})</div>
                      )}
                      <div className="text-zinc-400 dark:text-zinc-600 text-[10px]">{model.providerName}</div>
                    </td>
                    <td className="py-2 text-right text-zinc-600 dark:text-zinc-400 font-mono">{fmtTokens(uncachedTok)}</td>
                    <td className="py-2 text-right text-indigo-600 dark:text-indigo-400 font-mono">{fmtTokens(cachedTok)}</td>
                    <td className="py-2 text-right text-zinc-600 dark:text-zinc-400 font-mono">{fmtTokens(usage.output)}</td>
                    <td className="py-2 text-right text-zinc-800 dark:text-zinc-200 font-mono font-semibold">{fmtTokens(usage.total)}</td>
                    <td className="py-2 text-right text-zinc-600 dark:text-zinc-400 font-mono">{usage.requests}</td>
                    <td className="py-2 text-right text-zinc-800 dark:text-zinc-200 font-mono font-semibold">{fmtCost(costUSD)}</td>
                    <td className="py-2 pr-1 text-right text-zinc-600 dark:text-zinc-400 font-mono">{fmtKrw(costUSD)}</td>
                  </tr>
                );
              })}
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 font-semibold">
                <td className="py-2 pl-1 text-zinc-700 dark:text-zinc-300">합계</td>
                <td className="py-2 text-right text-zinc-700 dark:text-zinc-300 font-mono">{fmtTokens(totals.allUncached)}</td>
                <td className="py-2 text-right text-indigo-700 dark:text-indigo-300 font-mono">{fmtTokens(totals.allCached)}</td>
                <td className="py-2 text-right text-zinc-700 dark:text-zinc-300 font-mono">{fmtTokens(totals.allOutput)}</td>
                <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 font-mono font-bold">{fmtTokens(totals.allTokens)}</td>
                <td className="py-2 text-right text-zinc-700 dark:text-zinc-300 font-mono">{totals.allReqs}</td>
                <td className="py-2 text-right text-zinc-900 dark:text-zinc-100 font-mono font-bold">{'$' + totals.allCost.toFixed(2)}</td>
                <td className="py-2 pr-1 text-right text-zinc-700 dark:text-zinc-300 font-mono">{fmtKrw(totals.allCost)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-start gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
        <Clock className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          세션 텔레메트리 동기화 주기: <span className="font-semibold">5분</span>마다 자동 업데이트 ·
          실제 입력/출력 토큰 델타 기반 집계 · 비용은 공개 API 단가 기준 추정값
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  color: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const colorMap: Record<string, string> = {
    blue:    'text-blue-500 bg-blue-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    violet:  'text-violet-500 bg-violet-500/10',
    amber:   'text-amber-500 bg-amber-500/10',
  };
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
      <div className={'inline-flex p-2 rounded-lg ' + colorMap[color] + ' mb-2'}>
        <span className={colorMap[color].split(' ')[0]}>{icon}</span>
      </div>
      <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{label}</div>
      <div className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1">{sub}</div>
    </div>
  );
}
