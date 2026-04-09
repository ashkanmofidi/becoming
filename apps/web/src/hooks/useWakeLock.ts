'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Wake Lock hook. PRD Section 6.7.
 * Keeps screen on during focus sessions.
 * Fallback: silent audio loop.
 */
export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);

  const acquire = useCallback(async () => {
    if (!enabled) return;

    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } else {
        // Fallback: silent audio loop (PRD 6.7)
        if (!fallbackAudioRef.current) {
          const audio = new Audio();
          audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
          audio.loop = true;
          audio.volume = 0.001;
          fallbackAudioRef.current = audio;
        }
        await fallbackAudioRef.current.play();
      }
    } catch {
      // Wake lock not available or denied
    }
  }, [enabled]);

  const release = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
    fallbackAudioRef.current?.pause();
  }, []);

  // Re-acquire on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      release();
    };
  }, [acquire, release, enabled]);

  return { acquire, release };
}
