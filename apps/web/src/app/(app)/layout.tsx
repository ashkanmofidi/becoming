import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SidebarWrapper } from '@/components/layout/SidebarWrapper';
import { HeaderButtons } from '@/components/header/HeaderButtons';

/**
 * Authenticated app layout. PRD Section 4.
 * Cookie check server-side. User data fetched client-side in Sidebar.
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
    <div className="flex min-h-screen">
      <SidebarWrapper />

      <main className="flex-1 min-h-screen">
        <div className="flex items-center justify-end px-4 py-2 border-b border-surface-900/50">
          <HeaderButtons />
        </div>
        {children}
      </main>
    </div>
  );
}
