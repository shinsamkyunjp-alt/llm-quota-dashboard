import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LLM Quota & Telemetry Matrix',
  description: 'Real-time quota monitoring and reset tracker for AI providers (Google Antigravity, OpenAI Codex, Alibaba Token Plan)',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="light">
      <body className="min-h-[100dvh] bg-zinc-50 text-zinc-900 antialiased selection:bg-emerald-500/20 selection:text-emerald-800">
        {children}
      </body>
    </html>
  );
}
