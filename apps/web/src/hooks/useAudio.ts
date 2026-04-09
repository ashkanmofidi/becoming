'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  initAudioEngine,
  resumeContext,
  setMasterVolume,
  setMuted as setEngineMuted,
  playActivationChime,
  playCompletionBell,
  playBreakComplete,
  playPauseSound,
  playResumeSound,
  playTick,
  playLast30sTick,
  startAmbientSound,
  stopAmbientSound,
  triggerHaptic,
  destroyAudioEngine,
} from '../lib/sound-themes/audio-engine';
import type { UserSettings } from '@becoming/shared';

/**
 * Audio hook. PRD Section 5.7.
 *
 * All sounds route through the engine's master gain node.
 * Mute sets masterGain = 0 at the engine level — no per-call checks needed.
 * Call sites just call playX() and the engine handles silence.
 */
export function useAudio(settings: UserSettings | null, muted: boolean) {
  const initializedRef = useRef(false);
  const theme = settings?.soundTheme ?? 'warm';

  // Initialize on first user interaction
  const ensureInitialized = useCallback(async () => {
    if (!initializedRef.current && settings) {
      initAudioEngine(settings.masterVolume);
      initializedRef.current = true;
    }
    await resumeContext();
  }, [settings?.masterVolume]);

  // Sync mute state to engine
  useEffect(() => {
    setEngineMuted(muted);
  }, [muted]);

  // Sync volume
  useEffect(() => {
    if (initializedRef.current && settings) {
      setMasterVolume(settings.masterVolume);
    }
  }, [settings?.masterVolume]);

  useEffect(() => {
    return () => destroyAudioEngine();
  }, []);

  return {
    ensureInitialized,

    playActivation: useCallback(() => {
      ensureInitialized();
      playActivationChime(theme);
    }, [theme, ensureInitialized]),

    playCompletion: useCallback((isOvertime = false) => {
      ensureInitialized();
      playCompletionBell(theme, isOvertime ? 0.06 : 0.12);
    }, [theme, ensureInitialized]),

    playBreakEnd: useCallback(() => {
      ensureInitialized();
      playBreakComplete(theme);
    }, [theme, ensureInitialized]),

    playPause: useCallback(() => {
      ensureInitialized();
      playPauseSound(theme);
      if (settings?.hapticEnabled && settings?.hapticPauseResume) triggerHaptic(100);
    }, [theme, settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playResume: useCallback(() => {
      ensureInitialized();
      playResumeSound(theme);
      if (settings?.hapticEnabled && settings?.hapticPauseResume) triggerHaptic(100);
    }, [theme, settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playMinuteTick: useCallback(() => {
      ensureInitialized();
      playTick();
    }, [ensureInitialized]),

    playLast30s: useCallback(() => {
      if (!settings?.last30sTicking) return;
      ensureInitialized();
      playLast30sTick();
    }, [settings?.last30sTicking, ensureInitialized]),

    startAmbient: useCallback(() => {
      if (!settings?.ambientSound || settings.ambientSound === 'none') return;
      ensureInitialized();
      startAmbientSound(settings.ambientSound, settings.ambientVolume);
    }, [settings?.ambientSound, settings?.ambientVolume, ensureInitialized]),

    stopAmbient: useCallback(() => {
      stopAmbientSound();
    }, []),

    playCompletionHaptic: useCallback(() => {
      if (settings?.hapticEnabled && settings?.hapticCompletion) triggerHaptic(200);
    }, [settings?.hapticEnabled, settings?.hapticCompletion]),

    playLast10sHaptic: useCallback(() => {
      if (settings?.hapticEnabled && settings?.hapticLast10s) triggerHaptic(50);
    }, [settings?.hapticEnabled, settings?.hapticLast10s]),
  };
}
