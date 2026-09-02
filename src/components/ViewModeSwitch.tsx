'use client';

import React, { memo } from 'react';
import { Layers, Activity } from 'lucide-react';

interface ViewModeSwitchProps {
  activeTab: 'quota' | 'live-usage';
  setActiveTab: React.Dispatch<React.SetStateAction<'quota' | 'live-usage'>>;
}

export const ViewModeSwitch = memo(function ViewModeSwitch({
  activeTab,
  setActiveTab,
}: ViewModeSwitchProps) {
  return (
    <section aria-label="대시보드 모드 전환 토글" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-2 sm:p-2.5 shadow-sm box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Mode Description & Indicator */}
        <div className="flex items-center gap-2.5 px-1.5 py-0.5">
          <div className={`p-2 rounded-xl transition-all ${
            activeTab === 'quota'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
          }`}>
            {activeTab === 'quota' ? <Layers className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">뷰 전환 토글</span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className={`text-xs font-bold font-mono ${
                activeTab === 'quota'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}>
                {activeTab === 'quota' ? '⚡ 쿼터 & 리셋 관제' : '📈 Live Usage & 토큰 예측'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {activeTab === 'quota'
                ? '프로바이더별 실시간 잔여 쿼터 한도 및 리셋 주기 모니터링'
                : '모델별 실제 토큰 소모량, 예상 비용(USD/KRW) 및 랭킹 분석'}
            </div>
          </div>
        </div>

        {/* Interactive Toggle Switch Control */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 bg-zinc-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/80 shrink-0">
          {/* Quota Button */}
          <button
            type="button"
            onClick={() => setActiveTab('quota')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'quota'
                ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-extrabold'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>쿼터 관제</span>
          </button>

          {/* Physical Switch Track & Slider */}
          <button
            type="button"
            role="switch"
            aria-checked={activeTab === 'live-usage'}
            aria-label="쿼터 관제와 라이브 사용량 모드 토글 전환"
            onClick={() => setActiveTab((prev) => (prev === 'quota' ? 'live-usage' : 'quota'))}
            className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'live-usage'
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : 'bg-emerald-600 dark:bg-emerald-500'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                activeTab === 'live-usage' ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {activeTab === 'live-usage' ? (
                <Activity className="w-3 h-3 text-indigo-600" />
              ) : (
                <Layers className="w-3 h-3 text-emerald-600" />
              )}
            </span>
          </button>

          {/* Live Usage Button */}
          <button
            type="button"
            onClick={() => setActiveTab('live-usage')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'live-usage'
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-extrabold'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span>라이브 사용량</span>
              <span className={`text-[9px] font-mono px-1 py-0.2 rounded-full font-bold ${
                activeTab === 'live-usage'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300'
                  : 'bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200'
              }`}>
                LIVE
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
});

export default ViewModeSwitch;
