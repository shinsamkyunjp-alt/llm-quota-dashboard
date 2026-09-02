import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { ModelInfo, TelemetryPayload } from '@/types/telemetry';
import { DEFAULT_MODELS } from '@/data/models';

const GIST_ID = process.env.GIST_ID || '67c16a5d365eddf3da98129350171338';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 로컬 OpenCodex 카탈로그 동기화 헬퍼
function mergeLiveOcxModels(payload: TelemetryPayload): TelemetryPayload {
  try {
    const ocxCatalogPath = path.join(os.homedir(), '.codex', 'opencodex-catalog.json');
    if (!fs.existsSync(ocxCatalogPath)) return payload;

    const raw = fs.readFileSync(ocxCatalogPath, 'utf-8');
    const ocxData = JSON.parse(raw);
    const ocxModels: Array<{ slug?: string; display_name?: string; description?: string }> = ocxData.models || [];

    if (!Array.isArray(ocxModels) || ocxModels.length === 0) return payload;

    const existingMap = new Map<string, ModelInfo>();
    (payload.allModels || []).forEach((m) => existingMap.set(m.id, m));

    // OpenCodex 활성 모델들을 텔레메트리 allModels에 실시간 맵핑
    const updatedModels: ModelInfo[] = [];
    const seenIds = new Set<string>();

    for (const ocxM of ocxModels) {
      const slug = ocxM.slug;
      if (!slug) continue;
      seenIds.add(slug);

      const existing = existingMap.get(slug);
      const def = DEFAULT_MODELS.find((d) => d.id === slug);

      if (existing) {
        updatedModels.push({
          ...existing,
          status: existing.status === 'rate_limited' ? 'rate_limited' : 'active',
        });
      } else if (def) {
        updatedModels.push({ ...def, status: 'active' });
      } else {
        // 미등록 ocx 신규 모델 자동 인입
        const provId = slug.includes('/') ? slug.split('/')[0] : 'openai';
        updatedModels.push({
          id: slug,
          name: ocxM.display_name || slug,
          providerId: provId,
          providerName: provId === 'google-antigravity' ? 'Google Antigravity' : provId === 'alibaba-token-plan-intl' ? 'Alibaba Token Plan' : provId === 'nous' ? 'Nous Research' : 'OpenAI Codex',
          context: '1M',
          contextTokens: 1048576,
          inputPrice1M: 0.2,
          outputPrice1M: 1.0,
          speed: 'Realtime Fast',
          reasoning: 'Live ocx',
          tag: 'Live ocx Model',
          status: 'active',
        });
      }
    }

    // 기존 모델 중 멀티모달 등 카탈로그 외 필수 모델 보존
    (payload.allModels || []).forEach((m) => {
      if (!seenIds.has(m.id)) {
        updatedModels.push(m);
      }
    });

    return {
      ...payload,
      allModels: updatedModels,
      summary: {
        ...payload.summary,
        activeLLMCount: updatedModels.length,
        availableModelCount: updatedModels.filter((m) => m.status === 'active').length,
      },
    };
  } catch (err) {
    console.error('Error syncing local ocx catalog in route:', err);
    return payload;
  }
}

export async function GET() {
  let payload: TelemetryPayload | null = null;

  // 1. GitHub Gist로부터 라이브 동기화 데이터 시도
  try {
    const gistUrlWithCacheBust = `https://api.github.com/gists/${GIST_ID}?t=${Date.now()}`;
    const res = await fetch(gistUrlWithCacheBust, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'LLM-Quota-Dashboard-App',
        Accept: 'application/vnd.github+json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.files?.['telemetry.json']?.content;
      if (raw) {
        payload = JSON.parse(raw);
      }
    }
  } catch (err) {
    console.error('Error fetching live gist telemetry:', err);
  }

  // 2. Gist 실패 시 로컬 public/telemetry.json 파일 우선 참조
  if (!payload) {
    try {
      const localTelemetryPath = path.join(process.cwd(), 'public', 'telemetry.json');
      if (fs.existsSync(localTelemetryPath)) {
        payload = JSON.parse(fs.readFileSync(localTelemetryPath, 'utf-8'));
      }
    } catch (localErr) {
      console.error('Error reading local telemetry fallback:', localErr);
    }
  }

  if (payload) {
    // 3. 로컬 머신의 최신 ocx 모델 맵핑 실시간 병합
    const finalPayload = mergeLiveOcxModels(payload);
    return NextResponse.json(finalPayload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        Pragma: 'no-cache',
      },
    });
  }

  // 4. Fallback if network and local files are unavailable
  return NextResponse.json({
    updatedAt: Date.now(),
    environment: 'Live Antigravity Snapshot',
    summary: {
      totalProviders: 4,
      healthyProviders: 4,
      exhaustedProviders: 0,
      totalLinkedAccounts: 6,
      activeLLMCount: 14,
      availableModelCount: 14,
      rateLimitedModelCount: 0
    },
    providers: [
      {
        provider: 'google-antigravity',
        name: 'Google Antigravity',
        plan: 'Google AI Pro',
        status: 'healthy',
        account: 's***1@gmail.com',
      geminiPool: {
          label: 'Gemini Models',
          status: 'healthy',
          fiveHourWindow: {
            label: '5시간 롤링 한도',
            remainingPercent: null,
            usagePercent: null,
            resetAt: null,
            desc: ''
          },
          weeklyWindow: {
            label: '주간 누적 한도',
            remainingPercent: null,
            usagePercent: null,
            resetAt: null,
            desc: ''
          },
          models: ['Gemini 3.7 Flash', 'Gemini 3.1 Pro']
        },
      claudeGptPool: {
          label: 'Claude and GPT models',
          status: 'unknown',
          fiveHourWindow: {
            label: '5시간 롤링 한도',
            remainingPercent: null,
            usagePercent: null,
            resetAt: null,
            desc: ''
          },
          weeklyWindow: {
            label: '주간 누적 한도',
            remainingPercent: null,
            usagePercent: null,
            resetAt: null,
            desc: ''
          },
          models: ['Sonnet 4.6', 'Opus 4.6 Thinking']
        }
      },
      {
        provider: 'openai',
        name: 'OpenAI Codex',
        status: 'healthy',
        plan: 'Free Multi-Account Pool',
        accountCount: 3,
      activeAccount: 's***n@gmail.com',
      pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
      monthlyUsagePercent: null,
      monthlyRemainingPercent: null,
      monthlyResetAt: 1789273515000
      },
      {
        provider: 'alibaba-token-plan-intl',
        name: 'Alibaba Token Plan',
        status: 'healthy',
        badge: '정상 가동 (Active)',
        region: 'ap-southeast-1 (Singapore)',
      account: 'sk-s****HZew',
      weeklyUsagePercent: null,
      weeklyRemainingPercent: null,
      resetAt: null,
        message: '7일 쿼터 리셋 완료 (정상 가동 중)'
      },
      {
        provider: 'nous',
        name: 'Nous Research',
        status: 'healthy',
        plan: 'Hermes Agent (OAuth)',
        account: 'hermes-cli (nas_organisation)',
        message: 'OAuth OK / stealth-ox-alpha active'
      }
    ]
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
