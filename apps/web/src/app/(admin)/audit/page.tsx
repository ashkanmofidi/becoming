'use client';

import { useState, useEffect } from 'react';
import type { AuditLogEntry } from '@becoming/shared';

/**
 * Audit Log page. PRD Section 10.10. Super Admin only.
 */
export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin?view=audit')
      .then((res) => {
        if (res.status === 401) { window.location.href = '/login?error=session_expired'; return null; }
        if (res.status === 403) { window.location.href = '/timer?error=forbidden'; return null; }
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => { if (data) setEntries(data.entries ?? []); })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Audit Log</h1>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-surface-900/50 rounded animate-pulse" />)}</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-surface-500">
          No audit events recorded yet. Events will appear as admin actions occur.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-900 text-surface-500 text-xs font-mono uppercase tracking-wider">
                <th className="text-left py-3 px-2">Timestamp</th>
                <th className="text-left py-3 px-2">Actor</th>
                <th className="text-left py-3 px-2">Action</th>
                <th className="text-left py-3 px-2">Target</th>
                <th className="text-left py-3 px-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-surface-900/50 hover:bg-surface-900/30">
                  <td className="py-3 px-2 text-surface-500 text-xs font-mono">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-2 text-surface-300 text-xs">{entry.actorEmail}</td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 bg-surface-700 rounded text-[10px] font-mono">{entry.action}</span>
                  </td>
                  <td className="py-3 px-2 text-surface-300 text-xs">{entry.targetEmail ?? '—'}</td>
                  <td className="py-3 px-2 text-surface-500 text-xs font-mono">{JSON.stringify(entry.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
