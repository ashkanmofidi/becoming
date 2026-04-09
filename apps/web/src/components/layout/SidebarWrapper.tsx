'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import type { UserRole } from '@becoming/shared';

/**
 * Client-side wrapper that fetches user session data for the Sidebar.
 */
export function SidebarWrapper() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: UserRole;
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  if (!user) {
    // Skeleton while loading
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
      userRole={user.role}
    />
  );
}
