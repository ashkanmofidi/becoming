import type { SessionRecord, TimerMode } from '../types/timer';

/**
 * Pomodoro cycle computation. PRD Section 5.5.
 * Computed from today's session log (not separate state).
 */

export interface CycleStatus {
  cycleNumber: number;
  currentPosition: number;
  totalPositions: number;
  dots: CycleDot[];
  nextMode: TimerMode;
}

export interface CycleDot {
  type: 'focus' | 'break';
  filled: boolean;
  position: number;
}

/**
 * Computes the current cycle status from today's sessions.
 * PRD: Visual shows 7 dots (4 focus + 3 break for default cycle of 4).
 * Generalized: (N focus + N-1 break) dots per cycle.
 */
export function getCycleStatus(
  todaySessions: SessionRecord[],
  cycleCount: number,
): CycleStatus {
  const completedToday = todaySessions.filter(
    (s) => s.status === 'completed' && s.deletedAt === null,
  );

  const focusCount = completedToday.filter((s) => s.mode === 'focus').length;
  const breakCount = completedToday.filter(
    (s) => s.mode === 'break' || s.mode === 'long_break',
  ).length;

  const totalPerCycle = cycleCount + (cycleCount - 1);
  const completedInAllCycles = focusCount + breakCount;
  const cycleNumber = Math.floor(completedInAllCycles / totalPerCycle) + 1;
  const positionInCycle = completedInAllCycles % totalPerCycle;

  const dots: CycleDot[] = [];
  for (let i = 0; i < totalPerCycle; i++) {
    const isFocus = i % 2 === 0;
    dots.push({
      type: isFocus ? 'focus' : 'break',
      filled: i < positionInCycle,
      position: i,
    });
  }

  const focusInCycle = Math.ceil((positionInCycle + 1) / 2);
  let nextMode: TimerMode;
  if (positionInCycle % 2 === 0) {
    nextMode = 'focus';
  } else if (focusInCycle >= cycleCount) {
    nextMode = 'long_break';
  } else {
    nextMode = 'break';
  }

  return {
    cycleNumber,
    currentPosition: positionInCycle,
    totalPositions: totalPerCycle,
    dots,
    nextMode,
  };
}
