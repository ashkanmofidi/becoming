'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { UserSettings } from '@becoming/shared';
import { LIMITS } from '@becoming/shared';

interface SettingsContextValue {
  settings: UserSettings | null;
  isLoaded: boolean;
  saveError: string | null;
  /** Update one or more settings. Applies instantly in UI, saves to server in background. */
  updateSettings: (partial: Partial<UserSettings>) => void;
  /** Re-fetch settings from server (for cross-device sync). */
  refreshFromServer: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  isLoaded: false,
  saveError: null,
  updateSettings: () => {},
  refreshFromServer: () => {},
});

/**
 * Global settings provider. Lives at the app layout level.
 *
 * WHY: Settings page and Timer page were each fetching their own copy
 * of settings independently. Changing mute on Settings page didn't
 * affect the Timer page until it re-fetched. This context is the
 * SINGLE source of truth — every component subscribes to the same
 * object. Changes propagate in the current render cycle.
 *
 * Save is async/background — UI updates first, server catches up.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch settings once on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/settings', { signal: controller.signal })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
    return () => controller.abort();
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Background save with debounce
  const saveToServer = useCallback((updated: UserSettings) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveError(null);
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).then((res) => {
        if (!res.ok) setSaveError('Failed to save settings');
      }).catch(() => {
        setSaveError('Network error saving settings');
      });
    }, LIMITS.SETTINGS_DEBOUNCE_MS);
  }, []);

  // Re-fetch settings from server — used when another device changes settings
  const refreshFromServer = useCallback(() => {
    fetch('/api/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };

      // Feature interactions — applied instantly in UI
      if (partial.reducedMotion === true) {
        updated.completionAnimationIntensity = 'subtle';
        if (updated.clockFont === 'flip') updated.clockFont = 'minimal';
      }

      // Save to server in background (debounced)
      saveToServer(updated);

      return updated;
    });
  }, [saveToServer]);

  return (
    <SettingsContext.Provider value={{ settings, isLoaded, saveError, updateSettings, refreshFromServer }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Hook to access settings from any component. */
export function useSettings() {
  return useContext(SettingsContext);
}
