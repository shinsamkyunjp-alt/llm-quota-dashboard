'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp, BarChart3, DollarSign, Award, Zap, Activity,
  Calendar, Layers, ArrowUpRight, Clock, Hash, Sparkles, Moon,
} from 'lucide-react';

export interface ModelInfo {
  id: string; name: string; providerId: string; providerName: string;
  pool?: string; speed?: string; context?: string; contextTokens?: number;
  inputPrice1M?: number; outputPrice1M?: number; reasoning?: string; tag?: string;
  status: 'active' | 'rate_limited' | 'standby';
  actualUsage?: {
    daily:   { input: number; output: number; total: number; cached: number; requests: number };
    weekly:  { input: number; output: number; total: number; cached: number; requests: number };
    monthly: { input: number; output: number; total: number; cached: number; requests: number };
    allTime: { input: number; output: number; total: number; cached: number; requests: number };
  };
}

interface LiveUsageTabProps { models: ModelInfo[]; isNightDiscountNow?: boolean; }
type Timeframe = 'daily' | 'weekly' | 'monthly' | 'allTime';
type RankCriteria = 'tokens' | 'cost' | 'requests';
const KRW_RATE = 1390;

function fmtTokens(n: number): string {
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + 'B';
  if (n >= 1000000)    return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000)       return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function calcCostUSD(model: ModelInfo, usage: { input: number; output: number }): number {
  return ((model.inputPrice1M ?? 0) * usage.input + (model.outputPrice1M ?? 0) * usage.output) / 1000000;
}

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  daily: '오늘 (24h)', weekly: '이번 주 (7일)', monthly: '이번 달 (30일)', allTime: '전체 누적',
};
const TF_BTN: Record<Timeframe, string> = { daily: '오늘', weekly: '주간', monthly: '월간', allTime: '전체' };

const PROVIDER_COLORS: Record<string, string> = {
  'google-antigravity': 'from-blue-500 to-cyan-400',
  'openai': 'from-emerald-500 to-teal-400',
  'alibaba-token-plan-intl': 'from-orange-500 to-amber-400',
};
const PROVIDER_BG: Record<string, string> = {
  'google-antigravity': 'bg-blue-500/10 border-blue-500/20',
  'openai': 'bg-emerald-500/10 border-emerald-500/20',
  'alibaba-token-plan-intl': 'bg-orange-500/10 border-orange-500/20',
};

const actCls = 'flex items-center gap-1';
const btnBase = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all';
const btnOn = 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow';
const btnOff = 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300';
const rankBtnBase = 'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all';
const rankBtnOn = 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow';
const rankBtnOff = 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300';

const isNightEligible = (id: string) =>
  id === 'alibaba-token-plan-intl/qwen3.8-max' ||
  id === 'alibaba-token-plan-intl/deepseek-v4-pro-0813' ||
  id.includes('qwen3.8-max') ||
  id.includes('deepseek-v4-pro');

export default function LiveUsageTab({ models, isNightDiscountNow = false }: LiveUsageTabProps) {
  const [timeframe, setTimeframe]       = useState<Timeframe>('monthly');
  const [rankCriteria, setRankCriteria] = useState<RankCriteria>('tokens');
  const [applyNightDiscount, setApplyNightDiscount] = useState<boolean>(isNightDiscountNow);
  const [nightRatio, setNightRatio] = useState<number>(100);

  const rankedModels = useMemo(() => {
    return models
      .map(m => {
        const u = m.actualUsage?.[timeframe] ?? { input: 0, output: 0, total: 0, cached: 0, requests: 0 };
        const rawCostUSD = calcCostUSD(m, { input: u.input, output: u.output });
        const eligible = isNightEligible(m.id);
        
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
                대상 모델: <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Qwen 3.8 Max</strong>, <strong className="font-semibold text-zinc-800 dark:text-zinc-200">DeepSeek V4 Pro</strong> (야간 시간대 사용 시 50% 요율 감면)
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
                {['모델', '입력 토큰', '출력 토큰', '합계', '호출', '비용 (USD)', '비용 (KRW)'].map((h, i) => (
                  <th key={h} className={'pb-2 font-semibold text-zinc-500 dark:text-zinc-400 ' + (i === 0 ? 'text-left pl-1' : 'text-right') + (i === 6 ? ' pr-1' : '')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedModels.map((row, idx) => {
                const model = row.model, usage = row.usage, costUSD = row.costUSD;
                return (
                  <tr key={model.id} className={'border-b border-zinc-100 dark:border-zinc-800/60 ' + (idx % 2 !== 0 ? 'bg-zinc-50/40 dark:bg-zinc-800/20' : '')}>
                    <td className="py-2 pl-1">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">{model.name}</div>
                      {row.discountSavedUSD > 0 && (
                        <div className="text-[9px] text-amber-600 dark:text-amber-400 font-bold font-mono">🌙 50% 야간 할인 반영됨 (-{fmtCost(row.discountSavedUSD)})</div>
                      )}
                      <div className="text-zinc-400 dark:text-zinc-600 text-[10px]">{model.providerName}</div>
                    </td>
                    <td className="py-2 text-right text-zinc-600 dark:text-zinc-400 font-mono">{fmtTokens(usage.input)}</td>
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
                <td className="py-2 text-right text-zinc-700 dark:text-zinc-300 font-mono">{fmtTokens(totals.allInput)}</td>
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
