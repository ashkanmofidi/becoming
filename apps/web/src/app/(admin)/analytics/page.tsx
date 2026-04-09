'use client';

import { useState, useEffect } from 'react';

/**
 * Admin Analytics page. PRD Section 10.2-10.5.
 */
export default function AdminAnalyticsPage() {
  const [pulse, setPulse] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchPulse = async () => {
      const res = await fetch('/api/admin?view=pulse');
      if (res.status === 401) { window.location.href = '/login?error=session_expired'; return; }
      if (res.status === 403) { window.location.href = '/timer?error=forbidden'; return; }
      if (res.ok) setPulse(await res.json());
    };
    fetchPulse();
    const interval = setInterval(fetchPulse, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <span className="flex items-center gap-1 text-xs text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Pulse cards (PRD 10.2) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Active Now', value: pulse?.activeNow ?? '—' },
          { label: "Today's Sessions", value: pulse?.todaySessions ?? '—' },
          { label: 'Focus Hours', value: pulse?.todayFocusHours ?? '—' },
          { label: 'Active Users', value: pulse?.todayActiveUsers ?? '—' },
          { label: 'Beta Capacity', value: pulse?.betaCapacity ? `${(pulse.betaCapacity as Record<string, number>).current}/${(pulse.betaCapacity as Record<string, number>).max}` : '—' },
          { label: 'System', value: pulse?.systemStatus === 'green' ? '✓ Healthy' : pulse?.systemStatus ?? '—' },
        ].map((card) => (
          <div key={card.label} className="bg-bg-card border border-surface-900 rounded-xl p-4">
            <p className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">{card.label}</p>
            <p className="text-lg font-mono text-surface-100 mt-1">{String(card.value)}</p>
          </div>
        ))}
      </div>

      <p className="text-surface-500 text-sm">
        Full analytics charts will be implemented with Recharts in Phase 5.
      </p>
    </div>
  );
}
