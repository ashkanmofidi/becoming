import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SidebarWrapper } from '@/components/layout/SidebarWrapper';
import { HeaderButtons } from '@/components/header/HeaderButtons';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { DataProvider } from '@/contexts/DataProvider';
import { AudioSyncProvider } from '@/components/audio/AudioSyncProvider';
import { AppReadyGate } from '@/components/layout/AppReadyGate';

/**
 * Authenticated app layout.
 *
 * Data loading strategy:
 * - SettingsProvider: fetches settings ONCE on init
 * - DataProvider: prefetches sessions + dashboard ONCE on init
 * - AppReadyGate: shows single loading screen until both are ready
 * - After init: ALL navigation is instant (data in memory)
 * - Background refreshes keep data current (stale-while-revalidate)
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
        <AudioSyncProvider />
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
      </DataProvider>
    </SettingsProvider>
  );
}
