'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import LiveUsageTab from '@/components/LiveUsageTab';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ViewModeSwitch } from '@/components/ViewModeSwitch';
import { KpiOverview } from '@/components/KpiOverview';
import { ProviderTelemetryGrid } from '@/components/provider-cards/ProviderTelemetryGrid';
import { TokenCalculator } from '@/components/TokenCalculator';
import { ModelPricingMatrix } from '@/components/ModelPricingMatrix';
import { AuxiliaryServices } from '@/components/AuxiliaryServices';
import { DashboardFooter } from '@/components/DashboardFooter';
import type { ModelInfo } from '@/types/telemetry';
import { DEFAULT_MODELS } from '@/data/models';
import { DEFAULT_TELEMETRY } from '@/data/defaultTelemetry';
import { useTelemetry } from '@/hooks/useTelemetry';

export default function QuotaDashboard() {
  const { data, loading, lastSync, syncToast, fetchTelemetry } = useTelemetry();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'context' | 'speed'>('default');

  // 다크모드, 뷰 모드(잔여량/소모량), 토큰 계산기 상태
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'remaining' | 'usage'>('remaining');
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcInputK, setCalcInputK] = useState<number>(200);
  const [calcOutputK, setCalcOutputK] = useState<number>(20);
  const [applyNightDiscount, setApplyNightDiscount] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'quota' | 'live-usage'>('quota');

  useEffect(() => {
    const saved = localStorage.getItem('llm_dashboard_theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('llm_dashboard_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('llm_dashboard_theme', 'light');
    }
  }, [isDarkMode]);

  const ag = data.antigravity || DEFAULT_TELEMETRY.antigravity;
  const oa = data.openai || DEFAULT_TELEMETRY.openai;
  const al = data.alibaba || DEFAULT_TELEMETRY.alibaba;
  const nous = data.nous || DEFAULT_TELEMETRY.nous;
  const rawModels: ModelInfo[] = data.allModels || DEFAULT_MODELS;

  const geminiPool = ag.geminiPool;
  const claudePool = ag.claudeGptPool;
  const gemini5h = geminiPool?.fiveHourWindow;
  const gemini5hUsed = gemini5h?.usagePercent ?? null;
  const gemini5hRemaining =
    gemini5h?.remainingPercent ?? (gemini5hUsed != null ? Math.max(0, 100 - gemini5hUsed) : null);

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

  const sum = data.summary || DEFAULT_TELEMETRY.summary;
  const healthyProviders = sum.healthyProviders ?? 0;
  const totalProviders = sum.totalProviders ?? 4;
  const availableModels = sum.availableModelCount ?? 0;
  const activeModels = sum.activeLLMCount ?? 0;
  const rateLimitedModels = sum.rateLimitedModelCount ?? 0;
  const totalModels = activeModels || rawModels.length;

  // 알리바바 야간 50% 할인 시간대 판별 (22:00 ~ 08:00 UTC+8 = 23:00 ~ 09:00 KST)
  const [isNightDiscountNow, setIsNightDiscountNow] = useState<boolean>(false);

  useEffect(() => {
    const kstHour = new Date().getHours();
    setIsNightDiscountNow(kstHour >= 23 || kstHour < 9);
  }, []);

  return (
    <div
      className={`w-full min-h-[100dvh] transition-colors duration-200 ${
        isDarkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
      } overflow-x-hidden box-border`}
    >
      <main className="w-full max-w-[1400px] mx-auto px-3 py-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 box-border">
        {/* Toast Notification */}
        {syncToast && (
          <div className="fixed top-6 right-6 z-50 bg-emerald-900 border border-emerald-500/50 text-emerald-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncToast}</span>
          </div>
        )}

        {/* Top Header */}
        <DashboardHeader
          totalModels={totalModels}
          availableModels={availableModels}
          viewMode={viewMode}
          setViewMode={setViewMode}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onRefresh={() => fetchTelemetry(true)}
          loading={loading}
        />

        {/* View Mode Toggle Switch (Quota <-> Live Usage) */}
        <ViewModeSwitch activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === 'quota' ? (
          <>
            {/* KPI Overview Strip */}
            <KpiOverview
              healthyProviders={healthyProviders}
              totalProviders={totalProviders}
              gemini5hRemaining={gemini5hRemaining}
              gemini5hUsed={gemini5hUsed}
              viewMode={viewMode}
              isClaudeExhausted={isClaudeExhausted}
              claudeWeeklyExhausted={claudeWeeklyExhausted}
              claude5hExhausted={claude5hExhausted}
              claude5hRemaining={claude5hRemaining}
              claude5hUsed={claude5hUsed}
              availableModels={availableModels}
              totalModels={totalModels}
              rateLimitedModels={rateLimitedModels}
            />

            {/* Main Provider Telemetry Grid */}
            <ProviderTelemetryGrid
              antigravity={ag}
              openai={oa}
              alibaba={al}
              nous={nous}
              viewMode={viewMode}
              isNightDiscountNow={isNightDiscountNow}
            />

            {/* Interactive Token Cost Calculator */}
            <TokenCalculator
              models={rawModels}
              calcInputK={calcInputK}
              setCalcInputK={setCalcInputK}
              calcOutputK={calcOutputK}
              setCalcOutputK={setCalcOutputK}
              applyNightDiscount={applyNightDiscount}
              setApplyNightDiscount={setApplyNightDiscount}
              isNightDiscountNow={isNightDiscountNow}
              showCalculator={showCalculator}
              setShowCalculator={setShowCalculator}
            />

            {/* Model Capability & Pricing Matrix */}
            <ModelPricingMatrix
              models={rawModels}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterProvider={filterProvider}
              setFilterProvider={setFilterProvider}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onRefresh={() => fetchTelemetry(true)}
              loading={loading}
            />

            {/* Infrastructure & Auxiliary Services */}
            <AuxiliaryServices />
          </>
        ) : (
          <LiveUsageTab models={rawModels} isNightDiscountNow={isNightDiscountNow} />
        )}

        {/* Footer */}
        <DashboardFooter lastSync={lastSync} environment={data?.environment} />
      </main>
    </div>
  );
}
