'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

type ConnectionStatus = 'connected' | 'syncing' | 'offline';

interface SyncState {
  /** Current timer state from server */
  timerState: TimerSyncState | null;
  /** Connection status for UI indicator */
  connectionStatus: ConnectionStatus;
  /** Sync metrics for admin dashboard */
  metrics: SyncMetrics;
  /** Force an immediate sync (e.g., after user action) */
  forcSync: () => void;
}

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
  avgLatencyMs: number;
  lastSyncAt: string | null;
  failedSyncs: number;
  activeConnections: number; // Estimated from BroadcastChannel
  pollsPerMinute: number;
}

const POLL_INTERVAL = 2000; // 2 seconds
const BROADCAST_CHANNEL = 'becoming-sync';

const SyncContext = createContext<SyncState>({
  timerState: null,
  connectionStatus: 'syncing',
  metrics: { pollCount: 0, avgLatencyMs: 0, lastSyncAt: null, failedSyncs: 0, activeConnections: 1, pollsPerMinute: 0 },
  forcSync: () => {},
});

/**
 * SyncProvider — real-time multi-device sync via polling + BroadcastChannel.
 *
 * TRANSPORT ABSTRACTION: This provider is the single interface all components
 * use for synced state. The internal transport (polling) can be swapped for
 * SSE/WebSocket without changing any consumer code.
 *
 * Phase 2 upgrade: replace the setInterval polling in this file with an
 * EventSource connection. Everything else stays the same.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [timerState, setTimerState] = useState<TimerSyncState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('syncing');
  const [metrics, setMetrics] = useState<SyncMetrics>({
    pollCount: 0,
    avgLatencyMs: 0,
    lastSyncAt: null,
    failedSyncs: 0,
    activeConnections: 1,
    pollsPerMinute: 0,
  });

  const pollCountRef = useRef(0);
  const failedCountRef = useRef(0);
  const latencySumRef = useRef(0);
  const minuteStartRef = useRef(Date.now());
  const minutePollCountRef = useRef(0);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const prevStateHashRef = useRef('');

  // BroadcastChannel for same-browser tab sync (instant, no server)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(BROADCAST_CHANNEL);
    broadcastRef.current = channel;

    channel.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === 'timer_state' && msg.state) {
        setTimerState(msg.state);
      }
      if (msg.type === 'ping') {
        // Count active tabs
        channel.postMessage({ type: 'pong' });
      }
    };

    return () => { channel.close(); broadcastRef.current = null; };
  }, []);

  // Broadcast state changes to other tabs
  const broadcastState = useCallback((state: TimerSyncState | null) => {
    broadcastRef.current?.postMessage({ type: 'timer_state', state });
  }, []);

  // Core polling function
  const poll = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/timer');
      const latency = Date.now() - start;

      if (!res.ok) {
        failedCountRef.current++;
        if (res.status === 401) {
          setConnectionStatus('offline');
          return;
        }
        setConnectionStatus('syncing');
        return;
      }

      const data = await res.json();
      const newState = data.state as TimerSyncState | null;

      // Check if state actually changed (avoid unnecessary re-renders)
      const newHash = JSON.stringify(newState);
      if (newHash !== prevStateHashRef.current) {
        prevStateHashRef.current = newHash;
        setTimerState(newState);
        broadcastState(newState); // Sync to other tabs instantly
      }

      // Update metrics
      pollCountRef.current++;
      latencySumRef.current += latency;
      minutePollCountRef.current++;

      // Calculate polls per minute
      const now = Date.now();
      if (now - minuteStartRef.current >= 60000) {
        minuteStartRef.current = now;
        minutePollCountRef.current = 0;
      }

      setMetrics({
        pollCount: pollCountRef.current,
        avgLatencyMs: Math.round(latencySumRef.current / pollCountRef.current),
        lastSyncAt: new Date().toISOString(),
        failedSyncs: failedCountRef.current,
        activeConnections: 1, // Will be updated by BroadcastChannel pings
        pollsPerMinute: minutePollCountRef.current,
      });

      setConnectionStatus('connected');
    } catch {
      failedCountRef.current++;
      setConnectionStatus('offline');
    }
  }, [broadcastState]);

  // Start polling
  useEffect(() => {
    poll(); // Initial fetch
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [poll]);

  // Reconnect on visibility change (tab comes back)
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

  const forcSync = useCallback(() => { poll(); }, [poll]);

  return (
    <SyncContext.Provider value={{ timerState, connectionStatus, metrics, forcSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
