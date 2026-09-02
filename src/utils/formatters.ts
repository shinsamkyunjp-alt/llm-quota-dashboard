import type { ModelInfo } from '@/types/telemetry';

const TIME_FMT = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
});

export function formatTime(date: Date | null): string {
  return date ? TIME_FMT.format(date) : '--:--:--';
}

export function fmtPct(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return 'N/A';
  const v = Math.round(n * 10) / 10;
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + '%';
}

export function clampPct(n?: number | null): number {
  return Math.min(100, Math.max(0, n ?? 0));
}

export function getProgressBarColor(remaining?: number | null, used?: number | null): string {
  const rem = remaining != null ? remaining : (used != null ? 100 - used : 100);
  if (rem <= 10) return 'bg-rose-500';
  if (rem <= 25) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getStatusTextColor(remaining?: number | null, used?: number | null): string {
  const rem = remaining != null ? remaining : (used != null ? 100 - used : 100);
  if (rem <= 10) return 'text-rose-600 dark:text-rose-400';
  if (rem <= 25) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-700 dark:text-emerald-400';
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function calcCostUSD(
  model: ModelInfo,
  usage: { input: number; uncached?: number; cached?: number; output: number }
): number {
  const inPrice = model.inputPrice1M ?? 0;
  const cachedPrice = model.cachedPrice1M ?? inPrice * 0.2;
  const outPrice = model.outputPrice1M ?? 0;
  const uncached = usage.uncached ?? Math.max(0, usage.input - (usage.cached ?? 0));
  const cached = usage.cached ?? 0;
  return (inPrice * uncached + cachedPrice * cached + outPrice * usage.output) / 1_000_000;
}
