'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TimerMode } from '@becoming/shared';

interface SessionData {
  mode: TimerMode;
  status: string;
  deletedAt: string | null;
  date: string;
  actualDuration: number;
  startedAt: string;
  id: string;
  intent: string | null;
  category: string;
  configuredDuration: number;
  overtimeDuration: number;
}

interface DashboardData {
  stats: Record<string, unknown>;
  focusHoursByDay: unknown[];
  focusHours30d: unknown[];
  categoryBreakdown: unknown[];
  heatmap: unknown[];
  topIntents: unknown[];
  peakHours: unknown[];
  weeklyComparison: unknown;
  dailyGoal: number;
}

interface DataContextValue {
  sessions: SessionData[];
  dashboard: DashboardData | null;
  isReady: boolean;
  refreshSessions: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  addOptimisticSession: (session: Partial<SessionData>) => void;
}

const DataContext = createContext<DataContextValue>({
  sessions: [],
  dashboard: null,
  isReady: false,
  refreshSessions: async () => {},
  refreshDashboard: async () => {},
  addOptimisticSession: () => {},
});

/**
 * Global data provider — prefetches ALL app data on init.
 *
 * WHY: Each page was fetching its own data on mount, causing visible
 * loading states on every navigation. Now everything is fetched ONCE
 * at app startup. Pages render instantly from this cached data.
 * Background refreshes keep it current (stale-while-revalidate).
 */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [isReady, setIsReady] = useState(false);
  const fetchedRef = useRef(false);

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions?type=all&limit=100');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
      }
    } catch { /* silent */ }
  }, []);

  const refreshDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch { /* silent */ }
  }, []);

  const addOptimisticSession = useCallback((session: Partial<SessionData>) => {
    const now = new Date();
    setSessions((prev) => [
      {
        id: `opt_${Date.now()}`,
        mode: 'focus' as TimerMode,
        status: 'completed',
        deletedAt: null,
        date: now.toISOString().split('T')[0] ?? '',
        actualDuration: 60,
        startedAt: now.toISOString(),
        intent: null,
        category: 'General',
        configuredDuration: 60,
        overtimeDuration: 0,
        ...session,
      },
      ...prev,
    ]);
  }, []);

  // Prefetch on mount — sessions are fast (needed for counters), dashboard is slow (background)
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Sessions fetch is fast and needed for timer page counters — mark ready when it completes
    refreshSessions().finally(() => setIsReady(true));
    // Dashboard is slow (aggregates all sessions) — load in background, don't block UI
    refreshDashboard();
  }, [refreshSessions, refreshDashboard]);

  // Background refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSessions();
      refreshDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshSessions, refreshDashboard]);

  return (
    <DataContext.Provider value={{
      sessions,
      dashboard,
      isReady,
      refreshSessions,
      refreshDashboard,
      addOptimisticSession,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
