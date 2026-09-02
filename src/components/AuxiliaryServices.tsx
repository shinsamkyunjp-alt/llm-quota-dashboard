'use client';

import React, { memo } from 'react';
import { HardDrive } from 'lucide-react';

export const AuxiliaryServices = memo(function AuxiliaryServices() {
  return (
    <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-sm box-border">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-zinc-500 shrink-0" />
          연동 인프라 및 보조 서비스 상태
        </div>
        <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
          macOS (Darwin) · launchd Active
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-3 text-xs">
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Google Antigravity</div>
          <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> Google AI Pro (4ms)
          </div>
        </div>
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">OpenCodex Proxy</div>
          <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> 127.0.0.1:10100
          </div>
        </div>
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Hermes Gateway</div>
          <div className="text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> launchd (PID 33929)
          </div>
        </div>
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Qwen Voice</div>
          <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" /> CosyVoice (Active)
          </div>
        </div>
        <div className="bg-zinc-50/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl p-2.5 min-w-0">
          <div className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate">Firecrawl Tool</div>
          <div className="text-zinc-800 dark:text-zinc-200 font-bold mt-1 flex items-center gap-1.5 text-xs truncate">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" /> Web Extract
          </div>
        </div>
      </div>
    </section>
  );
});

export default AuxiliaryServices;
