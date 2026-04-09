'use client';

import { useEffect, useRef } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import {
  initAudioEngine,
  resumeContext,
  setMuted as setEngineMuted,
  setMasterVolume as setEngineVolume,
  setTheme as setEngineTheme,
  startAmbientSound,
  stopAmbientSound,
} from '@/lib/sound-themes/audio-engine';
import { startTick, stopTick, setTickMuted, setTickVolume } from '@/lib/tick-engine';

/**
 * useAudioSync — runs at the LAYOUT level, not per-page.
 *
 * Subscribes to SettingsContext and keeps ALL audio engines in sync
 * in real time. When ANY setting changes (from Settings page, timer page,
 * or anywhere), this hook applies it to the engines instantly.
 *
 * This is the SINGLE place where settings → audio engine wiring happens.
 * Individual pages do NOT need to sync audio — this hook handles everything.
 */
export function useAudioSync() {
  const { settings } = useSettings();
  const initializedRef = useRef(false);
  const prevAmbientRef = useRef<string>('none');
  const prevAmbientVolRef = useRef<number>(0);

  // Initialize engine on first settings load
  useEffect(() => {
    if (!settings || initializedRef.current) return;
    initAudioEngine(settings.masterVolume);
    initializedRef.current = true;
  }, [settings]);

  // 1. MUTE — instant, bidirectional
  useEffect(() => {
    if (!settings) return;
    setEngineMuted(settings.muted);
    setTickMuted(settings.muted);
  }, [settings?.muted]);

  // 2. SOUND THEME — swap immediately
  useEffect(() => {
    if (!settings) return;
    setEngineTheme(settings.soundTheme);
  }, [settings?.soundTheme]);

  // 3. MASTER VOLUME — real-time as slider drags
  useEffect(() => {
    if (!settings || !initializedRef.current) return;
    setEngineVolume(settings.masterVolume);
    setTickVolume(settings.masterVolume); // Tick engine has its own gain node
  }, [settings?.masterVolume]);

  // 4 & 5. TICK DURING FOCUS / BREAKS — start/stop tick immediately
  // This needs to know if a session is running. We poll /api/timer.
  // But we can also just let the tick engine be controlled by settings:
  // if tick settings change, we check current timer state and react.
  useEffect(() => {
    if (!settings) return;

    // Fetch current timer state to decide if tick should play
    fetch('/api/timer')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!data?.state) return;
        const { status, mode } = data.state;
        if (status !== 'running') {
          stopTick();
          return;
        }

        const isFocus = mode === 'focus';
        const isBreak = mode === 'break' || mode === 'long_break';
        const shouldTick =
          (isFocus && settings.tickDuringFocus) ||
          (isBreak && settings.tickDuringBreaks);

        if (shouldTick && !settings.muted) {
          startTick();
        } else {
          stopTick();
        }
      })
      .catch(() => {});
  }, [settings?.tickDuringFocus, settings?.tickDuringBreaks, settings?.muted]);

  // 9 & 10. AMBIENT SOUND — start/stop/switch/volume in real time
  useEffect(() => {
    if (!settings || !initializedRef.current) return;

    const newAmbient = settings.ambientSound;
    const newVolume = settings.ambientVolume;
    const changed = newAmbient !== prevAmbientRef.current || newVolume !== prevAmbientVolRef.current;

    if (!changed) return;

    prevAmbientRef.current = newAmbient;
    prevAmbientVolRef.current = newVolume;

    if (newAmbient === 'none' || newVolume === 0) {
      stopAmbientSound();
      return;
    }

    // Only start ambient if a focus session is running
    fetch('/api/timer')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.state?.status === 'running' && data.state.mode === 'focus') {
          // Ensure audio context is alive
          resumeContext();
          startAmbientSound(newAmbient, newVolume);
        }
      })
      .catch(() => {});
  }, [settings?.ambientSound, settings?.ambientVolume]);
}
