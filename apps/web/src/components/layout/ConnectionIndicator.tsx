'use client';

import { useSync } from '@/contexts/SyncProvider';

/**
 * Connection status indicator — green/yellow/red dot in the sidebar.
 * Shows sync status at a glance. Tooltip with details on hover.
 */
export function ConnectionIndicator() {
  const { connectionStatus, metrics } = useSync();

  const colorMap: Record<string, string> = {
    connected: 'bg-green-400',
    syncing: 'bg-yellow-400 animate-pulse',
    offline: 'bg-red-400',
  };
  const color = colorMap[connectionStatus] ?? 'bg-gray-400';

  const labelMap: Record<string, string> = {
    connected: 'Synced',
    syncing: 'Syncing...',
    offline: 'Offline',
  };
  const label = labelMap[connectionStatus] ?? 'Unknown';

  return (
    <div className="flex items-center gap-1.5" title={`${label} · ${metrics.avgLatencyMs}ms avg · ${metrics.pollsPerMinute} req/min`}>
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[9px] text-surface-500 font-mono uppercase">{label}</span>
    </div>
  );
}
