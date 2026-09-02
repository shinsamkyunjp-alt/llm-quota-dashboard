'use client';

import React, { memo } from 'react';
import type { ProviderInfo } from '@/types/telemetry';
import { GoogleAntigravityCard } from './GoogleAntigravityCard';
import { OpenAICard } from './OpenAICard';
import { AlibabaCard } from './AlibabaCard';
import { NousCard } from './NousCard';

interface ProviderTelemetryGridProps {
  antigravity: ProviderInfo;
  openai: ProviderInfo;
  alibaba: ProviderInfo;
  nous: ProviderInfo;
  viewMode: 'remaining' | 'usage';
  isNightDiscountNow: boolean;
}

export const ProviderTelemetryGrid = memo(function ProviderTelemetryGrid({
  antigravity,
  openai,
  alibaba,
  nous,
  viewMode,
  isNightDiscountNow,
}: ProviderTelemetryGridProps) {
  return (
    <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 box-border items-stretch">
      <GoogleAntigravityCard ag={antigravity} viewMode={viewMode} />
      <OpenAICard oa={openai} viewMode={viewMode} />
      <AlibabaCard al={alibaba} viewMode={viewMode} isNightDiscountNow={isNightDiscountNow} />
      <NousCard nous={nous} />
    </section>
  );
});

export default ProviderTelemetryGrid;
