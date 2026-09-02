'use client';

import React, { useState, useEffect, memo } from 'react';

interface CountdownTimerProps {
  targetTimestamp?: number | null;
}

export const CountdownTimer = memo(function CountdownTimer({ targetTimestamp }: CountdownTimerProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!targetTimestamp) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (!targetTimestamp) return <span className="font-mono text-zinc-600 dark:text-zinc-300">N/A</span>;
  if (now == null) return <span className="font-mono text-zinc-600 dark:text-zinc-300">--:--:--</span>;

  const diff = targetTimestamp - now;
  if (diff <= 0) return <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">00:00:00 (리셋 완료)</span>;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return <span className="font-mono text-zinc-700 dark:text-zinc-300">{days}일 {hours % 24}시간</span>;
  }

  return (
    <span className="font-mono text-zinc-700 dark:text-zinc-300">
      {`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
    </span>
  );
});

export default CountdownTimer;
