'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  initAudioEngine,
  resumeContext,
  playActivationChime,
  playCompletionBell,
  playBreakComplete,
  playPauseSound,
  playResumeSound,
  startAmbientSound,
  stopAmbientSound,
  triggerHaptic,
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

  // Mute/theme/volume sync handled by AudioSyncProvider at layout level.
  // No per-hook sync needed.

  return {
    ensureInitialized,

    playActivation: useCallback(async () => {
      await ensureInitialized();
      playActivationChime();
    }, [ensureInitialized]),

    playCompletion: useCallback(async (isOvertime = false) => {
      await ensureInitialized();
      playCompletionBell(isOvertime ? 0.3 : 0.7);
    }, [ensureInitialized]),

    playBreakEnd: useCallback(async () => {
      await ensureInitialized();
      playBreakComplete();
    }, [ensureInitialized]),

    playPause: useCallback(async () => {
      await ensureInitialized();
      playPauseSound();
      if (settings?.hapticEnabled && settings?.hapticPauseResume) triggerHaptic(100);
    }, [settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playResume: useCallback(async () => {
      await ensureInitialized();
      playResumeSound();
      if (settings?.hapticEnabled && settings?.hapticPauseResume) triggerHaptic(100);
    }, [settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

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
