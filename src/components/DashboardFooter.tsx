'use client';

import React, { memo } from 'react';
import { formatTime } from '@/utils/formatters';

interface DashboardFooterProps {
  lastSync: Date | null;
  environment?: string;
}

export const DashboardFooter = memo(function DashboardFooter({
  lastSync,
  environment = 'Live',
}: DashboardFooterProps) {
  return (
    <footer className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 pb-6 space-y-1">
      <div className="font-medium text-zinc-600 dark:text-zinc-300">
        LLM Quota & Telemetry Cockpit · Designed for 삼균 님
      </div>
      <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        Last Synced: {formatTime(lastSync)} · Mode: {environment}
      </div>
    </footer>
  );
});

export default DashboardFooter;
