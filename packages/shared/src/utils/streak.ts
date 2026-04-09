import type { SessionRecord } from '../types/timer';
import type { UserSettings } from '../types/settings';

/**
 * Streak calculation logic. PRD Section 6.2 (Streak Calculation).
 * Three rules: "At least 1 session", "Meet daily goal", "Open the app".
 */

export interface StreakResult {
  current: number;
  longest: number;
  startDate: string | null;
  longestStartDate: string | null;
  longestEndDate: string | null;
  freezesUsedThisMonth: number;
}

/**
 * Calculates streak from session records.
 * PRD: Streak Freeze (rest days) count as meeting ANY rule.
 * PRD: "Meet daily goal" uses the goal value active on each historical day.
 */
export function calculateStreak(
  sessions: SessionRecord[],
  settings: UserSettings,
  dayResetTime: string,
  timezone: string,
  today: string,
  freezesUsedThisMonth: number,
  freezesAvailable: number,
): StreakResult {
  const completedSessions = sessions.filter(
    (s) => s.status === 'completed' && s.mode === 'focus' && s.deletedAt === null,
  );

  const sessionsByDay = new Map<string, number>();
  for (const session of completedSessions) {
    const day = session.date;
    sessionsByDay.set(day, (sessionsByDay.get(day) ?? 0) + 1);
  }

  const rule = settings.streakCalculation;
  const dailyGoal = settings.dailyGoal;

  function dayMeetsRule(day: string): boolean {
    const count = sessionsByDay.get(day) ?? 0;
    switch (rule) {
      case 'one_session':
        return count >= 1;
      case 'meet_goal':
        return count >= dailyGoal;
      case 'open_app':
        return true;
      default:
        return count >= 1;
    }
  }

  let current = 0;
  let longest = 0;
  let currentStart: string | null = null;
  let longestStart: string | null = null;
  let longestEnd: string | null = null;
  let streakActive = true;
  let tempFreezesUsed = 0;

  const date = new Date(today);
  const dates: string[] = [];
  for (let i = 0; i < 365; i++) {
    dates.push(date.toISOString().split('T')[0] ?? '');
    date.setDate(date.getDate() - 1);
  }

  let runLength = 0;
  let runStart: string | null = null;

  for (const day of dates) {
    if (dayMeetsRule(day)) {
      runLength++;
      runStart = day;
    } else if (tempFreezesUsed < freezesAvailable) {
      runLength++;
      tempFreezesUsed++;
      runStart = day;
    } else {
      if (runLength > longest) {
        longest = runLength;
        longestStart = runStart;
        longestEnd = dates[dates.indexOf(day) - runLength] ?? day ?? null;
      }
      if (streakActive) {
        current = runLength;
        currentStart = runStart;
        streakActive = false;
      }
      runLength = 0;
      runStart = null;
    }
  }

  if (streakActive) {
    current = runLength;
    currentStart = runStart;
  }
  if (runLength > longest) {
    longest = runLength;
    longestStart = runStart;
    longestEnd = dates[0] ?? null;
  }

  return {
    current,
    longest,
    startDate: currentStart,
    longestStartDate: longestStart,
    longestEndDate: longestEnd,
    freezesUsedThisMonth: tempFreezesUsed,
  };
}
