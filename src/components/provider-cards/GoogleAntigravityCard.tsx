'use client';

import React, { memo } from 'react';
import { Sparkles, CheckCircle2, XCircle, Zap } from 'lucide-react';
import type { ProviderInfo } from '@/types/telemetry';
import { CountdownTimer } from '@/components/common/CountdownTimer';
import { fmtPct, clampPct, getProgressBarColor, getStatusTextColor } from '@/utils/formatters';

interface GoogleAntigravityCardProps {
  ag: ProviderInfo;
  viewMode: 'remaining' | 'usage';
}

export const GoogleAntigravityCard = memo(function GoogleAntigravityCard({
  ag,
  viewMode,
}: GoogleAntigravityCardProps) {
  const geminiPool = ag.geminiPool;
  const claudePool = ag.claudeGptPool;

  const gemini5h = geminiPool?.fiveHourWindow;
  const geminiWeekly = geminiPool?.weeklyWindow;
  const gemini5hUsed = gemini5h?.usagePercent ?? null;
  const gemini5hRemaining =
    gemini5h?.remainingPercent ?? (gemini5hUsed != null ? Math.max(0, 100 - gemini5hUsed) : null);
  const geminiWeeklyUsed = geminiWeekly?.usagePercent ?? null;
  const geminiWeeklyRemaining =
    geminiWeekly?.remainingPercent ?? (geminiWeeklyUsed != null ? Math.max(0, 100 - geminiWeeklyUsed) : null);

  const claudeExhausted = claudePool?.status === 'exhausted';
  const claude5hUsed = claudePool?.fiveHourWindow?.usagePercent ?? null;
  const claude5hRemaining =
    claudePool?.fiveHourWindow?.remainingPercent ?? (claude5hUsed != null ? Math.max(0, 100 - claude5hUsed) : null);
  const claudeWeekly = claudePool?.weeklyWindow;
  const claudeWeeklyUsed = claudeWeekly?.usagePercent ?? (claudeExhausted ? 100 : null);
  const claudeWeeklyRemaining =
    claudeWeekly?.remainingPercent ??
    (claudeWeeklyUsed != null ? Math.max(0, 100 - claudeWeeklyUsed) : (claudeExhausted ? 0 : null));
  const claude5hExhausted = typeof claude5hRemaining === 'number' && claude5hRemaining <= 0;
  const claudeWeeklyExhausted = typeof claudeWeeklyRemaining === 'number' && claudeWeeklyRemaining <= 0;
  const isClaudeExhausted = claudeExhausted || claude5hExhausted || claudeWeeklyExhausted;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow box-border overflow-hidden">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
              Google Antigravity
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 shrink-0">
            Plan: Google AI Pro
          </span>
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <span>
            계정: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">s***1@gmail.com</strong>
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
            Dual Quota Pool
          </span>
        </div>

        {/* Pool 1: Gemini Models */}
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Gemini Models
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 font-medium">
              Flash 3.7 & Pro 3.1
            </span>
          </div>

          {/* Gemini 5-Hour Window */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">5-Hour Limit:</span>
                {gemini5hRemaining != null && gemini5hRemaining <= 10 && (
                  <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                    소진 임박
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold ${getStatusTextColor(gemini5hRemaining, gemini5hUsed)}`}>
                {viewMode === 'remaining' ? `${fmtPct(gemini5hRemaining)} 잔여` : `${fmtPct(gemini5hUsed)} 사용`}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${getProgressBarColor(gemini5hRemaining, gemini5hUsed)} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${viewMode === 'remaining' ? clampPct(gemini5hRemaining) : clampPct(gemini5hUsed)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
              <span>완전 충전까지:</span>
              <CountdownTimer targetTimestamp={ag.geminiPool?.fiveHourWindow?.resetAt} />
            </div>
          </div>

          {/* Gemini Weekly Window */}
          <div className="space-y-1 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">Weekly Limit:</span>
                {geminiWeeklyRemaining != null && geminiWeeklyRemaining <= 10 && (
                  <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                    소진 임박
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold ${getStatusTextColor(geminiWeeklyRemaining, geminiWeeklyUsed)}`}>
                {viewMode === 'remaining' ? `${fmtPct(geminiWeeklyRemaining)} 잔여` : `${fmtPct(geminiWeeklyUsed)} 사용`}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${getProgressBarColor(geminiWeeklyRemaining, geminiWeeklyUsed)} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${viewMode === 'remaining' ? clampPct(geminiWeeklyRemaining) : clampPct(geminiWeeklyUsed)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
              <span>주간 완전 충전까지:</span>
              <CountdownTimer targetTimestamp={ag.geminiPool?.weeklyWindow?.resetAt} />
            </div>
          </div>
        </div>

        {/* Pool 2: Claude and GPT models */}
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
              {isClaudeExhausted ? (
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              Claude and GPT models
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium border ${
                isClaudeExhausted
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-700 dark:text-zinc-300 border-transparent'
              }`}
            >
              {claudeWeeklyExhausted
                ? '주간 한도 소진 (호출 불가)'
                : claude5hExhausted
                ? '5시간 한도 소진 (호출 불가)'
                : isClaudeExhausted
                ? '소진 (호출 불가)'
                : claudePool?.status === 'unknown'
                ? '계측 대기'
                : '리밋 정상 가동 (Ready)'}
            </span>
          </div>

          {/* Claude 5-Hour Window */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">5-Hour Limit:</span>
                {claude5hRemaining != null && claude5hRemaining <= 10 && (
                  <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                    소진 임박
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold ${getStatusTextColor(claude5hRemaining, claude5hUsed)}`}>
                {claude5hRemaining != null
                  ? viewMode === 'remaining'
                    ? `${fmtPct(claude5hRemaining)} 잔여`
                    : `${fmtPct(claude5hUsed)} 사용`
                  : '100% 잔여'}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${getProgressBarColor(claude5hRemaining, claude5hUsed)} h-1.5 rounded-full transition-all duration-500`}
                style={{ width: `${viewMode === 'remaining' ? clampPct(claude5hRemaining ?? 100) : clampPct(claude5hUsed ?? 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
              <span>완전 충전까지:</span>
              <CountdownTimer targetTimestamp={ag.claudeGptPool?.fiveHourWindow?.resetAt} />
            </div>
          </div>

          {/* Claude Weekly Window */}
          <div className="space-y-1 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">Weekly Limit:</span>
                {claudeWeeklyRemaining != null && claudeWeeklyRemaining <= 10 && (
                  <span className="px-1 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[9px]">
                    소진 임박
                  </span>
                )}
              </div>
              <span className={`font-mono font-bold ${getStatusTextColor(claudeWeeklyRemaining, claudeWeeklyUsed)}`}>
                {claudeWeeklyRemaining != null
                  ? viewMode === 'remaining'
                    ? `${fmtPct(claudeWeeklyRemaining)} 잔여`
                    : `${fmtPct(claudeWeeklyUsed)} 사용`
                  : claudeExhausted
                  ? '0% 잔여'
                  : '100% 잔여'}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
              <div
                className={`${getProgressBarColor(claudeWeeklyRemaining, claudeWeeklyUsed)} h-1.5 rounded-full transition-all duration-500`}
                style={{
                  width: `${
                    viewMode === 'remaining'
                      ? clampPct(claudeWeeklyRemaining ?? (claudeExhausted ? 0 : 100))
                      : clampPct(claudeWeeklyUsed ?? (claudeExhausted ? 100 : 0))
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5 font-mono">
              <span>주간 완전 충전까지:</span>
              <CountdownTimer targetTimestamp={ag.claudeGptPool?.weeklyWindow?.resetAt} />
            </div>
          </div>

          <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium flex items-center gap-1 pt-0.5">
            <Zap className="w-3 h-3 text-amber-500" />{' '}
            {claudeWeeklyExhausted
              ? 'Claude & GPT 주간 쿼터 소진 — 주간 리셋 전까지 호출 불가'
              : claude5hExhausted
              ? 'Claude & GPT 5시간 한도 소진 — 리셋 후 호출 재개'
              : isClaudeExhausted
              ? 'Claude & GPT 쿼터 소진'
              : 'Claude Sonnet 4.6 & Opus 4.6 Thinking 정상 호출 가능'}
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          주요 지원 모델
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Gemini 3.7 Flash
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Gemini 3.1 Pro
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Claude Sonnet 4.6
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
            Claude Opus 4.6
          </span>
        </div>
      </div>
    </div>
  );
});

export default GoogleAntigravityCard;
