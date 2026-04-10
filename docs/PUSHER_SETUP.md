# Pusher Real-Time Sync Setup

The app has full Pusher infrastructure built in. When credentials are configured, timer state, settings changes, and session completions sync across devices in ~100ms instead of the 2s polling fallback.

## Setup Steps

1. **Create a Pusher account** at [pusher.com](https://pusher.com) (free tier: 200K messages/day, 100 concurrent connections)

2. **Create a Channels app** in the Pusher dashboard:
   - App name: `becoming`
   - Cluster: Choose nearest to your users (e.g., `us2`, `eu`, `ap1`)
   - Frontend: `React`
   - Backend: `Node.js`

3. **Copy credentials** from the Pusher dashboard → App Keys

4. **Set environment variables** in Vercel:
   ```
   PUSHER_APP_ID=your_app_id
   PUSHER_KEY=your_key
   PUSHER_SECRET=your_secret
   PUSHER_CLUSTER=your_cluster
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
   ```
   Note: `NEXT_PUBLIC_` vars are exposed to the browser (key only, not secret).

5. **Redeploy** the app. The SyncProvider will automatically detect Pusher is configured and:
   - Subscribe to `user-{userId}` channel on page load
   - Receive `timer-update`, `session-logged`, `settings-changed` events
   - Reduce polling from 2s to 10s (safety net only)

## What Syncs

| Event | Trigger | What Updates |
|-------|---------|-------------|
| `timer-update` | Any timer action (start, pause, resume, complete, etc.) | Timer display on all devices |
| `session-logged` | Session completed/finished early | Session counters, dashboard |
| `settings-changed` | Any setting changed | Settings on all devices |

## Fallback Behavior

Without Pusher credentials:
- Timer state polls every 2 seconds
- BroadcastChannel syncs same-browser tabs (~1ms)
- Settings don't sync across devices (refresh required)
- Everything still works, just with higher latency

## Monitoring

The System Health page (`/system`) shows:
- Current transport (Pusher vs Polling)
- Sync latency
- Polls per minute
- Failed sync count
