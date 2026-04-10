'use client';

import { useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * DisplaySync — applies ALL display settings to the document root as CSS variables.
 * Runs at the layout level. Every component inherits changes instantly via CSS.
 *
 * CSS Variables set:
 * --accent-color: focus accent (default #D97706)
 * --break-accent-color: break accent (default #0D9488)
 * --font-scale: 0.8 | 1 | 1.2 | 1.5
 * --bg-primary, --bg-card, --text-primary, --text-secondary: theme colors
 *
 * Also manages:
 * - html class: 'dark' or 'light' for Tailwind dark mode
 * - System theme detection via matchMedia
 */
export function DisplaySync() {
  const { settings } = useSettings();

  // Apply theme
  useEffect(() => {
    if (!settings) return;

    // Theme is applied purely via CSS class — globals.css has complete
    // light theme overrides for every Tailwind class used in the app.
    const applyTheme = (theme: 'dark' | 'light') => {
      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
    };

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  // Apply accent colors
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--break-accent-color', settings.breakAccentColor);
  }, [settings?.accentColor, settings?.breakAccentColor]);

  // Apply font scale
  useEffect(() => {
    if (!settings) return;
    const scale = {
      small: '0.85',
      normal: '1',
      large: '1.2',
      xl: '1.5',
    }[settings.fontSize] ?? '1';
    document.documentElement.style.setProperty('--font-scale', scale);
  }, [settings?.fontSize]);

  // Apply reduced motion
  useEffect(() => {
    if (!settings) return;
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [settings?.reducedMotion]);

  return null; // Headless
}
