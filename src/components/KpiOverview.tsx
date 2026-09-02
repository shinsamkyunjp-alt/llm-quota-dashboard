'use client';

import React, { memo } from 'react';
import { ShieldCheck, Zap, Cpu, Layers } from 'lucide-react';
import { fmtPct } from '@/utils/formatters';

interface KpiOverviewProps {
  healthyProviders: number;
  totalProviders: number;
  gemini5hRemaining: number | null;
  gemini5hUsed: number | null;
  viewMode: 'remaining' | 'usage';
  isClaudeExhausted: boolean;
  claudeWeeklyExhausted: boolean;
  claude5hExhausted: boolean;
  claude5hRemaining: number | null;
  claude5hUsed: number | null;
  availableModels: number;
  totalModels: number;
  rateLimitedModels: number;
}

export const KpiOverview = memo(function KpiOverview({
  healthyProviders,
  totalProviders,
  gemini5hRemaining,
  gemini5hUsed,
  viewMode,
  isClaudeExhausted,
  claudeWeeklyExhausted,
  claude5hExhausted,
  claude5hRemaining,
  claude5hUsed,
  availableModels,
  totalModels,
  rateLimitedModels,
}: KpiOverviewProps) {
  return (
    <section className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 box-border">
      {/* Card 1: Healthy Providers */}
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

      {/* Card 2: Gemini 5h Window */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
          <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">Gemini 5시간 한도</div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {viewMode === 'remaining' ? fmtPct(gemini5hRemaining) : fmtPct(gemini5hUsed)}{' '}
            <span className="text-xs text-zinc-400 font-sans font-normal">{viewMode === 'remaining' ? '잔여' : '사용'}</span>
          </div>
        </div>
      </div>

      {/* Card 3: Claude 3rd Party Pool */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            isClaudeExhausted
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">Claude 3rd Party 풀</div>
          <div className="text-base sm:text-lg font-bold font-mono mt-0.5 truncate flex items-baseline gap-1.5">
            {claudeWeeklyExhausted ? (
              <>
                <span className="text-rose-600 dark:text-rose-400 font-bold">0%</span>
                <span className="text-xs text-zinc-400 font-sans font-normal">/ 주간 한도 소진</span>
              </>
            ) : claude5hExhausted ? (
              <>
                <span className="text-rose-600 dark:text-rose-400 font-bold">0%</span>
                <span className="text-xs text-zinc-400 font-sans font-normal">/ 5시간 한도 소진</span>
              </>
            ) : isClaudeExhausted ? (
              <>
                <span className="text-rose-600 dark:text-rose-400 font-bold">0%</span>
                <span className="text-xs text-zinc-400 font-sans font-normal">/ 쿼터 소진</span>
              </>
            ) : claude5hRemaining != null ? (
              <>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {viewMode === 'remaining' ? fmtPct(claude5hRemaining) : fmtPct(claude5hUsed)}
                </span>
                <span className="text-xs text-zinc-400 font-sans font-normal">
                  / {viewMode === 'remaining' ? '잔여' : '사용'}
                </span>
              </>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Ready</span>
            )}
          </div>
        </div>
      </div>

      {/* Card 4: Active Catalog Models */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-3.5 sm:p-4 shadow-sm flex items-center gap-3 min-w-0">
        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
          <Layers className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">활성 카탈로그 모델</div>
          <div className="text-base sm:text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
            <span
              className={
                rateLimitedModels > 0
                  ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'text-emerald-600 dark:text-emerald-400'
              }
            >
              {availableModels}
            </span>{' '}
            <span className="text-xs text-zinc-400 font-sans font-normal">
              / {totalModels}개 정상 {rateLimitedModels > 0 && `(${rateLimitedModels}개 소진)`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default KpiOverview;
