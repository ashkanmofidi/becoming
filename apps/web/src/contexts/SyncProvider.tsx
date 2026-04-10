'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher-client';

type ConnectionStatus = 'connected' | 'syncing' | 'offline';

interface TimerSyncState {
  status: string;
  mode: string;
  startedAt: string | null;
  pausedAt: string | null;
  configuredDuration: number;
  controllingDeviceId: string | null;
  lastHeartbeatAt: string | null;
  intent: string | null;
  category: string;
  cycleNumber: number;
  overtimeStartedAt: string | null;
}

interface SyncMetrics {
  pollCount: number;
  pushCount: number;
  avgLatencyMs: number;
  lastSyncAt: string | null;
  failedSyncs: number;
  pollsPerMinute: number;
  transport: 'pusher' | 'polling';
}

interface SyncContextValue {
  timerState: TimerSyncState | null;
  connectionStatus: ConnectionStatus;
  metrics: SyncMetrics;
  forcSync: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  timerState: null,
  connectionStatus: 'syncing',
  metrics: { pollCount: 0, pushCount: 0, avgLatencyMs: 0, lastSyncAt: null, failedSyncs: 0, pollsPerMinute: 0, transport: 'polling' },
  forcSync: () => {},
});

const BROADCAST_CHANNEL = 'becoming-sync';
const POLL_INTERVAL = 2000; // Fallback polling interval

/**
 * SyncProvider — real-time multi-device sync.
 *
 * TRANSPORT PRIORITY:
 * 1. Pusher (if configured) — ~100ms latency, server push
 * 2. BroadcastChannel — ~1ms, same-browser tabs only
 * 3. Polling (fallback) — 2s interval if Pusher not configured
 *
 * All three can run simultaneously. First update wins (dedup by lastUpdated).
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerSyncState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('syncing');
  const [metrics, setMetrics] = useState<SyncMetrics>({
    pollCount: 0, pushCount: 0, avgLatencyMs: 0, lastSyncAt: null,
    failedSyncs: 0, pollsPerMinute: 0, transport: 'polling',
  });

  const lastUpdatedRef = useRef(0);
  const pollCountRef = useRef(0);
  const pushCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const latencySumRef = useRef(0);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const pusherReady = useRef(false);

  // Deduplication: only update if this event is newer than what we have
  const updateState = useCallback((newState: TimerSyncState | null, source: 'pusher' | 'broadcast' | 'poll', timestamp?: number) => {
    const ts = timestamp ?? Date.now();
    if (ts <= lastUpdatedRef.current) return; // Stale — already have newer data
    lastUpdatedRef.current = ts;

    setTimerState(newState);
    setConnectionStatus('connected');
    setMetrics((prev) => ({
      ...prev,
      lastSyncAt: new Date().toISOString(),
      [source === 'pusher' ? 'pushCount' : 'pollCount']: source === 'pusher' ? pushCountRef.current++ : pollCountRef.current++,
      transport: pusherReady.current ? 'pusher' : 'polling',
    }));

    // Broadcast to other tabs via BroadcastChannel
    if (source !== 'broadcast') {
      broadcastRef.current?.postMessage({ type: 'timer-update', state: newState, lastUpdated: ts });
    }
  }, []);

  // ─── 1. PUSHER (primary transport) ───────────────────────

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return; // Not configured — will use polling

    // We need the userId to subscribe to the right channel.
    // Fetch it from the session API.
    fetch('/api/auth/session')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data?.user?.id) return;

        const channel = pusher.subscribe(`user-${data.user.id}`);
        pusherReady.current = true;

        channel.bind('timer-update', (payload: Record<string, unknown>) => {
          updateState(payload as unknown as TimerSyncState, 'pusher', payload.lastUpdated as number);
        });

        channel.bind('session-logged', () => {
          // Trigger a data refresh for session counters
          // DataProvider handles this via its own refresh
        });

        channel.bind('settings-changed', () => {
          // SettingsProvider handles settings sync
        });

        setConnectionStatus('connected');
      })
      .catch(() => {
        // Pusher setup failed — polling fallback active
      });

    // Pusher connection state monitoring
    const onConnected = () => setConnectionStatus('connected');
    const onConnecting = () => setConnectionStatus('syncing');
    const onDisconnected = () => { setConnectionStatus('offline'); pusherReady.current = false; };
    const onUnavailable = () => { setConnectionStatus('offline'); pusherReady.current = false; };

    pusher.connection.bind('connected', onConnected);
    pusher.connection.bind('connecting', onConnecting);
    pusher.connection.bind('disconnected', onDisconnected);
    pusher.connection.bind('unavailable', onUnavailable);

    return () => {
      pusher.connection.unbind('connected', onConnected);
      pusher.connection.unbind('connecting', onConnecting);
      pusher.connection.unbind('disconnected', onDisconnected);
      pusher.connection.unbind('unavailable', onUnavailable);
    };
  }, [updateState]);

  // ─── 2. BROADCASTCHANNEL (same-browser tabs) ─────────────

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      if (event.data?.type === 'timer-update') {
        updateState(event.data.state, 'broadcast', event.data.lastUpdated);
      }
    };

    return () => { channel.close(); broadcastRef.current = null; };
  }, [updateState]);

  // ─── 3. POLLING (fallback if Pusher not configured) ──────

  const poll = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/timer');
      if (!res.ok) {
        failedCountRef.current++;
        if (res.status === 401) setConnectionStatus('offline');
        return;
      }
      const data = await res.json();
      const latency = Date.now() - start;
      latencySumRef.current += latency;
      pollCountRef.current++;

      updateState(data.state, 'poll');

      setMetrics((prev) => ({
        ...prev,
        avgLatencyMs: Math.round(latencySumRef.current / pollCountRef.current),
        failedSyncs: failedCountRef.current,
        pollCount: pollCountRef.current,
      }));
    } catch {
      failedCountRef.current++;
      setConnectionStatus('offline');
    }
  }, [updateState]);

  useEffect(() => {
    // Always do an initial poll to get state immediately
    poll();

    // Adaptive polling: check pusherReady dynamically, not just at creation time.
    // If Pusher is active, poll less frequently (10s safety net).
    // If Pusher disconnects or isn't configured, poll at full speed (2s).
    let intervalId: ReturnType<typeof setInterval>;
    const startInterval = () => {
      intervalId = setInterval(poll, pusherReady.current ? 10000 : POLL_INTERVAL);
    };
    startInterval();

    // Re-evaluate interval every 30s in case Pusher state changed
    const checkInterval = setInterval(() => {
      clearInterval(intervalId);
      startInterval();
    }, 30000);

    return () => {
      clearInterval(intervalId);
      clearInterval(checkInterval);
    };
  }, [poll]);

  // Reconnect on tab visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setConnectionStatus('syncing');
        poll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [poll]);

  return (
    <SyncContext.Provider value={{ timerState, connectionStatus, metrics, forcSync: poll }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
