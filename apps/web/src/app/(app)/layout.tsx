import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { authService } from '@/services/auth.service';
import { Sidebar } from '@/components/layout/Sidebar';
import { HeaderButtons } from '@/components/header/HeaderButtons';

/**
 * Authenticated app layout. PRD Section 4.
 * Sidebar + header shell for all authenticated pages.
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

  // Fetch session for user info and role (PRD Section 3)
  const session = await authService.validateSession(sessionToken);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={session.name}
        userEmail={session.email}
        userRole={session.role}
      />

      <main className="flex-1 min-h-screen">
        <div className="flex items-center justify-end px-4 py-2 border-b border-surface-900/50">
          <HeaderButtons />
        </div>
        {children}
      </main>
    </div>
  );
}
