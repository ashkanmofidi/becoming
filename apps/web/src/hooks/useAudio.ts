'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  initAudioEngine,
  resumeContext,
  setMasterVolume,
  setMuted as setEngineMuted,
  setTheme as setEngineTheme,
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
 * Mute/theme/volume synced to engine state — no per-call checks needed.
 * Every play function just calls the engine; the engine gates everything.
 */
export function useAudio(settings: UserSettings | null, muted: boolean) {
  const initializedRef = useRef(false);

  const ensureInitialized = useCallback(async () => {
    if (!initializedRef.current && settings) {
      initAudioEngine(settings.masterVolume);
      initializedRef.current = true;
    }
    await resumeContext();
  }, [settings?.masterVolume]);

  // Sync mute to engine
  useEffect(() => { setEngineMuted(muted); }, [muted]);

  // Sync theme to engine
  useEffect(() => {
    if (settings?.soundTheme) setEngineTheme(settings.soundTheme);
  }, [settings?.soundTheme]);

  // Sync volume to engine
  useEffect(() => {
    if (initializedRef.current && settings) setMasterVolume(settings.masterVolume);
  }, [settings?.masterVolume]);

  useEffect(() => () => destroyAudioEngine(), []);

  return {
    ensureInitialized,

    playActivation: useCallback(() => {
      ensureInitialized();
      playActivationChime();
    }, [ensureInitialized]),

    playCompletion: useCallback((isOvertime = false) => {
      ensureInitialized();
      playCompletionBell(isOvertime ? 0.06 : 0.12);
    }, [ensureInitialized]),

    playBreakEnd: useCallback(() => {
      ensureInitialized();
      playBreakComplete();
    }, [ensureInitialized]),

    playPause: useCallback(() => {
      ensureInitialized();
      playPauseSound();
      if (settings?.hapticEnabled && settings?.hapticPauseResume) triggerHaptic(100);
    }, [settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playResume: useCallback(() => {
      ensureInitialized();
      playResumeSound();
      if (settings?.hapticEnabled && settings?.hapticPauseResume) triggerHaptic(100);
    }, [settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playMinuteTick: useCallback(() => {
      // Don't await ensureInitialized — tick must be synchronous for timing.
      // Engine gates with shouldPlay() if not initialized.
      playTick();
    }, []),

    playLast30s: useCallback(() => {
      if (!settings?.last30sTicking) return;
      playLast30sTick();
    }, [settings?.last30sTicking]),

    startAmbient: useCallback(() => {
      if (!settings?.ambientSound || settings.ambientSound === 'none') return;
      ensureInitialized();
      startAmbientSound(settings.ambientSound, settings.ambientVolume);
    }, [settings?.ambientSound, settings?.ambientVolume, ensureInitialized]),

    stopAmbient: useCallback(() => { stopAmbientSound(); }, []),

    playCompletionHaptic: useCallback(() => {
      if (settings?.hapticEnabled && settings?.hapticCompletion) triggerHaptic(200);
    }, [settings?.hapticEnabled, settings?.hapticCompletion]),

    playLast10sHaptic: useCallback(() => {
      if (settings?.hapticEnabled && settings?.hapticLast10s) triggerHaptic(50);
    }, [settings?.hapticEnabled, settings?.hapticLast10s]),
  };
}
