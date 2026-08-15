import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Metadata & Pricing Registry per 1M tokens (USD) & Total Context Windows based on Official OpenAI & Alibaba Model Studio
const MODEL_METADATA: Record<string, {
  name: string;
  provider: string;
  context: string;
  contextTokens: number;
  inputPrice1M: number;
  outputPrice1M: number;
  speed: string;
  reasoning: string;
}> = {
  // Google Antigravity
  'google-antigravity/gemini-3.7-flash': {
    name: 'Gemini 3.7 Flash',
    provider: 'Google Antigravity',
    context: '1,048,576 (1M)',
    contextTokens: 1048576,
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    speed: 'Ultra High (150+ t/s)',
    reasoning: 'Hybrid Thinking (Low-High)'
  },
  'google-antigravity/gemini-3.1-pro': {
    name: 'Gemini 3.1 Pro',
    provider: 'Google Antigravity',
    context: '1,048,576 (1M)',
    contextTokens: 1048576,
    inputPrice1M: 1.25,
    outputPrice1M: 5.00,
    speed: 'Fast (80+ t/s)',
    reasoning: 'Deep Reasoning'
  },
  'google-antigravity/claude-sonnet-4-6': {
    name: 'Claude Sonnet 4.6',
    provider: 'Google Antigravity',
    context: '200,000 (200k)',
    contextTokens: 200000,
    inputPrice1M: 3.00,
    outputPrice1M: 15.00,
    speed: 'Balanced (60+ t/s)',
    reasoning: 'High Nuance'
  },
  'google-antigravity/claude-opus-4-6-thinking': {
    name: 'Claude Opus 4.6 Thinking',
    provider: 'Google Antigravity',
    context: '200,000 (200k)',
    contextTokens: 200000,
    inputPrice1M: 15.00,
    outputPrice1M: 75.00,
    speed: 'Deep Thinking (35+ t/s)',
    reasoning: 'Max Reasoning'
  },

  // OpenAI Codex (Official OpenAI GPT-5.6 Sol Launch Pricing)
  'gpt-5.6-sol': {
    name: 'GPT-5.6 Sol',
    provider: 'OpenAI Codex',
    context: '128,000 (128k)',
    contextTokens: 128000,
    inputPrice1M: 5.00,
    outputPrice1M: 30.00,
    speed: 'Flagship Intelligence (750 t/s on Cerebras)',
    reasoning: 'Ultra Reasoning'
  },
  'gpt-5.6-terra': {
    name: 'GPT-5.6 Terra',
    provider: 'OpenAI Codex',
    context: '128,000 (128k)',
    contextTokens: 128000,
    inputPrice1M: 2.50,
    outputPrice1M: 15.00,
    speed: 'Balanced Daily Workload',
    reasoning: 'Medium-Ultra'
  },
  'gpt-5.6-luna': {
    name: 'GPT-5.6 Luna',
    provider: 'OpenAI Codex',
    context: '128,000 (128k)',
    contextTokens: 128000,
    inputPrice1M: 1.00,
    outputPrice1M: 6.00,
    speed: 'Fast & Cost-Effective',
    reasoning: 'Medium-Max'
  },
  'combo/Antigravity': {
    name: 'Combo Antigravity Failover',
    provider: 'OpenCodex Combo',
    context: '1,048,576 (1M)',
    contextTokens: 1048576,
    inputPrice1M: 0.15,
    outputPrice1M: 0.60,
    speed: 'Auto Failover',
    reasoning: 'Auto Failover'
  },

  // Alibaba Token Plan (Model Studio ap-southeast-1 Marketplace Specs)
  'alibaba-token-plan-intl/qwen3.8-max': {
    name: 'Qwen 3.8 Max',
    provider: 'Alibaba Token Plan',
    context: '1,000,000 (1M)',
    contextTokens: 1000000,
    inputPrice1M: 1.60,
    outputPrice1M: 6.40,
    speed: 'Heavy Duty MoE (2.4T)',
    reasoning: 'XHigh Reasoning'
  },
  'alibaba-token-plan-intl/qwen3.7-max': {
    name: 'Qwen 3.7 Max',
    provider: 'Alibaba Token Plan',
    context: '1,000,000 (1M)',
    contextTokens: 1000000,
    inputPrice1M: 1.60,
    outputPrice1M: 6.40,
    speed: 'Heavy Duty',
    reasoning: 'XHigh Reasoning'
  },
  'alibaba-token-plan-intl/qwen3.7-plus': {
    name: 'Qwen 3.7 Plus',
    provider: 'Alibaba Token Plan',
    context: '1,000,000 (1M)',
    contextTokens: 1000000,
    inputPrice1M: 0.26,
    outputPrice1M: 0.78,
    speed: 'High Speed Multimodal',
    reasoning: 'Medium Reasoning'
  },
  'alibaba-token-plan-intl/qwen3.6-flash': {
    name: 'Qwen 3.6 Flash',
    provider: 'Alibaba Token Plan',
    context: '1,000,000 (1M)',
    contextTokens: 1000000,
    inputPrice1M: 0.05,
    outputPrice1M: 0.20,
    speed: 'Ultra Fast',
    reasoning: 'Low-Medium'
  },
  'alibaba-token-plan-intl/deepseek-v4-pro': {
    name: 'DeepSeek V4 Pro',
    provider: 'Alibaba Token Plan',
    context: '1,000,000 (1M)',
    contextTokens: 1000000,
    inputPrice1M: 0.27,
    outputPrice1M: 1.10,
    speed: 'Code & Math Specialist',
    reasoning: 'High-Max'
  },
  'alibaba-token-plan-intl/deepseek-v4-flash-0731': {
    name: 'DeepSeek V4 Flash',
    provider: 'Alibaba Token Plan',
    context: '1,000,000 (1M)',
    contextTokens: 1000000,
    inputPrice1M: 0.14,
    outputPrice1M: 0.28,
    speed: 'Fast Inference',
    reasoning: 'Standard'
  },
  'alibaba-token-plan-intl/glm-5.2': {
    name: 'GLM 5.2',
    provider: 'Alibaba Token Plan',
    context: '128,000 (128k)',
    contextTokens: 128000,
    inputPrice1M: 1.00,
    outputPrice1M: 1.00,
    speed: 'Bilingual Pro',
    reasoning: 'Medium Reasoning'
  }
};

