'use client';

import { useSettings } from '@/contexts/SettingsContext';

/**
 * Loading gate — only blocks on SETTINGS (fast, single KV read).
 * Sessions and dashboard load in parallel but don't block rendering.
 * Result: app shell renders in ~200ms, data fills in progressively.
 */
export function AppReadyGate({ children }: { children: React.ReactNode }) {
  const { isLoaded: settingsReady } = useSettings();

  if (!settingsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-center">
          <h1 className="font-serif text-2xl mb-2">
            Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
          </h1>
          <div className="flex items-center gap-2 justify-center mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
