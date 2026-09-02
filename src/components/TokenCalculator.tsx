'use client';

import React, { useMemo, memo } from 'react';
import { Calculator, ChevronRight, Sparkles } from 'lucide-react';
import type { ModelInfo } from '@/types/telemetry';
import { isNightEligibleModel } from '@/data/models';

interface TokenCalculatorProps {
  models: ModelInfo[];
  calcInputK: number;
  setCalcInputK: (v: number) => void;
  calcOutputK: number;
  setCalcOutputK: (v: number) => void;
  applyNightDiscount: boolean;
  setApplyNightDiscount: (v: boolean) => void;
  isNightDiscountNow: boolean;
  showCalculator: boolean;
  setShowCalculator: (v: boolean) => void;
}

export const TokenCalculator = memo(function TokenCalculator({
  models,
  calcInputK,
  setCalcInputK,
  calcOutputK,
  setCalcOutputK,
  applyNightDiscount,
  setApplyNightDiscount,
  isNightDiscountNow,
  showCalculator,
  setShowCalculator,
}: TokenCalculatorProps) {
  const calculatedCostList = useMemo(() => {
    return models
      .map((m) => {
        let inPrice = m.inputPrice1M ?? 0;
        let outPrice = m.outputPrice1M ?? 0;
        const isEligibleNightModel = isNightEligibleModel(m.id);

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
          outCost,
        };
      })
      .sort((a, b) => a.totalCost - b.totalCost);
  }, [models, calcInputK, calcOutputK, applyNightDiscount, isNightDiscountNow]);

  return (
    <section
      aria-label="토큰 비용 계산기"
      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border"
    >
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
          {showCalculator ? '접기' : '시뮬레이터 열기'}
          <ChevronRight className={`w-4 h-4 transition-transform ${showCalculator ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {showCalculator && (
        <div id="calculator-panel" className="pt-3 space-y-4 border-t border-zinc-100 dark:border-zinc-800">
          {/* Sliders Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-50/70 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
            {/* Input Tokens Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="calc-input-tokens" className="font-bold text-zinc-700 dark:text-zinc-300">
                  입력 프롬프트 토큰 (Input Tokens):
                </label>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {calcInputK.toLocaleString()}k ({((calcInputK * 1000) / 1_000_000).toFixed(2)}M)
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
                <button type="button" onClick={() => setCalcInputK(50)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  50k
                </button>
                <button type="button" onClick={() => setCalcInputK(200)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  200k (기본)
                </button>
                <button type="button" onClick={() => setCalcInputK(500)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  500k
                </button>
                <button type="button" onClick={() => setCalcInputK(1000)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  1,000k (1M)
                </button>
              </div>
            </div>

            {/* Output Tokens Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="calc-output-tokens" className="font-bold text-zinc-700 dark:text-zinc-300">
                  생성 출력 토큰 (Output Tokens):
                </label>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {calcOutputK.toLocaleString()}k ({((calcOutputK * 1000) / 1_000_000).toFixed(2)}M)
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
                <button type="button" onClick={() => setCalcOutputK(5)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  5k
                </button>
                <button type="button" onClick={() => setCalcOutputK(20)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  20k (기본)
                </button>
                <button type="button" onClick={() => setCalcOutputK(50)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  50k
                </button>
                <button type="button" onClick={() => setCalcOutputK(100)} className="cursor-pointer hover:text-emerald-600 focus:underline">
                  100k
                </button>
              </div>
            </div>
          </div>

          {/* Night Discount Toggle */}
          <div className="flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                알리바바 야간 50% 반값 프로모션 요율 시뮬레이션 (qwen3.8-max, deepseek-v4-pro-0813, deepseek-v4-flash-0731)
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-amber-900 dark:text-amber-300">
              <input
                type="checkbox"
                checked={applyNightDiscount || isNightDiscountNow}
                onChange={(e) => setApplyNightDiscount(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>50% 야간 요율 적용 {isNightDiscountNow && '(현재 시간 자동 적용 중)'}</span>
            </label>
          </div>

          {/* Calculated Top 6 Cost Ranking */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {calculatedCostList.slice(0, 6).map((item, idx) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  idx === 0
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-700/80'
                    : 'bg-zinc-50/70 dark:bg-zinc-800/50 border-zinc-200/60 dark:border-zinc-700/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-zinc-500 dark:text-zinc-400">#{idx + 1}</span>
                  {idx === 0 && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold text-[9px]">
                      최저가
                    </span>
                  )}
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
  );
});

export default TokenCalculator;
