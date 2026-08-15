import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  const timestamp = Date.now();
  let isLocal = false;
  let rawQuota: any = null;

  try {
    const { stdout: quotaOut } = await execAsync('ocx provider quota --json', { timeout: 3000 });
    rawQuota = JSON.parse(quotaOut);
    isLocal = true;
  } catch (err) {
    isLocal = false;
  }

  // Antigravity: Gemini (Usage %) + Claude (Weekly quota exhausted)
  let antigravityQuota = {
    provider: 'google-antigravity',
    name: 'Google Antigravity',
    status: 'healthy',
    account: 's***1@gmail.com',
    fiveHourWindow: {
      label: 'Gemini 5시간 롤링 사용량',
      usagePercent: 0.08,
      resetAt: 1786787166000, // ~18:46 KST
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
      message: 'Claude 주간 쿼터가 소진되어 쿨다운 상태입니다.',
      models: ['Sonnet 4.6', 'Opus 4.6 Thinking']
    },
    models: [
      { id: 'google-antigravity/gemini-3.7-flash', name: 'Gemini 3.7 Flash', speed: 'Ultra High Speed', context: '1,000,000 (1M)', reasoning: 'Hybrid (Low-High)', status: 'active' },
      { id: 'google-antigravity/gemini-3.1-pro', name: 'Gemini 3.1 Pro', speed: 'High Speed', context: '1,000,000 (1M)', reasoning: 'Deep Reasoning', status: 'active' },
      { id: 'google-antigravity/claude-sonnet-4-6', name: 'Claude Sonnet 4.6', speed: 'Balanced', context: '200,000 (200k)', reasoning: 'High Nuance', status: 'rate_limited' },
      { id: 'google-antigravity/claude-opus-4-6-thinking', name: 'Claude Opus 4.6 Thinking', speed: 'Deep Thinking', context: '200,000 (200k)', reasoning: 'Max Reasoning', status: 'rate_limited' }
    ]
  };

  if (rawQuota?.reports) {
    const agReport = rawQuota.reports.find((r: any) => r.provider === 'google-antigravity');
    if (agReport?.quota?.customWindows?.[0]) {
      const win = agReport.quota.customWindows[0];
      antigravityQuota.fiveHourWindow.usagePercent = Number(win.percent.toFixed(2));
      antigravityQuota.fiveHourWindow.resetAt = win.resetAt;
    }
  }

  // Parse OpenAI Codex (Usage %)
  let openaiQuota = {
    provider: 'openai',
    name: 'OpenAI Codex',
    status: 'healthy',
    plan: 'Free Multi-Account Pool',
    accountCount: 3,
    activeAccount: 's***n@gmail.com',
    pooledAccounts: ['s***n@gmail.com (Main)', 's***2@naver.com', 's***9@gmail.com'],
    monthlyUsagePercent: 9.0,
    monthlyResetAt: 1789273515000, // 2026-09-13
    models: [
      { id: 'gpt-5.6-sol', name: 'GPT-5.6 Sol', speed: 'High Throughput', context: '128,000 (128k)', reasoning: 'Low-Ultra', status: 'active' },
      { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', speed: 'Balanced Reasoning', context: '128,000 (128k)', reasoning: 'Medium-Ultra', status: 'active' },
      { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', speed: 'Cost-Effective', context: '128,000 (128k)', reasoning: 'Medium-Max', status: 'active' }
    ]
  };

  if (rawQuota?.reports) {
    const oaReport = rawQuota.reports.find((r: any) => r.provider === 'openai');
    if (oaReport?.quota) {
      openaiQuota.monthlyUsagePercent = Number(oaReport.quota.monthlyPercent || 9.0);
      if (oaReport.quota.monthlyResetAt) {
        openaiQuota.monthlyResetAt = oaReport.quota.monthlyResetAt * 1000;
      }
    }
  }

  // Alibaba: 100% exhausted
  const alibabaQuota = {
    provider: 'alibaba-token-plan-intl',
    name: 'Alibaba Token Plan',
    status: 'exhausted',
    badge: 'HTTP 429 · Insufficient Quota',
    region: 'ap-southeast-1 (Singapore)',
    account: 'sk-s****HZew',
    weeklyUsagePercent: 100.0,
    resetAt: 1786782180000, // 17:23:00 KST
    message: '1-week quota exhausted. Auto-resets at 17:23:00 KST.',
    models: [
      { id: 'alibaba-token-plan-intl/qwen3.8-max', name: 'Qwen 3.8 Max', speed: 'Heavy Duty', context: '128,000 (128k)', reasoning: 'XHigh Reasoning', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/qwen3.7-plus', name: 'Qwen 3.7 Plus', speed: 'High Speed', context: '128,000 (128k)', reasoning: 'Medium Reasoning', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/qwen3.6-flash', name: 'Qwen 3.6 Flash', speed: 'Ultra Fast', context: '128,000 (128k)', reasoning: 'Low-Medium', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/deepseek-v4-pro', name: 'DeepSeek V4 Pro', speed: 'Code & Math', context: '128,000 (128k)', reasoning: 'High-Max', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/deepseek-v4-flash-0731', name: 'DeepSeek V4 Flash', speed: 'Fast Inference', context: '128,000 (128k)', reasoning: 'Standard', status: 'rate_limited' },
      { id: 'alibaba-token-plan-intl/glm-5.2', name: 'GLM 5.2', speed: 'Bilingual Pro', context: '128,000 (128k)', reasoning: 'Medium Reasoning', status: 'rate_limited' }
    ]
  };

  const telemetry = {
    updatedAt: timestamp,
    environment: isLocal ? 'Local Mac Daemon (Live ocx)' : 'Cloud Edge Snapshot',
    summary: {
      totalProviders: 3,
      healthyProviders: 2,
      exhaustedProviders: 1,
      totalLinkedAccounts: 5,
      activeLLMCount: 13,
      availableModelCount: 5,
      rateLimitedModelCount: 8
    },
    providers: [
      antigravityQuota,
      openaiQuota,
      alibabaQuota
    ],
    integrations: [
      { name: 'OpenCodex Proxy', endpoint: 'http://127.0.0.1:10100', status: isLocal ? 'online' : 'cloud_mode' },
      { name: 'Hermes Gateway', runtime: 'launchd (PID 33929)', status: 'online' },
      { name: 'ElevenLabs Voice', service: 'Voice Synth (41b6...6484)', status: 'ready' },
      { name: 'Firecrawl Tool', service: 'Web Extract (fc-5...b8ae)', status: 'ready' }
    ]
  };

  return NextResponse.json(telemetry, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
