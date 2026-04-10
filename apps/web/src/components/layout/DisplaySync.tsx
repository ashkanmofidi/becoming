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

    const applyTheme = (theme: 'dark' | 'light') => {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.setProperty('--bg-primary', '#F5F5F4');
        root.style.setProperty('--bg-card', '#FFFFFF');
        root.style.setProperty('--bg-surface-900', '#E7E5E4');
        root.style.setProperty('--bg-surface-700', '#D6D3D1');
        root.style.setProperty('--text-primary', '#1C1917');
        root.style.setProperty('--text-secondary', '#57534E');
        root.style.setProperty('--text-muted', '#A8A29E');
        root.style.setProperty('--border-color', '#E7E5E4');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        root.style.setProperty('--bg-primary', '#0A0A0A');
        root.style.setProperty('--bg-card', '#111111');
        root.style.setProperty('--bg-surface-900', '#1A1A1A');
        root.style.setProperty('--bg-surface-700', '#3A3A3A');
        root.style.setProperty('--text-primary', '#EDECE8');
        root.style.setProperty('--text-secondary', '#9CA3AF');
        root.style.setProperty('--text-muted', '#6B7280');
        root.style.setProperty('--border-color', '#1A1A1A');
      }
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
