'use client';

import React, { memo } from 'react';
import { Calendar, Zap, Sparkles } from 'lucide-react';
import type { ProviderInfo } from '@/types/telemetry';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { fmtPct, clampPct, getProgressBarColor, getStatusTextColor } from '@/utils/formatters';

interface AlibabaCardProps {
  al: ProviderInfo;
  viewMode: 'remaining' | 'usage';
  isNightDiscountNow: boolean;
}

export const AlibabaCard = memo(function AlibabaCard({
  al,
  viewMode,
  isNightDiscountNow,
}: AlibabaCardProps) {
  const alUsed = typeof al.weeklyUsagePercent === 'number' ? al.weeklyUsagePercent : null;
  const alRemaining =
    typeof al.weeklyRemainingPercent === 'number'
      ? al.weeklyRemainingPercent
      : alUsed != null
      ? Math.max(0, 100 - alUsed)
      : null;
  const isAliExhausted =
    (typeof alRemaining === 'number' && alRemaining <= 0) ||
    (typeof alUsed === 'number' && alUsed >= 100) ||
    (al.status === 'exhausted' && (alRemaining == null || alRemaining <= 0));

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Alibaba Token Plan
            </h2>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium border ${
              isAliExhausted
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-700/60'
            } shrink-0`}
          >
            {isAliExhausted
              ? 'HTTP 429 · 주간 쿼터 소진 (호출 불가)'
              : al.plan || 'Standard (10,000 req/7d)'}
          </span>
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <span>
            엔드포인트: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">ap-southeast-1</strong>
          </span>
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
                <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                  소진 임박
                </span>
              )}
              <span className={`font-mono text-xs font-bold ${getStatusTextColor(alRemaining, alUsed)}`}>
                {alUsed == null
                  ? '계측 대기'
                  : viewMode === 'remaining'
                  ? `${fmtPct(alRemaining)} 잔여`
                  : `${fmtPct(alUsed)} 사용`}
              </span>
            </div>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${getProgressBarColor(alRemaining, alUsed)} h-1.5 rounded-full transition-all duration-500`}
              style={{ width: `${viewMode === 'remaining' ? clampPct(alRemaining) : clampPct(alUsed)}%` }}
            />
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-tight pt-0.5">
            {al.message || '7일 쿼터 리셋 완료 (전 모델 정상 호출 가능)'}
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
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${
                isNightDiscountNow
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {isNightDiscountNow ? '🌙 50% 야간 할인 적용 중!' : '☀️ 야간 23:00~09:00 할인'}
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
            <div className="flex items-center justify-between font-mono">
              <span>• <strong>deepseek-v4-flash-0731</strong> (Flash)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">50% Off (반값)</span>
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
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          주요 모델 (1M Context)
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Qwen 3.8 Max (1M)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Qwen 3.7 Plus (1M)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            DeepSeek V4 Pro (1M)
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            GLM 5.2 (128k)
          </span>
        </div>
      </div>
    </div>
  );
});

export default AlibabaCard;
