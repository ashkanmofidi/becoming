'use client';

import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { setVerbosity } from '@/lib/announcer';

/**
 * AccessibilitySync — applies all accessibility settings to the document root.
 * Runs at layout level. Every component inherits changes via CSS.
 *
 * Handles:
 * 1. Screen Reader Verbosity — sets announcer service level
 * 2. High Contrast — adds [data-high-contrast] with AAA CSS overrides
 * 3. Large Tap Targets — adds [data-large-targets] with 56px minimums
 * 4. Color Blind Mode — adds [data-color-blind] with palette overrides
 */
export function AccessibilitySync() {
  const { settings } = useSettings();

  // 1. Screen Reader Verbosity
  useEffect(() => {
    if (!settings) return;
    setVerbosity(settings.screenReaderVerbosity);
  }, [settings?.screenReaderVerbosity]);

  // 2. High Contrast
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }
  }, [settings?.highContrast]);

  // 3. Large Tap Targets
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.largeTapTargets) {
      root.setAttribute('data-large-targets', 'true');
    } else {
      root.removeAttribute('data-large-targets');
    }
  }, [settings?.largeTapTargets]);

  // 4. Color Blind Mode
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.colorBlindMode === 'off') {
      root.removeAttribute('data-color-blind');
    } else {
      root.setAttribute('data-color-blind', settings.colorBlindMode);
    }
  }, [settings?.colorBlindMode]);

  return null;
}
