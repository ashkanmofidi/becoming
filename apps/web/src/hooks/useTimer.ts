'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TimerState, TimerMode } from '@becoming/shared';
import { calculateRemainingSeconds, formatTimerDisplay } from '@becoming/shared';
import { LIMITS } from '@becoming/shared';

interface UseTimerOptions {
  showSeconds: boolean;
  defaultDurationMinutes: number; // From user settings — used when no timer state exists
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  state: TimerState | null;
  displayTime: string;
  remainingSeconds: number;
  progress: number;
  isLoading: boolean;
  error: string | null;
  deviceId: string;
  actions: {
    start: (mode: TimerMode, intent: string | null, category: string) => Promise<void>;
    pause: () => Promise<void>;
    resume: () => Promise<void>;
    skip: () => Promise<void>;
    reset: () => Promise<void>;
    complete: () => Promise<void>;
    stopOvertime: () => Promise<void>;
    switchMode: (mode: TimerMode) => Promise<void>;
    takeOver: () => Promise<void>;
    updateIntent: (intent: string) => void;
    updateCategory: (category: string) => void;
  };
}

/**
 * Timer state machine hook. PRD Section 5.
 * Manages timer state, display, and server sync.
 */
export function useTimer(options: UseTimerOptions): UseTimerReturn {
  const [state, setState] = useState<TimerState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(options.defaultDurationMinutes * 60);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const deviceIdRef = useRef(getOrCreateDeviceId());
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completingRef = useRef(false); // Guard against multiple complete calls

  const deviceId = deviceIdRef.current;

  // Fetch initial state
  useEffect(() => {
    fetchState();
    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // Tick interval for countdown display
  useEffect(() => {
    if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);

    if (state?.status === 'running' && state.startedAt) {
      completingRef.current = false; // Reset guard on fresh running state
      tickIntervalRef.current = setInterval(() => {
        const remaining = calculateRemainingSeconds(
          state.startedAt!,
          state.configuredDuration,
        );
        setRemainingSeconds(remaining);
        options.onTick?.(remaining);

        // Complete: guard against multiple calls (interval fires every 100ms)
        if (remaining <= 0 && !completingRef.current) {
          completingRef.current = true;
          apiCall('complete', {});
        }
      }, 100);
    } else if (state?.status === 'overtime' && state.overtimeStartedAt) {
      tickIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(state.overtimeStartedAt!).getTime()) / 1000,
        );
        setRemainingSeconds(-elapsed);
      }, 100);
    } else if (state?.status === 'paused' && state.startedAt) {
      const remaining = calculateRemainingSeconds(
        state.startedAt,
        state.configuredDuration,
        state.pausedAt,
      );
      setRemainingSeconds(remaining);
    } else if (state) {
      setRemainingSeconds(state.configuredDuration * 60);
    }

    return () => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
    };
  }, [state?.status, state?.startedAt, state?.pausedAt, state?.configuredDuration]);

  // Heartbeat interval (PRD 5.2.7: every 15 seconds)
  useEffect(() => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    if (state?.status === 'running' && state.controllingDeviceId === deviceId) {
      heartbeatIntervalRef.current = setInterval(() => {
        fetch('/api/timer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'heartbeat', deviceId }),
        }).catch(() => { /* silently retry on next interval */ });
      }, LIMITS.TIMER_HEARTBEAT_INTERVAL_MS);
    }

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, [state?.status, state?.controllingDeviceId, deviceId]);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/timer');
      if (res.ok) {
        const data = await res.json();
        setState(data.state);
      }
    } catch {
      setError('Failed to load timer state');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const apiCall = useCallback(async (
    action: string,
    extra: Record<string, unknown>,
  ) => {
    try {
      setError(null);
      const res = await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, deviceId, ...extra }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Timer action failed');
        return;
      }

      if (data.state) {
        setState(data.state);
      }

      if (action === 'complete' || action === 'stopOvertime') {
        options.onComplete?.();
      }
    } catch {
      setError('Network error. Please try again.');
    }
  }, [deviceId, options.onComplete]);

  // Calculate progress (0 to 1)
  const totalSeconds = (state?.configuredDuration ?? options.defaultDurationMinutes) * 60;
  const progress = state?.status === 'overtime'
    ? 0
    : Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));

  const displayTime = formatTimerDisplay(remainingSeconds, options.showSeconds);

  const actions = {
    start: async (mode: TimerMode, intent: string | null, category: string) => {
      await apiCall('start', { mode, intent, category });
    },
    pause: async () => await apiCall('pause', {}),
    resume: async () => await apiCall('resume', {}),
    skip: async () => await apiCall('skip', {}),
    reset: async () => await apiCall('reset', {}),
    complete: async () => await apiCall('complete', {}),
    stopOvertime: async () => await apiCall('stopOvertime', {}),
    switchMode: async (mode: TimerMode) => await apiCall('switchMode', { newMode: mode }),
    takeOver: async () => await apiCall('takeOver', {}),
    updateIntent: (intent: string) => {
      setState((prev) => prev ? { ...prev, intent } : prev);
    },
    updateCategory: (category: string) => {
      setState((prev) => prev ? { ...prev, category } : prev);
    },
  };

  return {
    state,
    displayTime,
    remainingSeconds,
    progress,
    isLoading,
    error,
    deviceId,
    actions,
  };
}

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const stored = sessionStorage.getItem('bm_device_id');
  if (stored) return stored;
  const id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem('bm_device_id', id);
  return id;
}
