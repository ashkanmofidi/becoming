'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  initAudioEngine,
  resumeContext,
  setMuted as setEngineMuted,
  setMasterVolume as setEngineVolume,
  setTheme as setEngineTheme,
  startAmbientSound,
  stopAmbientSound,
  setAmbientVolume,
} from '@/lib/sound-themes/audio-engine';
import { startTick, stopTick, setTickMuted, setTickVolume, isTickRunning } from '@/lib/tick-engine';

/**
 * useAudioSync — THE SINGLE CONTROLLER for all audio.
 *
 * Runs at the layout level. Reacts to settings changes AND timer state.
 * No other component should call startTick/stopTick/startAmbient/stopAmbient.
 *
 * Polls timer state every 2 seconds to know if a session is running.
 * On every settings change OR timer state change, re-evaluates:
 * "Should tick be playing? Should ambient be playing?" and applies instantly.
 */
export function useAudioSync() {
  const { settings } = useSettings();
  const initializedRef = useRef(false);
  const timerStateRef = useRef<{ status: string; mode: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambientActiveRef = useRef(false);

  // Initialize engine on first settings load
  useEffect(() => {
    if (!settings || initializedRef.current) return;
    initAudioEngine(settings.masterVolume);
    initializedRef.current = true;
  }, [settings]);

  // Use ref for syncAudio to break circular deps. The function reads settings
  // from the ref (always current), so it doesn't need to be in any dep array.
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // The core sync function — evaluates all audio state and applies it
  const syncAudio = useCallback(() => {
    const s = settingsRef.current;
    if (!s || !initializedRef.current) return;

    const ts = timerStateRef.current;
    const isRunning = ts?.status === 'running';
    const isFocus = ts?.mode === 'focus';
    const isBreak = ts?.mode === 'break' || ts?.mode === 'long_break';

    // Mute
    setEngineMuted(s.muted);
    setTickMuted(s.muted);

    // Theme
    setEngineTheme(s.soundTheme);

    // Volume
    setEngineVolume(s.masterVolume);
    setTickVolume(s.masterVolume);

    // Tick: should it play?
    const shouldTick = isRunning && !s.muted && s.soundTheme !== 'silent' && (
      (isFocus && s.tickDuringFocus) ||
      (isBreak && s.tickDuringBreaks)
    );

    if (shouldTick && !isTickRunning()) {
      startTick();
    } else if (!shouldTick && isTickRunning()) {
      stopTick();
    }

    // Ambient: should it play?
    const shouldAmbient = isRunning && isFocus && !s.muted &&
      s.soundTheme !== 'silent' &&
      s.ambientSound !== 'none' &&
      s.ambientVolume > 0;

    if (shouldAmbient && !ambientActiveRef.current) {
      resumeContext();
      startAmbientSound(s.ambientSound, s.ambientVolume);
      ambientActiveRef.current = true;
    } else if (!shouldAmbient && ambientActiveRef.current) {
      stopAmbientSound();
      ambientActiveRef.current = false;
    } else if (shouldAmbient && ambientActiveRef.current) {
      setAmbientVolume(s.ambientVolume);
      startAmbientSound(s.ambientSound, s.ambientVolume);
    }
  }, []); // No deps — reads from refs

  // Poll timer state every 2 seconds
  const fetchTimerState = useCallback(async () => {
    try {
      const res = await fetch('/api/timer');
      if (res.ok) {
        const data = await res.json();
        const newState = data.state ? { status: data.state.status, mode: data.state.mode } : null;
        const changed = JSON.stringify(newState) !== JSON.stringify(timerStateRef.current);
        timerStateRef.current = newState;
        if (changed) syncAudio();
      }
    } catch { /* silent */ }
  }, [syncAudio]);

  // Start polling on mount — stable interval since fetchTimerState is stable
  useEffect(() => {
    fetchTimerState();
    pollRef.current = setInterval(fetchTimerState, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchTimerState]);

  // React to EVERY settings change instantly
  useEffect(() => {
    syncAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings?.muted,
    settings?.soundTheme,
    settings?.masterVolume,
    settings?.tickDuringFocus,
    settings?.tickDuringBreaks,
    settings?.last30sTicking,
    settings?.ambientSound,
    settings?.ambientVolume,
  ]);
}
