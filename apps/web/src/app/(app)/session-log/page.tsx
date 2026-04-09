'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SessionRecord, TimerMode } from '@becoming/shared';

/**
 * Session Log page. PRD Section 8.
 * Completed sessions with filters, sorting, expansion, and export.
 * Full implementation in Phase 4.
 */
export default function SessionLogPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TimerMode>('all');
  const [showAbandoned, setShowAbandoned] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      if (showAbandoned) params.set('showAbandoned', 'true');

      const res = await fetch(`/api/sessions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // Silently retry
    } finally {
      setIsLoading(false);
    }
  }, [filter, showAbandoned]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Session Log</h1>
        <span className="text-surface-500 text-sm font-mono">{total} sessions</span>
      </div>

      {/* Filters (PRD 8.1) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(['all', 'focus', 'break', 'long_break'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors ${
              filter === type
                ? type === 'focus' ? 'bg-amber text-white'
                : type === 'break' ? 'bg-teal text-white'
                : type === 'long_break' ? 'bg-purple-600 text-white'
                : 'bg-surface-700 text-white'
                : 'text-surface-500 hover:text-surface-300'
            }`}
          >
            {type === 'all' ? 'All' : type === 'long_break' ? 'Long Break' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        <label className="flex items-center gap-1.5 text-xs text-surface-500 ml-2">
          <input
            type="checkbox"
            checked={showAbandoned}
            onChange={(e) => setShowAbandoned(e.target.checked)}
            className="rounded border-surface-700"
          />
          Show abandoned
        </label>
      </div>

      {/* Session table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-surface-900/50 rounded animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-surface-500 text-sm mb-4">
            {filter !== 'all' || showAbandoned
              ? 'No sessions match your filters.'
              : 'No sessions yet. Complete your first focus session to start building your log.'}
          </p>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-amber text-sm hover:underline">
              Clear all filters
            </button>
          )}
          {filter === 'all' && !showAbandoned && (
            <a href="/timer" className="inline-block px-4 py-2 bg-amber text-white text-sm rounded-lg hover:bg-amber-light transition-colors">
              Go to Timer →
            </a>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-900 text-surface-500 text-xs font-mono uppercase tracking-wider">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Time</th>
                <th className="text-left py-3 px-2">Type</th>
                <th className="text-left py-3 px-2">Duration</th>
                <th className="text-left py-3 px-2">Intent</th>
                <th className="text-left py-3 px-2">Category</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-surface-900/50 hover:bg-surface-900/30 transition-colors">
                  <td className="py-3 px-2 text-surface-300 font-mono text-xs">{session.date}</td>
                  <td className="py-3 px-2 text-surface-300 font-mono text-xs">
                    {new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                      session.mode === 'focus' ? 'bg-amber/20 text-amber'
                      : session.mode === 'break' ? 'bg-teal/20 text-teal'
                      : 'bg-purple-600/20 text-purple-400'
                    }`}>
                      {session.mode === 'long_break' ? 'Long' : session.mode}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-surface-300 font-mono text-xs">
                    {Math.round(session.actualDuration / 60)}m
                    {session.overtimeDuration > 0 && (
                      <span className="text-amber ml-1">+{Math.round(session.overtimeDuration / 60)}m</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-surface-300 text-xs max-w-[150px] truncate">
                    {session.intent || '—'}
                  </td>
                  <td className="py-3 px-2 text-surface-300 text-xs">{session.category}</td>
                  <td className="py-3 px-2">
                    {session.status === 'completed' ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
