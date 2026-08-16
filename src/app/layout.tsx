import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'LLM Quota & Telemetry Matrix',
    template: '%s | LLM Quota Matrix',
  },
  description: 'Real-time quota monitoring and reset tracker for AI providers (Google Antigravity, OpenAI Codex, Alibaba Token Plan)',
  keywords: [
    'LLM Quota',
    'AI Telemetry',
    'Google Antigravity',
    'OpenAI Codex',
    'Alibaba Token Plan',
    'Gemini 3.7 Flash',
    'Claude Sonnet 4.6',
    'Qwen 3.8 Max',
    'Rate Limit Monitor',
  ],
  authors: [{ name: 'LLM Quota Cockpit' }],
  creator: 'LLM Quota Dashboard',
  openGraph: {
    title: 'LLM Quota & Telemetry Matrix',
    description: 'Google Antigravity, OpenAI Codex, Alibaba Token Plan 실시간 쿼터 및 리셋 모니터링 대시보드',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'LLM Quota & Telemetry Matrix',
  },
  twitter: {
    card: 'summary',
    title: 'LLM Quota & Telemetry Matrix',
    description: 'AI 프로바이더별 실시간 쿼터 및 잔여량 관제 대시보드',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-800">
        {children}
      </body>
    </html>
  );
}
