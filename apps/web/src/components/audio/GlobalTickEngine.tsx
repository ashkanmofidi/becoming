'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  initAudioEngine,
  resumeContext,
  playTick,
  playLast30sTick,
  setMuted as setEngineMuted,
  setTheme as setEngineTheme,
  setMasterVolume,
} from '@/lib/sound-themes/audio-engine';

/**
 * Global tick engine — lives in the app layout, never unmounts during navigation.
 *
 * This is the SINGLE source of truth for tick sounds. It:
 * 1. Polls /api/timer every 1 second to know if a session is running
 * 2. If running + tick settings enabled, plays the tick
 * 3. Listens to visibilitychange, popstate, and focus events to resume
 * 4. Reads mute state from localStorage
 *
 * WHY this architecture: tying ticks to the timer page component means
 * any navigation (in-app, browser back, tab switch) can kill the interval.
 * This component lives above all pages and survives everything except
 * full page reload (which re-mounts the layout anyway).
 */
export function GlobalTickEngine() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickSecondRef = useRef(-1);
  const lastTickTimeRef = useRef(0);
  const timerStateRef = useRef<{
    status: string;
    mode: string;
    startedAt: string | null;
    configuredDuration: number;
  } | null>(null);
  const settingsRef = useRef<{
    tickDuringFocus: boolean;
    tickDuringBreaks: boolean;
    last30sTicking: boolean;
    soundTheme: string;
    masterVolume: number;
  } | null>(null);
  const initializedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current timer state and settings
  const fetchState = useCallback(async () => {
    try {
      const [timerRes, settingsRes] = await Promise.all([
        fetch('/api/timer'),
        fetch('/api/settings'),
      ]);

      if (timerRes.ok) {
        const data = await timerRes.json();
        timerStateRef.current = data.state;
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings) {
          settingsRef.current = {
            tickDuringFocus: data.settings.tickDuringFocus,
            tickDuringBreaks: data.settings.tickDuringBreaks,
            last30sTicking: data.settings.last30sTicking,
            soundTheme: data.settings.soundTheme,
            masterVolume: data.settings.masterVolume,
          };
          setEngineTheme(data.settings.soundTheme);
          setMasterVolume(data.settings.masterVolume);
        }
      }
    } catch {
      // Silent fail — will retry on next poll
    }
  }, []);

  // Ensure audio engine is alive
  const ensureAudio = useCallback(async () => {
    if (!initializedRef.current) {
      const vol = settingsRef.current?.masterVolume ?? 60;
      initAudioEngine(vol);
      initializedRef.current = true;
    }
    await resumeContext();

    // Sync mute from localStorage
    const muted = typeof localStorage !== 'undefined' && localStorage.getItem('bm_muted') === 'true';
    setEngineMuted(muted);
  }, []);

  // Core tick logic — called every 100ms by the interval
  const tick = useCallback(() => {
    const state = timerStateRef.current;
    const settings = settingsRef.current;
    if (!state || !settings) return;
    if (state.status !== 'running' || !state.startedAt) return;

    // Calculate remaining
    const elapsed = (Date.now() - new Date(state.startedAt).getTime()) / 1000;
    const total = state.configuredDuration * 60;
    const remaining = Math.max(0, total - elapsed);
    const currentSecond = Math.floor(remaining);

    // Gate 1: only on integer second change
    if (currentSecond === lastTickSecondRef.current) return;

    // Gate 2: minimum 950ms between ticks
    const now = Date.now();
    if (now - lastTickTimeRef.current < 950) return;

    lastTickSecondRef.current = currentSecond;
    lastTickTimeRef.current = now;

    // Determine if we should tick
    const isFocus = state.mode === 'focus';
    const isBreak = state.mode === 'break' || state.mode === 'long_break';

    if (remaining <= 30 && remaining > 0 && settings.last30sTicking) {
      playLast30sTick();
    } else if (remaining > 30) {
      if (isFocus && settings.tickDuringFocus) {
        playTick();
      } else if (isBreak && settings.tickDuringBreaks) {
        playTick();
      }
    }
  }, []);

  // Start/stop the tick interval based on timer state
  const startTickInterval = useCallback(() => {
    if (intervalRef.current) return; // Already running
    intervalRef.current = setInterval(tick, 100);
  }, [tick]);

  const stopTickInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    lastTickSecondRef.current = -1;
    lastTickTimeRef.current = 0;
  }, []);

  // Check state and start/stop ticks accordingly
  const syncTicks = useCallback(async () => {
    await fetchState();
    await ensureAudio();

    const state = timerStateRef.current;
    if (state?.status === 'running') {
      startTickInterval();
    } else {
      stopTickInterval();
    }
  }, [fetchState, ensureAudio, startTickInterval, stopTickInterval]);

  // On mount: initial sync + poll every 5 seconds
  useEffect(() => {
    syncTicks();

    pollRef.current = setInterval(syncTicks, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      stopTickInterval();
    };
  }, [syncTicks, stopTickInterval]);

  // Resume on EVERY possible return-to-app event
  useEffect(() => {
    // Tab becomes visible again (covers: tab switch, mobile app foreground)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncTicks();
      } else {
        stopTickInterval(); // Save resources when hidden
      }
    };

    // Browser back/forward (popstate)
    const handlePopState = () => { syncTicks(); };

    // Window regains focus (covers: alt-tab, clicking back to browser)
    const handleFocus = () => { syncTicks(); };

    // Next.js route changes (covers: Link navigation)
    const handleRouteChange = () => { syncTicks(); };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('nextjs:route-change-complete', handleRouteChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('nextjs:route-change-complete', handleRouteChange);
    };
  }, [syncTicks, stopTickInterval]);

  // No UI — this is a headless engine
  return null;
}
