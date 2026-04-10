# Monitoring Setup Guide

Step-by-step instructions for adding error tracking (Sentry) and uptime monitoring (UptimeRobot) to the Becoming app.

---

## 1. Error Tracking with Sentry (Free Tier)

### 1.1 Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up (free tier covers 5K errors/month).
2. Create a new project, select **Next.js** as the platform.
3. Copy the **DSN** from the project settings (Settings > Projects > [your project] > Client Keys).

### 1.2 Install the SDK

```bash
cd apps/web
npm install @sentry/nextjs
```

### 1.3 Run the Sentry Wizard

```bash
npx @sentry/wizard@latest -i nextjs
```

This will create the following files automatically:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.ts` will be wrapped with `withSentryConfig`

### 1.4 Environment Variables

Add these to your `.env.local` and to Vercel environment variables:

```env
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
SENTRY_AUTH_TOKEN=sntrys_your-auth-token
```

- `SENTRY_DSN` - Required. The DSN from step 1.1.
- `SENTRY_AUTH_TOKEN` - Required for source map uploads. Generate at sentry.io > Settings > Auth Tokens.

### 1.5 Configuration Snippets

**sentry.client.config.ts** (auto-generated, but verify these settings):

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions in production
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**sentry.server.config.ts**:

```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### 1.6 Usage in API Routes

To capture errors manually in API route handlers:

```ts
import * as Sentry from "@sentry/nextjs";

try {
  // ... handler logic
} catch (error) {
  Sentry.captureException(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### 1.7 Verify

After deploying, trigger a test error:

```ts
// Temporary — remove after testing
throw new Error("Sentry test error");
```

Check the Sentry dashboard to confirm the error appears.

---

## 2. Uptime Monitoring with UptimeRobot (Free Tier)

### 2.1 Create an Account

1. Go to [uptimerobot.com](https://uptimerobot.com) and sign up (free tier: 50 monitors, 5-min intervals).

### 2.2 Add Monitors

Create the following HTTP(S) monitors:

| Monitor Name          | URL                                      | Interval | Alert |
|-----------------------|------------------------------------------|----------|-------|
| Becoming - Home       | `https://your-domain.vercel.app/`        | 5 min    | Yes   |
| Becoming - API Health | `https://your-domain.vercel.app/api/health` | 5 min | Yes   |
| Becoming - Auth       | `https://your-domain.vercel.app/api/auth/session` | 5 min | Yes |

### 2.3 Alert Contacts

1. Add your email as an alert contact.
2. (Optional) Add a Slack webhook or Discord webhook for instant notifications.

### 2.4 Status Page (Optional)

UptimeRobot offers a free public status page. Enable it under My Settings > Public Status Pages if you want users to see uptime history.

### 2.5 Health Endpoint

If `/api/health` does not already exist, create one:

```ts
// apps/web/src/app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: Date.now() });
}
```

---

## Notes

- Both services have generous free tiers suitable for a solo/small-team project.
- Sentry's free tier includes 5,000 errors and 10,000 performance transactions per month.
- UptimeRobot's free tier includes 50 monitors at 5-minute check intervals.
- Consider upgrading when traffic exceeds free-tier limits or when you need features like session replay (Sentry) or 1-minute intervals (UptimeRobot).
