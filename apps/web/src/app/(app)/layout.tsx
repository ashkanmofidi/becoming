import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Authenticated app layout. PRD Section 4.
 * Sidebar + header shell for all authenticated pages.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('bm_sid')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder - will be built in Phase 6 */}
      <aside className="hidden lg:flex flex-col w-[200px] border-r border-surface-900 bg-bg-primary p-4">
        {/* Brand Identity Block (PRD Section 2) */}
        <div className="mb-6">
          <h1 className="font-serif text-xl">
            Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
          </h1>
          <p className="text-surface-500 text-[10px] tracking-[0.2em] uppercase font-mono mt-1">
            V3.0 · ENTERPRISE BETA
          </p>
        </div>

        {/* Navigation placeholder */}
        <nav className="flex-1 space-y-1">
          <span className="text-amber text-[10px] tracking-[0.2em] uppercase font-mono block mb-2">
            CORE
          </span>
          <a href="/timer" className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-surface-300 hover:text-white transition-colors">
            Timer
          </a>
          <a href="/dashboard" className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-surface-300 hover:text-white transition-colors">
            Dashboard
          </a>
          <a href="/session-log" className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-surface-300 hover:text-white transition-colors">
            Session Log
          </a>

          <span className="text-surface-500 text-[10px] tracking-[0.2em] uppercase font-mono block mt-4 mb-2">
            SYSTEM
          </span>
          <a href="/settings" className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-surface-300 hover:text-white transition-colors">
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
