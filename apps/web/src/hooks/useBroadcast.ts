'use client';

import { useEffect, useRef, useCallback } from 'react';

type BroadcastMessage =
  | { type: 'timer_updated'; state: unknown }
  | { type: 'control_claimed'; deviceId: string }
  | { type: 'control_released' }
  | { type: 'session_completed' }
  | { type: 'settings_changed' };

/**
 * BroadcastChannel hook for multi-tab sync. PRD Section 5.2.7.
 * Negotiates single controller. Second tab sees "controlled in another tab."
 */
export function useBroadcast(
  channelName: string,
  onMessage: (msg: BroadcastMessage) => void,
) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage; // Always use latest callback without recreating channel

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      onMessageRef.current(event.data as BroadcastMessage);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]); // Only recreate channel if name changes, not on every callback change

  const postMessage = useCallback((msg: BroadcastMessage) => {
    channelRef.current?.postMessage(msg);
  }, []);

  return { postMessage };
}
