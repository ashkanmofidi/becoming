'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@becoming/shared';

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: UserRole;
}

/**
 * Sidebar navigation. PRD Section 4.
 * Persistent left-side nav with brand, profile, core/system/admin sections.
 * Uses Next.js Link for instant client-side navigation (no page reloads).
 */
export function Sidebar({ userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const navLink = (href: string, label: string) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`block px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
          isActive
            ? 'text-amber bg-amber/10 border-l-[3px] border-amber -ml-[3px] pl-[15px]'
            : 'text-surface-300 hover:text-white hover:bg-white/5'
        }`}
      >
        {label}
      </Link>
    );
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <aside className="hidden lg:flex flex-col w-[200px] border-r border-surface-900 bg-bg-primary p-4">
      {/* Brand Identity Block (PRD Section 2) */}
      <div className="mb-6">
        <h1 className="font-serif text-xl">
          Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
        </h1>
        <p className="text-surface-500 text-[10px] tracking-[0.2em] uppercase font-mono mt-1">
          V3.1 · ENTERPRISE BETA
        </p>
      </div>

      {/* User Identity & Role Card (PRD Section 3) */}
      <div className="mb-6 pb-4 border-b border-surface-900">
        {/* Avatar fallback with first initial (PRD 3.1) */}
        <div className="w-10 h-10 rounded-full bg-amber flex items-center justify-center text-white font-semibold text-sm mb-2">
          {userName.charAt(0).toUpperCase()}
        </div>
        <p className="text-sm text-white font-medium truncate">{userName}</p>
        <p className="text-xs text-surface-500 truncate">{userEmail}</p>

        {/* Role Badge (PRD Section 3.2) */}
        {isSuperAdmin && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-red-900/30 text-red-400">
            Super Admin
          </span>
        )}
        {userRole === 'admin' && (
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber/20 text-amber">
            Admin
          </span>
        )}

        {/* Logout (PRD Section 3.3 — in profile card, NOT sidebar footer) */}
        <button
          onClick={handleLogout}
          className="block mt-3 text-xs text-surface-500 hover:text-red-400 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Navigation (PRD Section 4.1) */}
      <nav className="flex-1 space-y-1">
        <span className="text-amber text-[10px] tracking-[0.2em] uppercase font-mono block mb-2">
          CORE
        </span>
        {navLink('/timer', 'Timer')}
        {navLink('/dashboard', 'Dashboard')}
        {navLink('/session-log', 'Session Log')}

        <span className="text-surface-500 text-[10px] tracking-[0.2em] uppercase font-mono block mt-4 mb-2">
          SYSTEM
        </span>
        {navLink('/settings', 'Settings')}

        {/* Admin section (PRD Section 4.1 — completely absent for regular users) */}
        {isAdmin && (
          <>
            <span className="text-amber text-[10px] tracking-[0.2em] uppercase font-mono block mt-4 mb-2">
              ADMIN
            </span>
            {navLink('/analytics', 'Analytics')}
            {navLink('/users', 'User Management')}
            {navLink('/feedback', 'Feedback')}
            {isSuperAdmin && navLink('/audit', 'Audit Log')}
          </>
        )}
      </nav>

      {/* Footer Stats (PRD Section 4.4) */}
      <div className="pt-4 border-t border-surface-900 mt-4">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <p className="text-amber font-mono text-sm font-semibold">—</p>
            <p className="text-surface-500 text-[9px] uppercase tracking-wider">Today</p>
          </div>
          <div>
            <p className="text-amber font-mono text-sm font-semibold">—</p>
            <p className="text-surface-500 text-[9px] uppercase tracking-wider">Streak</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
