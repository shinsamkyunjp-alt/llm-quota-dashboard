'use client';

import React, { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '@/utils/formatters';

export const LiveClock = memo(function LiveClock() {
  const [timeStr, setTimeStr] = useState<string>('--:--:--');

  useEffect(() => {
    const update = () => setTimeStr(formatTime(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-zinc-700 dark:text-zinc-300 font-medium shrink-0">
      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" aria-hidden="true" />
      <span aria-label="현재 시각">{timeStr}</span>
    </div>
  );
});

export default LiveClock;
