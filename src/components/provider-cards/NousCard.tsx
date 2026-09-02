'use client';

import React, { memo } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import type { ProviderInfo } from '@/types/telemetry';

interface NousCardProps {
  nous: ProviderInfo;
}

export const NousCard = memo(function NousCard({ nous: _nous }: NousCardProps) {
  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Nous Research
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-medium border bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 shrink-0">
            Hermes Agent (OAuth)
          </span>
        </div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <span>
            Endpoint: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">inference-api.nousresearch.com</strong>
          </span>
          <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">hermes-cli</span>
        </div>
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              Provider Status
            </span>
            <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">Active</span>
          </div>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight">
            stealth-ox-alpha (1M Context) 사용 중 / Free Tier 모델 2개 대기
          </div>
        </div>
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              Pricing Highlights
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              $0 All Models
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center justify-between font-mono">
              <span>- stealth-ox-alpha (Stealth Tier)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Free (OAuth)</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>- tencent-hy3 (MoE, 256k)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Free</span>
            </div>
            <div className="flex items-center justify-between font-mono">
              <span>- stepfun-step-3.7-flash (256k)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Free</span>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Active Models
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium">
            Stealth Ox Alpha (1M)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Tencent Hy3 (256k)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            StepFun 3.7 Flash (256k)
          </span>
        </div>
      </div>
    </div>
  );
});

export default NousCard;
