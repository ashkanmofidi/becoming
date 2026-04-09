'use client';

interface DailyFocusTimeProps {
  /** Total focus minutes completed today (full + partial). */
  totalMinutes: number;
  /** If a focus session is currently running, the elapsed seconds so far. */
  activeElapsedSeconds: number;
}

/**
 * Daily focus time display. Shows total focus time for today.
 * Updates in real time — includes elapsed time of active session.
 * Only FOCUS time counts, never break or long break.
 */
export function DailyFocusTime({ totalMinutes, activeElapsedSeconds }: DailyFocusTimeProps) {
  const totalSeconds = totalMinutes * 60 + activeElapsedSeconds;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  return (
    <div className="flex items-center gap-2">
      <span className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">
        Focus Today
      </span>
      <span className="text-amber font-mono text-sm font-semibold">
        {hours}h {mins}m
      </span>
    </div>
  );
}
