'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { UserSettings } from '@becoming/shared';
import { LIMITS } from '@becoming/shared';

interface SettingsContextValue {
  settings: UserSettings | null;
  isLoaded: boolean;
  /** Update one or more settings. Applies instantly in UI, saves to server in background. */
  updateSettings: (partial: Partial<UserSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  isLoaded: false,
  updateSettings: () => {},
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
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch settings once on mount
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  // Background save with debounce
  const saveToServer = useCallback((updated: UserSettings) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated }),
      }).catch(() => {});
    }, LIMITS.SETTINGS_DEBOUNCE_MS);
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
    <SettingsContext.Provider value={{ settings, isLoaded, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

/** Hook to access settings from any component. */
export function useSettings() {
  return useContext(SettingsContext);
}
