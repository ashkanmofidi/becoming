'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useSync } from '@/contexts/SyncProvider';

/**
 * FocusModeSync — handles Wake Lock, Fullscreen, and Idle Reminder.
 * Runs at layout level. Reacts to settings + timer state changes.
 */
export function FocusModeSync() {
  const { settings } = useSettings();
  const { timerState } = useSync();

  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleReminderCountRef = useRef(0);
  const isFullscreenRef = useRef(false);

  const isRunning = timerState?.status === 'running';
  const isIdle = !timerState || timerState.status === 'idle';

  // ─── 1. SCREEN WAKE LOCK ───────────────────────────────────

  const acquireWakeLock = useCallback(async () => {
    if (wakeLockRef.current) return; // Already held
    if (!('wakeLock' in navigator)) return; // Not supported

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
    } catch {
      // Permission denied or not supported — silent
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try { await wakeLockRef.current.release(); } catch { /* already released */ }
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!settings) return;

    if (isRunning && settings.screenWakeLock) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => { releaseWakeLock(); };
  }, [isRunning, settings?.screenWakeLock, acquireWakeLock, releaseWakeLock]);

  // Re-acquire on tab refocus
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && isRunning && settings?.screenWakeLock) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isRunning, settings?.screenWakeLock, acquireWakeLock]);

  // ─── 2. FULLSCREEN FOCUS ──────────────────────────────────

  const enterFullscreen = useCallback(async () => {
    if (isFullscreenRef.current) return;
    if (!document.fullscreenEnabled) return;
    try {
      await document.documentElement.requestFullscreen();
      isFullscreenRef.current = true;
    } catch {
      // Blocked by browser (requires user gesture) — silent
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (!isFullscreenRef.current) return;
    if (!document.fullscreenElement) {
      isFullscreenRef.current = false;
      return;
    }
    try {
      await document.exitFullscreen();
    } catch { /* already exited */ }
    isFullscreenRef.current = false;
  }, []);

  useEffect(() => {
    if (!settings) return;

    if (isRunning && settings.fullscreenFocus) {
      enterFullscreen();
    } else if (!isRunning) {
      exitFullscreen();
    }
  }, [isRunning, settings?.fullscreenFocus, enterFullscreen, exitFullscreen]);

  // If user exits fullscreen manually (Escape), track it
  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) {
        isFullscreenRef.current = false;
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // If setting toggled OFF mid-session, exit immediately
  useEffect(() => {
    if (settings && !settings.fullscreenFocus && isFullscreenRef.current) {
      exitFullscreen();
    }
  }, [settings?.fullscreenFocus, exitFullscreen]);

  // ─── 3. IDLE REMINDER ─────────────────────────────────────

  const showIdleReminder = useCallback(() => {
    if (idleReminderCountRef.current >= 3) return; // Max 3 reminders
    idleReminderCountRef.current++;

    const message = `You've been idle for ${settings?.idleReminderDelay ?? 15} minutes. Ready to focus?`;

    // In-app toast (always works)
    if (typeof document !== 'undefined') {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-amber/90 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm max-w-sm';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 8000);
    }

    // Browser notification (if permission granted)
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Becoming..', {
        body: message,
        icon: '/icons/icon-192.png',
      });
    }
  }, [settings?.idleReminderDelay]);

  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!settings?.idleReminder) return;

    const delayMs = (settings.idleReminderDelay ?? 15) * 60 * 1000;
    idleReminderCountRef.current = 0; // Reset counter

    const scheduleNext = () => {
      idleTimerRef.current = setTimeout(() => {
        showIdleReminder();
        if (idleReminderCountRef.current < 3) {
          scheduleNext(); // Schedule next reminder
        }
      }, delayMs);
    };

    scheduleNext();
  }, [settings?.idleReminder, settings?.idleReminderDelay, showIdleReminder]);

  const stopIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    idleReminderCountRef.current = 0;
  }, []);

  useEffect(() => {
    if (!settings?.idleReminder) {
      stopIdleTimer();
      return;
    }

    if (isIdle) {
      startIdleTimer();
    } else {
      stopIdleTimer(); // Timer is active — no idle reminders
    }

    return () => stopIdleTimer();
  }, [isIdle, settings?.idleReminder, startIdleTimer, stopIdleTimer]);

  // Request notification permission when idle reminder is first enabled
  useEffect(() => {
    if (settings?.idleReminder && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [settings?.idleReminder]);

  return null; // Headless
}

// Type for Wake Lock (not in all TS libs)
interface WakeLockSentinel {
  release(): Promise<void>;
}