export async function GET() {
  const timestamp = Date.now();
  let isLocal = false;
  let rawQuota: any = null;
  let liveModels: any[] = [];
  
  try {
    const res = await fetch('http://127.0.0.1:10100/v1/models', {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data)) {
        liveModels = data.data;
        isLocal = true;
      }
    }
  } catch (err) {
    // Cloud fallback
  }

  try {
    const { stdout: quotaOut } = await execAsync('ocx provider quota --json', { timeout: 3000 });
    rawQuota = JSON.parse(quotaOut);
    isLocal = true;
  } catch (err) {
    // ignore
  }

  if (liveModels.length === 0) {
    liveModels = Object.keys(MODEL_METADATA).map(id => ({ id }));
  }

  const models = liveModels.map(m => {
    const meta = MODEL_METADATA[m.id] || {
      name: m.id,
      provider: m.id.includes('antigravity') ? 'Google Antigravity' : m.id.includes('alibaba') ? 'Alibaba Token Plan' : 'OpenAI Codex',
      context: '128,000 (128k)',
      contextTokens: 128000,
      inputPrice1M: 1.00,
      outputPrice1M: 2.00,
      speed: 'Standard',
      reasoning: 'Standard'
    };

    const isAlibaba = m.id.startsWith('alibaba-token-plan');
    const isClaude = m.id.includes('claude');
    return {
      id: m.id,
      name: meta.name,
      providerId: isAlibaba ? 'alibaba-token-plan-intl' : m.id.startsWith('google-antigravity') ? 'google-antigravity' : 'openai',
      providerName: meta.provider,
      context: meta.context,
      contextTokens: meta.contextTokens,
      inputPrice1M: meta.inputPrice1M,
      outputPrice1M: meta.outputPrice1M,
      speed: meta.speed,
      reasoning: meta.reasoning,
      status: (isAlibaba || isClaude) ? 'rate_limited' : 'active'
    };
  });

  let antigravityUsage = 0.08;
  let antigravityReset = 1786787166000;

  if (rawQuota?.reports) {
    const ag = rawQuota.reports.find((r: any) => r.provider === 'google-antigravity');
    if (ag?.quota?.customWindows?.[0]) {
      antigravityUsage = Number(ag.quota.customWindows[0].percent.toFixed(2));
      antigravityReset = ag.quota.customWindows[0].resetAt;
    }
  }

  let openaiUsage = 9.0;
  let openaiReset = 1789273515000;

  if (rawQuota?.reports) {
    const oa = rawQuota.reports.find((r: any) => r.provider === 'openai');
    if (oa?.quota) {
      openaiUsage = Number(oa.quota.monthlyPercent || 9.0);
      if (oa.quota.monthlyResetAt) {
        openaiReset = oa.quota.monthlyResetAt * 1000;
      }
    }
  }

  const lastWeeklySyncDate = new Date();
  const nextWeeklySyncDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const payload = {
    updatedAt: timestamp,
    environment: isLocal ? 'Local Mac Daemon (Live ocx Sync)' : 'Cloud Edge Snapshot',
    catalogSync: {
      isLiveConnected: isLocal,
      totalCatalogModels: models.length,
      lastWeeklySpecUpdate: lastWeeklySyncDate.toISOString(),
      nextWeeklySpecUpdate: nextWeeklySyncDate.toISOString()
    },
    summary: {
      totalProviders: 3,
      healthyProviders: 2,
      exhaustedProviders: 1,
      totalLinkedAccounts: 5,
      activeLLMCount: models.length
    },
    providers: [
      {
        provider: 'google-antigravity',
        name: 'Google Antigravity',
        status: 'healthy',
        account: 's***1@gmail.com',
        usagePercent: antigravityUsage,
        resetAt: antigravityReset,
        fiveHourWindow: {
          label: 'Gemini 5시간 롤링 사용량',
          usagePercent: antigravityUsage,
          resetAt: antigravityReset,
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
        },
        models: models.filter(m => m.providerId === 'google-antigravity')
      },
      {
        provider: 'openai',
        name: 'OpenAI Codex',
        status: 'healthy',
        plan: 'Free Multi-Account Pool',
        accountCount: 3,
        activeAccount: 's***n@gmail.com',
        pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
        monthlyUsagePercent: openaiUsage,
        monthlyResetAt: openaiReset,
        models: models.filter(m => m.providerId === 'openai')
      },
      {
        provider: 'alibaba-token-plan-intl',
        name: 'Alibaba Token Plan',
        status: 'exhausted',
        badge: 'HTTP 429 · Insufficient Quota',
        region: 'ap-southeast-1 (Singapore)',
        account: 'sk-s****HZew',
        weeklyUsagePercent: 100.0,
        resetAt: 1786782180000,
        message: '1-week quota exhausted. Auto-resets at 17:23:00 KST.',
        models: models.filter(m => m.providerId === 'alibaba-token-plan-intl')
      }
    ],
    allModels: models,
    integrations: [
      { name: 'OpenCodex Proxy', endpoint: 'http://127.0.0.1:10100', status: isLocal ? 'online' : 'cloud_mode' },
      { name: 'Hermes Gateway', runtime: 'launchd (PID 33929)', status: 'online' },
      { name: 'ElevenLabs Voice', service: 'Voice Synth (41b6...6484)', status: 'ready' },
      { name: 'Firecrawl Tool', service: 'Web Extract (fc-5...b8ae)', status: 'ready' }
    ]
  };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
