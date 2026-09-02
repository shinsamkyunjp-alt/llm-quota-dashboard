'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TelemetryPayload, ModelInfo, ProviderInfo, ProviderPool } from '@/types/telemetry';
import { DEFAULT_MODELS } from '@/data/models';
import { DEFAULT_TELEMETRY } from '@/data/defaultTelemetry';

const POLL_INTERVAL_MS = 15_000;

function normalizeTelemetry(json: TelemetryPayload): TelemetryPayload {
  const agData: Partial<ProviderInfo> =
    json.providers?.find((p) => p.provider === 'google-antigravity') ?? json.antigravity ?? {};
  const oaData: Partial<ProviderInfo> =
    json.providers?.find((p) => p.provider === 'openai') ?? json.openai ?? {};
  const aliData: Partial<ProviderInfo> =
    json.providers?.find((p) => p.provider === 'alibaba-token-plan-intl') ?? json.alibaba ?? {};
  const nousData: Partial<ProviderInfo> =
    json.providers?.find((p) => p.provider === 'nous') ?? json.nous ?? {};

  const rawList: ModelInfo[] =
    json.allModels && json.allModels.length > 0 ? json.allModels : DEFAULT_MODELS;

  // 모델 메타데이터 병합 (라이브 status + 서버 가격 우선, 로컬 메타 보완)
  const mergedModels: ModelInfo[] = rawList.map((m) => {
    const meta = DEFAULT_MODELS.find((d) => d.id === m.id);
    return {
      ...meta,
      ...m,
      tag: m.tag ?? meta?.tag,
      context: meta?.context ?? m.context ?? '1M',
    } as ModelInfo;
  });

  // Gemini pool 정규화
  const live5h = agData.geminiPool?.fiveHourWindow;
  const liveWeekly = agData.geminiPool?.weeklyWindow;
  const gemini5hUsed = typeof live5h?.usagePercent === 'number' ? live5h.usagePercent : null;
  const geminiWeeklyUsed =
    typeof liveWeekly?.usagePercent === 'number' ? liveWeekly.usagePercent : null;

  const geminiPool: ProviderPool = {
    label: 'Gemini Models',
    status: gemini5hUsed != null && gemini5hUsed >= 100 ? 'exhausted' : 'healthy',
    fiveHourWindow: {
      label: '5시간 롤링 한도',
      usagePercent: gemini5hUsed,
      remainingPercent: gemini5hUsed != null ? Math.max(0, 100 - gemini5hUsed) : null,
      resetAt: live5h?.resetAt ?? null,
      desc: '',
    },
    weeklyWindow: {
      label: '주간 누적 한도',
      usagePercent: geminiWeeklyUsed,
      remainingPercent: geminiWeeklyUsed != null ? Math.max(0, 100 - geminiWeeklyUsed) : null,
      resetAt: liveWeekly?.resetAt ?? null,
      desc: '',
    },
    models: ['Gemini 3.7 Flash', 'Gemini 3.1 Pro'],
  };

 // Claude pool 정규화
 const liveClaude = agData.claudeGptPool;
 const claude5hUsed =
   typeof liveClaude?.fiveHourWindow?.usagePercent === 'number'
     ? liveClaude.fiveHourWindow.usagePercent
     : 0;
 const claude5hRemaining =
    typeof liveClaude?.fiveHourWindow?.remainingPercent === 'number'
      ? liveClaude.fiveHourWindow.remainingPercent!
      : Math.max(0, 100 - claude5hUsed);
  const claudeWeeklyUsed =
    typeof liveClaude?.weeklyWindow?.usagePercent === 'number'
      ? liveClaude.weeklyWindow.usagePercent!
      : 0;
  const claudeWeeklyRemaining =
    typeof liveClaude?.weeklyWindow?.remainingPercent === 'number'
      ? liveClaude.weeklyWindow.remainingPercent!
      : Math.max(0, 100 - claudeWeeklyUsed);
  const isClaudeExhausted =
    liveClaude?.status === 'exhausted' || claude5hRemaining <= 0 || claudeWeeklyRemaining <= 0;

  const claudeGptPool: ProviderPool = {
    label: 'Claude and GPT models',
    status: isClaudeExhausted ? 'exhausted' : 'healthy',
    fiveHourWindow: {
      label: '5시간 롤링 한도',
      usagePercent: claude5hUsed,
      remainingPercent: claude5hRemaining,
      resetAt: liveClaude?.fiveHourWindow?.resetAt ?? null,
      desc: '',
    },
    weeklyWindow: {
      label: '주간 누적 한도',
      usagePercent: claudeWeeklyUsed,
      remainingPercent: claudeWeeklyRemaining,
      resetAt: liveClaude?.weeklyWindow?.resetAt ?? null,
      status: claudeWeeklyRemaining <= 0 ? 'exhausted' : 'healthy',
      badge: claudeWeeklyRemaining <= 0 ? '주간 한도 소진' : null,
      desc: claudeWeeklyRemaining <= 0 ? '주간 쿼터 소진 (호출 불가)' : '',
    },
    models: liveClaude?.models ?? ['Claude Sonnet 4.6', 'Claude Opus 4.6 Thinking'],
  };

  const aliWeeklyRemaining = aliData?.weeklyRemainingPercent ?? null;
  const isAliExhausted =
    aliData?.status === 'exhausted' ||
    (typeof aliWeeklyRemaining === 'number' && aliWeeklyRemaining <= 0);
  const isGeminiWeeklyExhausted =
    typeof geminiWeeklyUsed === 'number' && geminiWeeklyUsed >= 100;

  const dynamicModels: ModelInfo[] = mergedModels.map((m) => ({
    ...m,
    status: (() => {
      const isAlibaba = m.providerId === 'alibaba-token-plan-intl';
      const isAg = m.providerId === 'google-antigravity';
      const isGeminiPool = m.pool === 'gemini';
      const isClaudePool = m.pool === 'claude-gpt';
      const isOpenAI = m.providerId === 'openai';
      const oaExhausted = (oaData?.monthlyUsagePercent ?? 0) >= 100;
      if (isAlibaba && isAliExhausted) return 'rate_limited';
      if (isAg && isGeminiPool && gemini5hUsed != null && gemini5hUsed >= 100) return 'rate_limited';
      if (isAg && isClaudePool && isClaudeExhausted) return 'rate_limited';
      if (isOpenAI && oaExhausted) return 'rate_limited';
      return 'active';
    })(),
  }));

  const activeCount = dynamicModels.filter((m) => m.status === 'active').length;
  const limitedCount = dynamicModels.filter((m) => m.status === 'rate_limited').length;
  const isOaHealthy = (oaData?.monthlyUsagePercent ?? 0) < 100;
  const isAliHealthy = !isAliExhausted;
  const healthyProviderCount =
    (!isGeminiWeeklyExhausted ? 1 : 0) + (isOaHealthy ? 1 : 0) + (isAliHealthy ? 1 : 0) + 1;

  return {
    ...DEFAULT_TELEMETRY,
    summary: {
      totalProviders: 4,
      healthyProviders: healthyProviderCount,
      exhaustedProviders: 4 - healthyProviderCount,
      totalLinkedAccounts: json.summary?.totalLinkedAccounts ?? 6,
      activeLLMCount: dynamicModels.length,
      availableModelCount: activeCount,
      rateLimitedModelCount: limitedCount,
    },
    actualUsageMap: json.actualUsageMap ?? {},
    antigravity: {
      ...DEFAULT_TELEMETRY.antigravity,
      ...agData,
      status: isGeminiWeeklyExhausted ? 'exhausted' : 'healthy',
      geminiPool,
      claudeGptPool,
    },
    openai: { ...DEFAULT_TELEMETRY.openai, ...oaData },
    alibaba: { ...DEFAULT_TELEMETRY.alibaba, ...aliData },
    nous: { ...DEFAULT_TELEMETRY.nous, ...nousData },
    allModels: dynamicModels,
    environment: json.environment,
  };
}

export function useTelemetry() {
  const [data, setData] = useState<TelemetryPayload>(DEFAULT_TELEMETRY);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async (manual = false) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quota?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('API fetch failed');
      const json: TelemetryPayload = await res.json();
      if (json.providers) {
        setData(normalizeTelemetry(json));
      }
      setLastSync(new Date());
      if (manual) {
        setSyncToast('실시간 텔레메트리 동기화 완료!');
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 fetch + 15초 폴링 (cleanup으로 interval 안전 해제)
  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  return { data, loading, lastSync, syncToast, setSyncToast, fetchTelemetry };
}
