'use client';

import React, { memo } from 'react';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { LiveClock } from '@/components/common/LiveClock';

interface DashboardHeaderProps {
  totalModels: number;
  availableModels: number;
  viewMode: 'remaining' | 'usage';
  setViewMode: (mode: 'remaining' | 'usage') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const DashboardHeader = memo(function DashboardHeader({
  totalModels,
  availableModels,
  viewMode,
  setViewMode,
  isDarkMode,
  setIsDarkMode,
}: DashboardHeaderProps) {
  return (
    <header className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 box-border">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
            LLM Quota & Telemetry Matrix
          </h1>
          <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
            Live Dual Pool & Multi-Account
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <span>Google Antigravity(Gemini & Claude 듀얼 풀 완벽 반영), OpenAI Codex, Alibaba Token Plan, Nous Research 실시간 통합 관제</span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> {totalModels}개 전체 모델 · {availableModels}개 호출 가능
          </span>
        </div>
      </div>

      {/* Global Controls & Status */}
      <div className="flex items-center justify-between md:justify-end gap-2 pt-2.5 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 flex-wrap">
        {/* View Mode Toggle: Remaining vs Usage */}
        <div role="group" aria-label="쿼터 수치 보기 방식 선택" className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setViewMode('remaining')}
            aria-pressed={viewMode === 'remaining'}
            className={`px-2.5 py-1 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${viewMode === 'remaining' ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            잔여량 (Remaining %)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('usage')}
            aria-pressed={viewMode === 'usage'}
            className={`px-2.5 py-1 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${viewMode === 'usage' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}
          >
            사용량 (Used %)
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>

        <LiveClock />
      </div>
    </header>
  );
});

export default DashboardHeader;
