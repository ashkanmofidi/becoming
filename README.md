# Becoming...

Enterprise-grade focus timer with cross-device sync, session analytics, and cloud persistence.

## Stack

- **Frontend:** Single HTML file (vanilla JS, no build step)
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Vercel KV (Redis)
- **Auth:** Google OAuth 2.0
- **Hosting:** Vercel

## Architecture

```
public/index.html    — Full app (CSS + HTML + JS in one file)
api/auth.js          — Google OAuth, session cookies, user management
api/sessions.js      — CRUD for sessions, settings, and timer state
api/config.js        — Public config (client ID)
api/feedback.js      — User feedback collection
api/account.js       — Account deletion
api/admin.js         — Admin dashboard (user list, waitlist, feedback)
```

## Cross-Device Timer Sync

Each device gets a unique fingerprint stored in localStorage. When the timer starts, pauses, or resets, the state is pushed to Vercel KV. Other devices pull this state every 10 seconds and on tab focus. Conflict resolution: if local timer is running, local wins. Otherwise, the latest `serverTs` from any other device is adopted.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `ADMIN_EMAIL` | Email for admin access |
| `SESSION_SECRET` | Secret for cookie signing |
| `MAX_USERS` | Beta user cap (default: 10) |
| `KV_REST_API_URL` | Auto-set by Vercel KV |
| `KV_REST_API_TOKEN` | Auto-set by Vercel KV |

## Local Development

```bash
npm install
npx vercel dev
```

## Deploy

```bash
npx vercel --yes --prod
```

## License

Private. All rights reserved.
