/**
 * Timezone and Day Reset utilities. PRD Section 6.2 (Day Reset Time).
 * All timestamps are UTC ISO 8601. Timezone conversion is client-side.
 */

/**
 * Gets the current date string based on the user's Day Reset Time.
 * PRD Section 5.2.2: A session's "day" is determined by when it STARTED.
 */
export function getCurrentDay(dayResetTime: string, timezone: string): string {
  const now = new Date();
  const localNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const parts = dayResetTime.split(':').map(Number);
  const resetHour = parts[0] ?? 0;
  const resetMinute = parts[1] ?? 0;
  const resetToday = new Date(localNow);
  resetToday.setHours(resetHour, resetMinute, 0, 0);

  if (localNow < resetToday) {
    resetToday.setDate(resetToday.getDate() - 1);
  }

  return resetToday.toISOString().split('T')[0] ?? '';
}

/**
 * Gets the day boundary for a specific date in the user's timezone.
 * Returns start and end as UTC timestamps.
 */
export function getDayBoundaries(
  date: string,
  dayResetTime: string,
  timezone: string,
): { start: Date; end: Date } {
  const [resetHour, resetMinute] = dayResetTime.split(':').map(Number);
  const startLocal = new Date(`${date}T${String(resetHour).padStart(2, '0')}:${String(resetMinute).padStart(2, '0')}:00`);
  const endLocal = new Date(startLocal);
  endLocal.setDate(endLocal.getDate() + 1);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return {
    start: startLocal,
    end: endLocal,
  };
}

/**
 * Calculates elapsed time immune to DST transitions.
 * PRD Section 5.2.2: timer uses UTC timestamps.
 */
export function calculateElapsedSeconds(startedAtUtc: string, nowUtc?: string): number {
  const start = new Date(startedAtUtc).getTime();
  const now = nowUtc ? new Date(nowUtc).getTime() : Date.now();
  return Math.floor((now - start) / 1000);
}

/**
 * Calculates remaining seconds for a running timer.
 */
export function calculateRemainingSeconds(
  startedAtUtc: string,
  configuredDurationMinutes: number,
  pausedAtUtc?: string | null,
): number {
  const totalSeconds = configuredDurationMinutes * 60;
  const endRef = pausedAtUtc || new Date().toISOString();
  const elapsed = calculateElapsedSeconds(startedAtUtc, endRef);
  return Math.max(0, totalSeconds - elapsed);
}

/**
 * Formats seconds into MM:SS or HH:MM:SS display.
 * PRD Section 5.2.2: exceeding 60 minutes switches to HH:MM:SS.
 */
export function formatTimerDisplay(totalSeconds: number, showSeconds: boolean): string {
  const absSeconds = Math.abs(totalSeconds);
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;
  const prefix = totalSeconds < 0 ? '+' : '';

  if (hours > 0) {
    return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  if (showSeconds) {
    return `${prefix}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${prefix}${String(minutes).padStart(2, '0')}:00`;
}
