import PusherClient from 'pusher-js';

/**
 * Client-side Pusher connection. Singleton — one connection per browser tab.
 * Subscribes to the user's channel for real-time push events.
 *
 * This replaces the 2-second polling with ~100ms push latency.
 * BroadcastChannel provides ~1ms same-browser tab sync on top.
 */

let pusherInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (pusherInstance) return pusherInstance;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null; // Pusher not configured — fallback to polling

  pusherInstance = new PusherClient(key, {
    cluster,
    // Auto-reconnect with exponential backoff (built into pusher-js)
  });

  return pusherInstance;
}

export function disconnectPusher(): void {
  pusherInstance?.disconnect();
  pusherInstance = null;
}
