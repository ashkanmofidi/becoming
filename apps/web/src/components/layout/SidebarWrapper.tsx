'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import type { UserRole } from '@becoming/shared';

/**
 * Client-side wrapper that fetches user session data for the Sidebar.
 * Handles session expiry with timer-active check.
 */
export function SidebarWrapper() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    picture: string;
    role: UserRole;
  } | null>(null);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(true);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(async (res) => {
        if (res.status === 401) {
          // Session expired — check if timer is active before forcing logout
          try {
            const timerRes = await fetch('/api/timer');
            if (timerRes.ok) {
              const timerData = await timerRes.json();
              const status = timerData.state?.status;
              if (status === 'running' || status === 'paused' || status === 'overtime') {
                setShowExpiryWarning(true);
                return null;
              }
            }
          } catch {
            // Can't check timer — proceed with redirect
          }
          window.location.href = '/login?error=session_expired';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
          // Fetch logout confirmation preference
          fetch('/api/settings')
            .then((r) => r.json())
            .then((s) => {
              if (s.settings?.confirmLogoutWithActiveTimer !== undefined) {
                setConfirmLogout(s.settings.confirmLogoutWithActiveTimer);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleForceLogout = async () => {
    // Abandon timer, then redirect to login
    try {
      await fetch('/api/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'abandon' }),
      });
    } catch { /* best effort */ }
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login?error=session_expired';
  };

  // Session expiry warning when timer is active
  if (showExpiryWarning) {
    return (
      <>
        <aside className="hidden lg:flex flex-col w-[200px] border-r border-surface-900 bg-bg-primary p-4">
          <div className="mb-6">
            <h1 className="font-serif text-xl">
              Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
            </h1>
          </div>
        </aside>
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-bg-card border border-surface-700 rounded-xl p-6 max-w-sm w-full shadow-2xl" role="dialog">
            <h3 className="text-white font-semibold mb-2">Session expired</h3>
            <p className="text-surface-300 text-sm mb-6">
              Your session has expired, but you have a focus session in progress. Logging out will reset your timer. Your progress will be saved.
            </p>
            <button
              onClick={handleForceLogout}
              className="w-full px-4 py-2 text-sm bg-amber text-white rounded-lg hover:bg-amber-light transition-colors"
            >
              Log Out & Save Progress
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <aside className="hidden lg:flex flex-col w-[200px] border-r border-surface-900 bg-bg-primary p-4">
        <div className="mb-6">
          <h1 className="font-serif text-xl">
            Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
          </h1>
          <p className="text-surface-500 text-[10px] tracking-[0.2em] uppercase font-mono mt-1">
            V3.1 · ENTERPRISE BETA
          </p>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-surface-900 rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface-900 rounded animate-pulse" />
        </div>
      </aside>
    );
  }

  return (
    <Sidebar
      userName={user.name}
      userEmail={user.email}
      userPicture={user.picture}
      userRole={user.role}
      confirmLogoutWithActiveTimer={confirmLogout}
    />
  );
}
