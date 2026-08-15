# LLM Quota & Telemetry Matrix Dashboard

Real-time executive observability dashboard for AI providers (Google Antigravity, OpenAI Codex, Alibaba Token Plan) with dynamic rolling reset tracking, multi-account pool monitoring, and granular model routing matrix.

## 🚀 Features

- **Google Antigravity Dual Quota Tracking:**
  - **Gemini 5-Hour Rolling Window:** Tracks remaining capacity, 5h reset countdown, and model telemetry (`Gemini 3.7 Flash`, `Gemini 3.1 Pro`).
  - **Claude (3rd Party) Independent Pool:** Tracks Anthropic models (`Claude Sonnet 4.6`, `Claude Opus 4.6 Thinking`).
- **OpenAI Codex Multi-Account Pool:** Tracks monthly quota, pooled accounts (3 accounts), and monthly reset D-Day.
- **Alibaba Token Plan Monitor:** Real-time 429 quota exhaustion alert with weekly reset countdown.
- **Master Routing Matrix:** Interactive search and provider filter across all 13 supported models.
- **Responsive Architecture:** Fully optimized for desktop and mobile viewports.
- **Live Sync & Auto-Refresh:** Supports 5s, 15s, 30s polling intervals and manual synchronization.

## 🛠️ Stack

- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS (Modern clean white-tone enterprise aesthetic)
- **Icons:** Lucide React
- **Deployment:** Vercel

## 📦 Getting Started

```bash
npm install
npm run dev
```

Built for **삼균 님** by Winter (Hermes Agent).
