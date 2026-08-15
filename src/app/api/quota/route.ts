import { NextResponse } from 'next/server';

const GIST_URL = 'https://api.github.com/gists/67c16a5d365eddf3da98129350171338';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(GIST_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'LLM-Quota-Dashboard-App',
        'Accept': 'application/vnd.github+json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const raw = data.files?.['telemetry.json']?.content;
      if (raw) {
        const payload = JSON.parse(raw);
        return NextResponse.json(payload, {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma': 'no-cache'
          }
        });
      }
    }
  } catch (err) {
    console.error('Error fetching live gist telemetry:', err);
  }

  // Fallback if network is unavailable
  return NextResponse.json({
    updatedAt: Date.now(),
    environment: 'Snapshot Fallback',
    summary: {
      totalProviders: 3,
      healthyProviders: 3,
      exhaustedProviders: 0,
      totalLinkedAccounts: 5,
      activeLLMCount: 15,
      availableModelCount: 13,
      rateLimitedModelCount: 2
    },
    providers: [
      {
        provider: 'google-antigravity',
        name: 'Google Antigravity',
        status: 'healthy',
        account: 's***1@gmail.com',
        usagePercent: 48.52,
        resetAt: Date.now() + 4 * 3600 * 1000,
        fiveHourWindow: {
          label: 'Gemini 5시간 롤링 사용량',
          usagePercent: 48.52,
          resetAt: Date.now() + 4 * 3600 * 1000,
        },
        weeklyWindow: {
          label: 'Gemini 주간 누적 사용량',
          usagePercent: 4.57,
          resetAt: 1787337600000,
        },
        claudeCompact: {
          label: 'Claude (3rd Party)',
          status: 'exhausted',
          badge: '주간 쿼터 소진',
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
        monthlyUsagePercent: 9.0,
        monthlyResetAt: 1789273515000
      },
      {
        provider: 'alibaba-token-plan-intl',
        name: 'Alibaba Token Plan',
        status: 'healthy',
        badge: '정상 가동 (Active)',
        region: 'ap-southeast-1 (Singapore)',
        account: 'sk-s****HZew',
        weeklyUsagePercent: 0.5,
        resetAt: Date.now() + 7 * 24 * 3600 * 1000,
        message: '7일 쿼터 리셋 완료 (정상 가동 중)'
      }
    ]
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
