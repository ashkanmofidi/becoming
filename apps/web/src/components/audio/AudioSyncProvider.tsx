'use client';

import { useAudioSync } from '@/hooks/useAudioSync';

/**
 * Client component that runs useAudioSync at the layout level.
 * Keeps all audio engines in sync with SettingsContext at all times.
 * Must be inside <SettingsProvider>.
 */
export function AudioSyncProvider() {
  useAudioSync();
  return null; // Headless — no UI
}
