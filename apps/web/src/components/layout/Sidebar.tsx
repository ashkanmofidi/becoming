'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ConnectionIndicator } from './ConnectionIndicator';
import { useData } from '@/contexts/DataProvider';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@becoming/shared';

interface SidebarProps {
  userName: string;
  userEmail: string;
  userPicture: string;
  userRole: UserRole;
  confirmLogoutWithActiveTimer: boolean;
}

/**
 * Sidebar navigation. PRD Section 4.
 * Persistent left-side nav with brand, profile, core/system/admin sections.
 * Uses Next.js Link for instant client-side navigation (no page reloads).
 */
export function Sidebar({ userName, userEmail, userPicture, userRole, confirmLogoutWithActiveTimer }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

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

  /** Check if timer is active. Show confirmation unless user opted out. */
  const handleLogoutClick = async () => {
    try {
      const res = await fetch('/api/timer');
      if (res.ok) {
        const data = await res.json();
        const status = data.state?.status;
        if (status === 'running' || status === 'paused' || status === 'overtime') {
          if (confirmLogoutWithActiveTimer) {
            // User wants to be asked — show modal
            setShowLogoutConfirm(true);
            return;
          } else {
            // User opted out — skip modal, abandon and logout immediately
            await performLogout();
            return;
          }
        }
      }
    } catch {
      // If we can't check timer state, proceed with logout
    }
    performLogout();
  };

  /** Abandon any active timer, then clear session and redirect. */
  const performLogout = async () => {
    // Abandon the timer (writes partial session data to logs)
    try {
      await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'abandon' }),
      });
    } catch {
      // Best effort — proceed with logout regardless
    }

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
          V{process.env.NEXT_PUBLIC_APP_VERSION ?? '3.1'} · {process.env.NEXT_PUBLIC_APP_STAGE ?? 'ENTERPRISE BETA'}
        </p>
      </div>

      {/* User Identity & Role Card (PRD Section 3) */}
      <div className="mb-6 pb-4 border-b border-surface-900">
        {/* Avatar: Google profile picture with letter fallback (PRD 3.1) */}
        <UserAvatar name={userName} picture={userPicture} size={40} />
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

        {/* Logout (PRD Section 3.3) — visually distinct, never an afterthought */}
        <button
          onClick={handleLogoutClick}
          className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-950/40 border border-red-900/30 hover:bg-red-900/30 hover:text-red-300 hover:border-red-800/40 transition-all duration-150"
        >
          {/* Exit/door icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log out
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
            {isSuperAdmin && navLink('/system', 'System Health')}
          </>
        )}
      </nav>

      {/* Footer: connection indicator + live stats */}
      <SidebarStats />

      {/* Logout confirmation modal — shown when timer is active */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-bg-card border border-surface-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="logout-dialog-title">
            <h3 id="logout-dialog-title" className="text-white font-semibold mb-2">Session in progress</h3>
            <p className="text-surface-300 text-sm mb-4">
              You have a focus session in progress. Logging out will reset your timer. Continue?
            </p>
            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="rounded border-surface-700 bg-surface-900 text-amber focus:ring-amber"
              />
              <span className="text-xs text-surface-400">Don&apos;t ask me again</span>
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowLogoutConfirm(false); setDontAskAgain(false); }}
                className="px-4 py-2 text-sm text-surface-300 border border-surface-700 rounded-lg hover:bg-surface-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  // Save "don't ask again" preference to user settings if checked
                  if (dontAskAgain) {
                    try {
                      const res = await fetch('/api/settings');
                      if (res.ok) {
                        const data = await res.json();
                        const settings = data.settings;
                        if (settings) {
                          settings.confirmLogoutWithActiveTimer = false;
                          await fetch('/api/settings', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ settings }),
                          });
                        }
                      }
                    } catch { /* best effort */ }
                  }
                  performLogout();
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Sidebar footer stats — TODAY count + STREAK.
 * Reads from DataProvider (global, reactive across all pages).
 */
function SidebarStats() {
  const { sessions } = useData();

  const { todayCount, streak } = useMemo(() => {
    // Sessions stored with UTC date — compare with UTC here too
    const today = new Date().toISOString().split('T')[0] ?? '';

    // TODAY: completed focus sessions today
    const todayFocus = sessions.filter(
      (s) => s.date === today && s.mode === 'focus' && s.status === 'completed' && !s.deletedAt,
    );

    // STREAK: consecutive days with at least 1 completed focus session
    let streakCount = 0;
    const date = new Date();

    // Check today first
    const todayHasSessions = todayFocus.length > 0;
    if (todayHasSessions) streakCount = 1;

    // Walk backwards from yesterday
    const startDay = todayHasSessions ? 1 : 0; // If today has sessions, start checking from yesterday
    if (!todayHasSessions) {
      // Check if we should start from today (no sessions yet today, streak from yesterday)
    }

    for (let i = startDay; i < 365; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0] ?? '';

      if (i === 0 && todayHasSessions) continue; // Already counted today

      const dayHasFocus = sessions.some(
        (s) => s.date === dateStr && s.mode === 'focus' && s.status === 'completed' && !s.deletedAt,
      );

      if (dayHasFocus) {
        streakCount++;
      } else {
        break; // Streak broken
      }
    }

    return { todayCount: todayFocus.length, streak: streakCount };
  }, [sessions]);

  return (
    <div className="pt-3 border-t border-surface-900 mt-4 space-y-3">
      <ConnectionIndicator />
      <div className="grid grid-cols-2 gap-2 text-center">
        <div>
          <p className="text-amber font-mono text-sm font-semibold">{todayCount}</p>
          <p className="text-surface-500 text-[9px] uppercase tracking-wider">Today</p>
        </div>
        <div>
          <p className="text-amber font-mono text-sm font-semibold">{streak}</p>
          <p className="text-surface-500 text-[9px] uppercase tracking-wider">Streak</p>
        </div>
      </div>
      {/* Legal links — accessible at all times per GDPR/CCPA */}
      <div className="flex items-center gap-3 mt-2">
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[9px] text-surface-500 hover:text-surface-300 transition-colors">
          Terms
        </a>
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[9px] text-surface-500 hover:text-surface-300 transition-colors">
          Privacy
        </a>
      </div>
    </div>
  );
}

/**
 * User avatar with Google profile picture and letter fallback.
 * PRD 3.1: Circular avatar from Google "picture" claim.
 * Missing/failed: fallback circle with first initial on amber background.
 */
function UserAvatar({ name, picture, size }: { name: string; picture: string; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (picture && !imgFailed) {
    return (
      <img
        src={picture}
        alt={name}
        width={size}
        height={size}
        className="rounded-full mb-2 object-cover"
        style={{ width: size, height: size }}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Letter fallback
  return (
    <div
      className="rounded-full bg-amber flex items-center justify-center text-white font-semibold mb-2"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
