import type { SessionRecord } from '../types/timer';

/**
 * Daily and weekly goal logic. PRD Section 5.4, 6.8.
 */

export interface DailyGoalStatus {
  completed: number;
  target: number;
  met: boolean;
  exceeded: boolean;
}

/**
 * Calculates daily goal status.
 * PRD: Only completed FOCUS sessions count toward goal.
 * PRD: Sessions under minCountableSession are excluded.
 */
export function getDailyGoalStatus(
  sessions: SessionRecord[],
  dailyGoal: number,
  today: string,
  minCountableMinutes: number,
): DailyGoalStatus {
  const completed = sessions.filter(
    (s) =>
      s.date === today &&
      s.status === 'completed' &&
      s.mode === 'focus' &&
      s.actualDuration >= minCountableMinutes * 60 &&
      s.deletedAt === null,
  ).length;

  return {
    completed,
    target: dailyGoal,
    met: completed >= dailyGoal,
    exceeded: completed > dailyGoal,
  };
}

/**
 * Calculates weekly goal status.
 * PRD Section 6.8: Independent of daily goal.
 */
export function getWeeklyGoalStatus(
  sessions: SessionRecord[],
  weeklyGoalTarget: number,
  weekStart: string,
  weekEnd: string,
  minCountableMinutes: number,
): { completed: number; target: number; met: boolean } {
  const completed = sessions.filter(
    (s) =>
      s.date >= weekStart &&
      s.date <= weekEnd &&
      s.status === 'completed' &&
      s.mode === 'focus' &&
      s.actualDuration >= minCountableMinutes * 60 &&
      s.deletedAt === null,
  ).length;

  return {
    completed,
    target: weeklyGoalTarget,
    met: completed >= weeklyGoalTarget,
  };
}

/**
 * Calculates goal rate (% of days meeting daily goal).
 * PRD Section 7.1: "—" until first full day.
 */
export function calculateGoalRate(
  dailyGoalMetDays: number,
  totalDays: number,
): number | null {
  if (totalDays === 0) return null;
  return Math.round((dailyGoalMetDays / totalDays) * 100);
}
