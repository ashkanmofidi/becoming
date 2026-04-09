# Becoming.. Enterprise Focus Timer

> Enterprise-grade Pomodoro focus timer with analytics, streaks, and team management.

## Architecture

Modular monorepo with clean service boundaries, built for Vercel deployment.

```
becoming/
├── packages/shared/    # Types, constants, utilities
├── apps/web/           # Next.js 14+ App Router
│   ├── src/app/        # Pages and API routes
│   ├── src/services/   # Business logic
│   ├── src/repositories/ # Data access (Vercel KV)
│   └── src/hooks/      # React hooks
└── apps/tests/         # Test suites
```

## Tech Stack

- **Runtime**: Next.js 14+ (App Router) on Vercel
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 3+
- **Data**: Vercel KV (Redis-compatible)
- **Auth**: Google OAuth 2.0 with PKCE
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Audio**: Web Audio API
- **Testing**: Vitest, Playwright, k6, axe-core

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

```
GOOGLE_CLIENT_ID=115795527932-2q1afagsog0eg29pbdfn3qfs44e27uui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=115795527932-2q1afagsog0eg29pbdfn3qfs44e27uui.apps.googleusercontent.com
APP_URL=https://becoming.ashmofidi.com
KV_URL=<vercel-kv-url>
KV_REST_API_URL=<vercel-kv-rest-url>
KV_REST_API_TOKEN=<vercel-kv-token>
KV_REST_API_READ_ONLY_TOKEN=<vercel-kv-read-only-token>
APP_VERSION=3.1.0
APP_LIFECYCLE_STAGE=ENTERPRISE BETA
CURRENT_TOS_VERSION=1.0
```

## Version

v3.1.0 · Enterprise Beta · April 2026
