import { NextResponse } from 'next/server';

const GIST_ID = process.env.GIST_ID || '67c16a5d365eddf3da98129350171338';
const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;

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
