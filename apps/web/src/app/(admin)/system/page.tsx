'use client';

import { useState, useEffect } from 'react';
import { useSync } from '@/contexts/SyncProvider';

/**
 * System Health & Observability Dashboard. PRD Section 10.7.
 *
 * Shows real-time sync metrics, connection health, and performance data.
 * This is the "Phase 2 trigger" — when metrics cross thresholds,
 * the admin knows it's time to upgrade from polling to SSE/WebSocket.
 */
export default function SystemHealthPage() {
  const { connectionStatus, metrics } = useSync();
  const [serverHealth, setServerHealth] = useState<Record<string, unknown> | null>(null);
  const [kvStats, setKvStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // Fetch server-side health metrics
    fetch('/api/admin?view=pulse')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setServerHealth(data))
      .catch(() => {});
  }, []);

  // Phase 2 upgrade thresholds
  const pollsHighAlert = metrics.pollsPerMinute > 100;
  const latencyHighAlert = metrics.avgLatencyMs > 3000;
  const failureHighAlert = metrics.failedSyncs > 10;

  const needsUpgrade = pollsHighAlert || latencyHighAlert;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">System Health</h1>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' :
            connectionStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className="text-sm text-surface-300 font-mono">{connectionStatus.toUpperCase()}</span>
        </div>
      </div>

      {/* Phase 2 upgrade alert */}
      {needsUpgrade && (
        <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-6">
          <h3 className="text-amber font-semibold text-sm mb-1">⚡ Upgrade Recommended</h3>
          <p className="text-surface-300 text-xs">
            Polling load is high ({metrics.pollsPerMinute} req/min, {metrics.avgLatencyMs}ms avg latency).
            Consider upgrading to Server-Sent Events (SSE) for real-time push.
            See CLAUDE.md Phase 2 upgrade instructions.
          </p>
        </div>
      )}

      {/* Real-time sync metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Sync Latency"
          value={`${metrics.avgLatencyMs}ms`}
          status={metrics.avgLatencyMs < 500 ? 'good' : metrics.avgLatencyMs < 2000 ? 'warn' : 'bad'}
          threshold="< 500ms ideal"
        />
        <MetricCard
          label="Polls / Minute"
          value={String(metrics.pollsPerMinute)}
          status={metrics.pollsPerMinute < 50 ? 'good' : metrics.pollsPerMinute < 200 ? 'warn' : 'bad'}
          threshold="< 50 ideal, > 200 = upgrade"
        />
        <MetricCard
          label="Total Polls"
          value={String(metrics.pollCount)}
          status="good"
          threshold="Since page load"
        />
        <MetricCard
          label="Failed Syncs"
          value={String(metrics.failedSyncs)}
          status={metrics.failedSyncs === 0 ? 'good' : metrics.failedSyncs < 5 ? 'warn' : 'bad'}
          threshold="0 ideal"
        />
      </div>

      {/* Connection details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-bg-card border border-surface-900 rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-3">Sync Transport</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-500">Method</span>
              <span className="text-surface-100 font-mono">{metrics.transport === 'pusher' ? 'Pusher (real-time push)' : 'Polling (2s fallback)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">BroadcastChannel</span>
              <span className="text-surface-100 font-mono">{typeof BroadcastChannel !== 'undefined' ? 'Active' : 'Not supported'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Last Sync</span>
              <span className="text-surface-100 font-mono text-xs">
                {metrics.lastSyncAt ? new Date(metrics.lastSyncAt).toLocaleTimeString() : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Status</span>
              <span className={`font-mono text-xs ${
                connectionStatus === 'connected' ? 'text-green-400' :
                connectionStatus === 'syncing' ? 'text-yellow-400' : 'text-red-400'
              }`}>{connectionStatus}</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-surface-900 rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-3">Upgrade Path</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-surface-500">Current</span>
              <span className="text-surface-100 font-mono">Phase 1 (Polling)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Next</span>
              <span className="text-surface-100 font-mono">Phase 2 (SSE + Upstash Pub/Sub)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Trigger</span>
              <span className="text-surface-100 font-mono">&gt; 200 polls/min or &gt; 3s latency</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Status</span>
              <span className={`font-mono text-xs ${needsUpgrade ? 'text-amber' : 'text-green-400'}`}>
                {needsUpgrade ? 'Upgrade recommended' : 'No upgrade needed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Server health from admin API */}
      {serverHealth && (
        <div className="bg-bg-card border border-surface-900 rounded-xl p-5">
          <h3 className="text-sm font-mono uppercase tracking-wider text-amber mb-3">Server Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <p className="text-surface-500 text-xs">System</p>
              <p className="text-green-400 font-mono text-sm">
                {String(serverHealth.systemStatus) === 'green' ? '✓ Healthy' : String(serverHealth.systemStatus)}
              </p>
            </div>
            <div>
              <p className="text-surface-500 text-xs">Beta Capacity</p>
              <p className="text-surface-100 font-mono text-sm">
                {serverHealth.betaCapacity
                  ? `${(serverHealth.betaCapacity as Record<string, number>).current}/${(serverHealth.betaCapacity as Record<string, number>).max}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-surface-500 text-xs">Active Now</p>
              <p className="text-surface-100 font-mono text-sm">{String(serverHealth.activeNow ?? '—')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, status, threshold }: {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad';
  threshold: string;
}) {
  const color = { good: 'text-green-400', warn: 'text-yellow-400', bad: 'text-red-400' }[status];
  const borderColor = { good: 'border-green-900/30', warn: 'border-yellow-900/30', bad: 'border-red-900/30' }[status];

  return (
    <div className={`bg-bg-card border ${borderColor} rounded-xl p-4`}>
      <p className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-mono font-semibold mt-1 ${color}`}>{value}</p>
      <p className="text-surface-500 text-[9px] mt-1">{threshold}</p>
    </div>
  );
}
