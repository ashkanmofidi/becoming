import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SidebarWrapper } from '@/components/layout/SidebarWrapper';
import { HeaderButtons } from '@/components/header/HeaderButtons';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { DataProvider } from '@/contexts/DataProvider';
import { SyncProvider } from '@/contexts/SyncProvider';
import { AudioSyncProvider } from '@/components/audio/AudioSyncProvider';
import { DisplaySync } from '@/components/layout/DisplaySync';
import { AppReadyGate } from '@/components/layout/AppReadyGate';

/**
 * Authenticated app layout.
 *
 * Provider stack (outer → inner):
 * - SettingsProvider: user settings (single source of truth)
 * - DataProvider: prefetched sessions + dashboard
 * - SyncProvider: real-time multi-device sync (2s polling + BroadcastChannel)
 * - AudioSyncProvider: reactive audio engine sync
 * - AppReadyGate: single loading screen until all data ready
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('bm_sid')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  return (
    <SettingsProvider>
      <DataProvider>
        <SyncProvider>
          <AudioSyncProvider />
          <DisplaySync />
          <AppReadyGate>
            <div className="flex min-h-screen">
              <SidebarWrapper />
              <main className="flex-1 min-h-screen">
                <div className="flex items-center justify-end px-4 py-2 border-b border-surface-900/50">
                  <HeaderButtons />
                </div>
                {children}
              </main>
            </div>
          </AppReadyGate>
        </SyncProvider>
      </DataProvider>
    </SettingsProvider>
  );
}
