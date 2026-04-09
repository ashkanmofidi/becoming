'use client';

import { useRef, useCallback, useEffect } from 'react';
import {
  initAudioEngine,
  resumeContext,
  setMasterVolume,
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
 * Bridges user settings to the Web Audio API engine.
 */
export function useAudio(settings: UserSettings | null) {
  const initializedRef = useRef(false);

  const theme = settings?.soundTheme ?? 'warm';
  const isSilent = theme === 'silent' || (settings?.masterVolume ?? 60) === 0;

  // Initialize on first user interaction
  const ensureInitialized = useCallback(async () => {
    if (!initializedRef.current && settings) {
      initAudioEngine(settings.masterVolume);
      initializedRef.current = true;
    }
    await resumeContext();
  }, [settings?.masterVolume]);

  // Update master volume when settings change
  useEffect(() => {
    if (initializedRef.current && settings) {
      setMasterVolume(settings.masterVolume);
    }
  }, [settings?.masterVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => destroyAudioEngine();
  }, []);

  return {
    ensureInitialized,

    playActivation: useCallback(() => {
      if (isSilent) return;
      ensureInitialized();
      playActivationChime(theme);
    }, [isSilent, theme, ensureInitialized]),

    playCompletion: useCallback((isOvertime = false) => {
      if (isSilent) return;
      ensureInitialized();
      // PRD 5.2.4: Overtime completion at 40% volume
      playCompletionBell(theme, isOvertime ? 0.4 : 0.6);
    }, [isSilent, theme, ensureInitialized]),

    playBreakEnd: useCallback(() => {
      if (isSilent) return;
      ensureInitialized();
      playBreakComplete(theme);
    }, [isSilent, theme, ensureInitialized]),

    playPause: useCallback(() => {
      if (isSilent) return;
      ensureInitialized();
      playPauseSound(theme);
      if (settings?.hapticEnabled && settings?.hapticPauseResume) {
        triggerHaptic(100);
      }
    }, [isSilent, theme, settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playResume: useCallback(() => {
      if (isSilent) return;
      ensureInitialized();
      playResumeSound(theme);
      if (settings?.hapticEnabled && settings?.hapticPauseResume) {
        triggerHaptic(100);
      }
    }, [isSilent, theme, settings?.hapticEnabled, settings?.hapticPauseResume, ensureInitialized]),

    playMinuteTick: useCallback(() => {
      if (isSilent) return;
      ensureInitialized();
      playTick(0.2);
    }, [isSilent, ensureInitialized]),

    playLast30s: useCallback(() => {
      if (isSilent || !settings?.last30sTicking) return;
      ensureInitialized();
      playLast30sTick();
    }, [isSilent, settings?.last30sTicking, ensureInitialized]),

    startAmbient: useCallback(() => {
      if (!settings?.ambientSound || settings.ambientSound === 'none') return;
      ensureInitialized();
      startAmbientSound(settings.ambientSound, settings.ambientVolume);
    }, [settings?.ambientSound, settings?.ambientVolume, ensureInitialized]),

    stopAmbient: useCallback(() => {
      stopAmbientSound();
    }, []),

    playCompletionHaptic: useCallback(() => {
      if (settings?.hapticEnabled && settings?.hapticCompletion) {
        triggerHaptic(200);
      }
    }, [settings?.hapticEnabled, settings?.hapticCompletion]),

    /** PRD 5.7.4: Last 10s haptic pulse (50ms) */
    playLast10sHaptic: useCallback(() => {
      if (settings?.hapticEnabled && settings?.hapticLast10s) {
        triggerHaptic(50);
      }
    }, [settings?.hapticEnabled, settings?.hapticLast10s]),
  };
}
