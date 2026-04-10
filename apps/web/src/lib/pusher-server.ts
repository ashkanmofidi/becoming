import Pusher from 'pusher';

/**
 * Server-side Pusher instance. Used in API routes to broadcast
 * state changes to all connected clients in real time.
 *
 * USAGE: After any KV write that mutates timer/session/settings state,
 * call broadcast() to push the update to all devices.
 *
 * COST: At 10 users x 8 sessions/day = ~500 messages/day.
 * Pusher free tier: 200,000 messages/day. We're at 0.25% capacity.
 */

let pusherInstance: Pusher | null = null;

function getPusher(): Pusher | null {
  if (pusherInstance) return pusherInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    // Pusher not configured — sync degrades to polling (SyncProvider fallback)
    return null;
  }

  pusherInstance = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return pusherInstance;
}

/** Channel name for a user — all their devices subscribe to this. */
export function userChannel(userId: string): string {
  return `user-${userId}`;
}

/**
 * Broadcast a state change to all connected devices for a user.
 * Fire-and-forget — don't await in the API response path.
 */
export async function broadcast(
  userId: string,
  event: 'timer-update' | 'session-logged' | 'settings-changed' | 'counters-updated',
  data: Record<string, unknown>,
): Promise<void> {
  const pusher = getPusher();
  if (!pusher) return; // Pusher not configured — silent fallback to polling

  try {
    await pusher.trigger(userChannel(userId), event, {
      ...data,
      lastUpdated: Date.now(),
    });
  } catch {
    // Broadcast failed — clients fall back to polling. Not critical.
  }
}
