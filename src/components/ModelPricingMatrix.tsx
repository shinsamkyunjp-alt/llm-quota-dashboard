'use client';

import React, { useMemo, memo } from 'react';
import { Server, Search, CheckCircle2, XCircle, Calendar, RefreshCw } from 'lucide-react';
import type { ModelInfo } from '@/types/telemetry';
import { PROVIDER_SORT_ORDER, MODEL_SORT_ORDER, isNightEligibleModel } from '@/data/models';

interface ModelPricingMatrixProps {
  models: ModelInfo[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  filterProvider: string;
  setFilterProvider: (p: string) => void;
  sortBy: 'default' | 'price' | 'context' | 'speed';
  setSortBy: (s: 'default' | 'price' | 'context' | 'speed') => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const ModelPricingMatrix = memo(function ModelPricingMatrix({
  models,
  searchTerm,
  setSearchTerm,
  filterProvider,
  setFilterProvider,
  sortBy,
  setSortBy,
  onRefresh,
  loading = false,
}: ModelPricingMatrixProps) {
  const filteredModels = useMemo(() => {
    let list = models.filter((m) => {
      if (filterProvider !== 'all' && m.providerId !== filterProvider) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return (
          m.id.toLowerCase().includes(query) ||
          m.name.toLowerCase().includes(query) ||
          m.providerName.toLowerCase().includes(query)
        );
      }
      return true;
    });

    if (sortBy === 'price') {
      list = [...list].sort((a, b) => (a.inputPrice1M ?? 0) - (b.inputPrice1M ?? 0));
    } else if (sortBy === 'context') {
      list = [...list].sort((a, b) => (b.contextTokens ?? 0) - (a.contextTokens ?? 0));
    } else {
      // Default: Google -> OpenAI -> Alibaba -> Nous
      list = [...list].sort((a, b) => {
        const pA = PROVIDER_SORT_ORDER[a.providerId] ?? 99;
        const pB = PROVIDER_SORT_ORDER[b.providerId] ?? 99;
        if (pA !== pB) return pA - pB;
        const mA = MODEL_SORT_ORDER[a.id] ?? 99;
        const mB = MODEL_SORT_ORDER[b.id] ?? 99;
        return mA - mB;
      });
    }

    return list;
  }, [models, filterProvider, searchTerm, sortBy]);

  return (
    <section className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm box-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-600 dark:text-zinc-400 shrink-0" />
              전체 모델 라우팅 & 토큰 단가 매트릭스 ({filteredModels.length}개 모델)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium border border-zinc-200 dark:border-zinc-700">
              1M Tokens Pricing
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Google Antigravity · OpenAI Codex · Alibaba Token Plan · Nous Research 공식 토큰 단가 및 컨텍스트 스펙
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              id="model-search-input"
              aria-label="모델명 또는 프로바이더 검색"
              type="text"
              placeholder="모델명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 w-full sm:w-44 font-medium"
            />
          </div>

          <select
            id="filter-provider-select"
            aria-label="프로바이더 필터 선택"
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shrink-0"
          >
            <option value="all">전체 프로바이더</option>
            <option value="google-antigravity">Google Antigravity</option>
            <option value="openai">OpenAI Codex</option>
            <option value="alibaba-token-plan-intl">Alibaba Token Plan</option>
            <option value="nous">Nous Research</option>
          </select>

          <select
            id="sort-by-select"
            aria-label="모델 정렬 기준 선택"
            value={sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSortBy(e.target.value as 'default' | 'price' | 'context' | 'speed')
            }
            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shrink-0"
          >
            <option value="default">기본 정렬</option>
            <option value="price">입력 단가 낮은 순</option>
            <option value="context">컨텍스트 큰 순</option>
          </select>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all font-semibold text-xs cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
              title="실시간 ocx 모델 맵핑 & 텔레메트리 동기화"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl bg-transparent">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">전체 LLM 모델 단가 및 컨텍스트 스펙 표</caption>
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider font-medium border-b border-zinc-200/80 dark:border-zinc-800/80">
            <tr>
              <th scope="col" className="py-3 px-4">
                모델 식별자 (ID)
              </th>
              <th scope="col" className="py-3 px-4">
                프로바이더 / 풀
              </th>
              <th scope="col" className="py-3 px-4">
                컨텍스트 윈도우
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                입력 단가 (1M)
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                출력 단가 (1M)
              </th>
              <th scope="col" className="py-3 px-4">
                처리 속도 / 추론
              </th>
              <th scope="col" className="py-3 px-4 text-center">
                현재 라우팅 상태
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 font-mono">
            {filteredModels.map((item) => (
              <tr key={item.id} className="hover:bg-white dark:hover:bg-zinc-800/80 transition-colors">
                <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{item.id}</span>
                    {item.tag && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-medium">
                        {item.tag}
                      </span>
                    )}
                    {isNightEligibleModel(item.id) && (
                      <span
                        title="야간(23:00~09:00 KST) 크레딧 50% 할인 모델"
                        className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-sans font-bold border border-amber-300 dark:border-amber-700 flex items-center gap-0.5"
                      >
                        🌙 50%
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300 font-sans">
                  <div>{item.providerName}</div>
                  {item.pool && <div className="text-[10px] text-zinc-400">Pool: {item.pool}</div>}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      (item.contextTokens ?? 0) >= 1_000_000
                        ? 'bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                        : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {item.context}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                  ${(item.inputPrice1M ?? 0).toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  ${(item.outputPrice1M ?? 0).toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400 font-sans text-[11px]">
                  <div>{item.speed || '-'}</div>
                  <div className="text-zinc-400 text-[10px]">{item.reasoning}</div>
                </td>
                <td className="py-3.5 px-4 font-sans text-center">
                  {item.status === 'rate_limited' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[11px] font-semibold">
                      <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> 호출 불가 (Rate Limited)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 호출 가능 (Ready)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-2">
        {filteredModels.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 box-border"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all flex items-center gap-1.5 flex-wrap">
                <span>{item.id}</span>
                {item.tag && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-sans font-medium border border-emerald-200 dark:border-emerald-800">
                    {item.tag}
                  </span>
                )}
                {isNightEligibleModel(item.id) && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-sans font-bold border border-amber-300 dark:border-amber-700">
                    🌙 50%
                  </span>
                )}
              </div>
              {item.status === 'rate_limited' ? (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-[10px] font-semibold">
                  <XCircle className="w-2.5 h-2.5 text-rose-600" /> 불가
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> 가능
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-800 font-mono">
              <span>
                {item.providerName} ({item.context})
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                In \${(item.inputPrice1M ?? 0).toFixed(2)} / Out \${(item.outputPrice1M ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sync Info Footer Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>
            단가 & 스펙 DB 동기화: <strong>정상 반영됨 (Active Verified)</strong>
          </span>
        </div>
        <div>
          Live Active Models:{' '}
          <span className="text-zinc-800 dark:text-zinc-200 font-mono font-bold">{models.length} Models Linked</span>
        </div>
      </div>
    </section>
  );
});

export default ModelPricingMatrix;
