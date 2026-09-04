'use client';

import React, { memo } from 'react';
import { Calendar } from 'lucide-react';
import type { ProviderInfo } from '@/types/telemetry';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { fmtPct, clampPct, getProgressBarColor, getStatusTextColor } from '@/utils/formatters';

interface OpenAICardProps {
  oa: ProviderInfo;
  viewMode: 'remaining' | 'usage';
}

export const OpenAICard = memo(function OpenAICard({ oa, viewMode }: OpenAICardProps) {
  const oaUsed = oa.monthlyUsagePercent ?? null;
  const oaRemaining =
    oa.monthlyRemainingPercent ?? (oaUsed != null ? Math.max(0, 100 - oaUsed) : null);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              OpenAI Codex
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
            Free Multi-Account Pool
          </span>
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <span>
            활성 계정: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">{oa.activeAccount || 's***n@gmail.com'}</strong>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
            3개 계정 풀링
          </span>
        </div>

        {/* Monthly Quota Usage */}
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              월간 쿼터 현황
            </span>
            <div className="flex items-center gap-1">
              {oaRemaining != null && oaRemaining <= 10 && (
                <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                  소진 임박
                </span>
              )}
              <span className={`font-mono text-xs font-bold ${getStatusTextColor(oaRemaining, oaUsed)}`}>
                {viewMode === 'remaining' ? `${fmtPct(oaRemaining)} 잔여` : `${fmtPct(oaUsed)} 사용`}
              </span>
            </div>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`${getProgressBarColor(oaRemaining, oaUsed)} h-1.5 rounded-full transition-all duration-500`}
              style={{ width: `${viewMode === 'remaining' ? clampPct(oaRemaining) : clampPct(oaUsed)}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between pt-0.5 font-mono">
            <span>월간 리셋 D-Day (가장 빠른 계정 기준):</span>
            <CountdownTimer targetTimestamp={oa.monthlyResetAt} />
          </div>
        </div>

        {/* Pooled Accounts List */}
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-1.5">
          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center justify-between">
            <span>풀링된 계정 목록 ({oa.pooledAccountDetails?.length || oa.pooledAccounts?.length || 3})</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">순환 로테이션</span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            {(oa.pooledAccountDetails && oa.pooledAccountDetails.length > 0
              ? oa.pooledAccountDetails
              : (oa.pooledAccounts || ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com']).map(
                  (a: string) => ({ account: a, state: 'standby' as const, usagePercent: null })
                )
            ).map(
              (
                acc: {
                  account: string;
                  accountId?: string;
                  state: 'active' | 'standby' | 'exhausted';
                  usagePercent?: number | null;
                },
                idx: number
              ) => (
                <div
                  key={acc.accountId || idx}
                  className={`flex items-center justify-between ${
                    acc.state === 'active' ? 'text-zinc-800 dark:text-zinc-300' : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <span>• {acc.account}</span>
                  <span className="flex items-center gap-1.5">
                    {typeof acc.usagePercent === 'number' && (
                      <span className="text-zinc-400 text-[10px]">{acc.usagePercent}% 사용</span>
                    )}
                    {acc.state === 'active' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Active</span>
                    ) : acc.state === 'exhausted' ? (
                      <span className="text-rose-500 dark:text-rose-400 font-bold text-[10px]">소진</span>
                    ) : (
                      <span className="text-zinc-400 text-[10px]">Standby</span>
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          주요 모델 ({oa.models?.length ?? 0})
        </div>
        <div className="flex flex-wrap gap-1">
          {oa.models && oa.models.length > 0 ? (
            oa.models.map((m) => (
              <span
                key={m.id}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
              >
                {m.name}
              </span>
            ))
          ) : (
            <>
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                GPT-5.6 Terra
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                GPT-5.6 Luna
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default OpenAICard;
