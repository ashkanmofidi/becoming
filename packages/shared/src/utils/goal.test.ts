import { describe, it, expect } from 'vitest';
import {
  getDailyGoalStatus,
  getWeeklyGoalStatus,
  calculateGoalRate,
} from './goal';
import type { SessionRecord } from '../types/timer';

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `ses_${Math.random()}`,
    userId: 'user1',
    date: '2026-04-08',
    startedAt: '2026-04-08T10:00:00Z',
    completedAt: '2026-04-08T10:25:00Z',
    mode: 'focus',
    configuredDuration: 1500,
    actualDuration: 1500,
    overtimeDuration: 0,
    intent: null,
    category: 'General',
    status: 'completed',
    notes: null,
    deviceId: 'dev1',
    deletedAt: null,
    ...overrides,
  };
}

describe('getDailyGoalStatus', () => {
  it('returns 0 completed for no sessions', () => {
    const result = getDailyGoalStatus([], 4, '2026-04-08');
    expect(result.completed).toBe(0);
    expect(result.target).toBe(4);
    expect(result.met).toBe(false);
    expect(result.exceeded).toBe(false);
  });

  it('counts only completed focus sessions for today', () => {
    const sessions = [
      makeSession({ status: 'completed', mode: 'focus' }),
      makeSession({ status: 'completed', mode: 'focus' }),
      makeSession({ status: 'completed', mode: 'break' }), // breaks don't count
      makeSession({ status: 'abandoned', mode: 'focus' }), // abandoned doesn't count
      makeSession({
        status: 'completed',
        mode: 'focus',
        date: '2026-04-07',
      }), // different day
    ];
    const result = getDailyGoalStatus(sessions, 4, '2026-04-08');
    expect(result.completed).toBe(2);
  });

  it('counts ALL completed sessions regardless of duration (no min threshold)', () => {
    const sessions = [
      makeSession({ actualDuration: 1500 }), // 25 min
      makeSession({ actualDuration: 300 }), // 5 min
      makeSession({ actualDuration: 5 }), // 5 seconds
    ];
    const result = getDailyGoalStatus(sessions, 4, '2026-04-08');
    expect(result.completed).toBe(3); // All count, no minimum
  });

  it('detects goal met', () => {
    const sessions = Array(4)
      .fill(null)
      .map(() => makeSession());
    const result = getDailyGoalStatus(sessions, 4, '2026-04-08');
    expect(result.met).toBe(true);
    expect(result.exceeded).toBe(false);
  });

  it('detects goal exceeded (PRD 5.4: shows "6/4")', () => {
    const sessions = Array(6)
      .fill(null)
      .map(() => makeSession());
    const result = getDailyGoalStatus(sessions, 4, '2026-04-08');
    expect(result.completed).toBe(6);
    expect(result.met).toBe(true);
    expect(result.exceeded).toBe(true);
  });

  it('ignores soft-deleted sessions', () => {
    const sessions = [
      makeSession({ deletedAt: null }),
      makeSession({ deletedAt: '2026-04-08T12:00:00Z' }),
    ];
    const result = getDailyGoalStatus(sessions, 4, '2026-04-08');
    expect(result.completed).toBe(1);
  });

  it('handles goal of 1 (minimum)', () => {
    const sessions = [makeSession()];
    const result = getDailyGoalStatus(sessions, 1, '2026-04-08');
    expect(result.met).toBe(true);
    expect(result.exceeded).toBe(false);
  });

  it('handles goal of 20 (maximum)', () => {
    const sessions = Array(20)
      .fill(null)
      .map(() => makeSession());
    const result = getDailyGoalStatus(sessions, 20, '2026-04-08');
    expect(result.met).toBe(true);
    expect(result.exceeded).toBe(false);
  });

  it('does not count long_break sessions', () => {
    const sessions = [makeSession({ mode: 'long_break' })];
    const result = getDailyGoalStatus(sessions, 4, '2026-04-08');
    expect(result.completed).toBe(0);
  });
});

describe('getWeeklyGoalStatus', () => {
  it('returns 0 for no sessions in the week', () => {
    const result = getWeeklyGoalStatus([], 20, '2026-04-06', '2026-04-12');
    expect(result.completed).toBe(0);
    expect(result.target).toBe(20);
    expect(result.met).toBe(false);
  });

  it('counts sessions within the week range', () => {
    const sessions = [
      makeSession({ date: '2026-04-06' }), // start of week
      makeSession({ date: '2026-04-08' }), // mid-week
      makeSession({ date: '2026-04-12' }), // end of week
      makeSession({ date: '2026-04-05' }), // before week
      makeSession({ date: '2026-04-13' }), // after week
    ];
    const result = getWeeklyGoalStatus(
      sessions,
      20,
      '2026-04-06',
      '2026-04-12',
    );
    expect(result.completed).toBe(3);
  });

  it('excludes break sessions and abandoned sessions', () => {
    const sessions = [
      makeSession({ date: '2026-04-08', mode: 'focus' }),
      makeSession({ date: '2026-04-08', mode: 'break' }),
      makeSession({ date: '2026-04-08', status: 'abandoned' }),
    ];
    const result = getWeeklyGoalStatus(
      sessions,
      20,
      '2026-04-06',
      '2026-04-12',
    );
    expect(result.completed).toBe(1);
  });

  it('excludes soft-deleted sessions', () => {
    const sessions = [
      makeSession({ date: '2026-04-08' }),
      makeSession({ date: '2026-04-08', deletedAt: '2026-04-08T12:00:00Z' }),
    ];
    const result = getWeeklyGoalStatus(
      sessions,
      20,
      '2026-04-06',
      '2026-04-12',
    );
    expect(result.completed).toBe(1);
  });

  it('detects weekly goal met', () => {
    const sessions = Array(20)
      .fill(null)
      .map(() => makeSession({ date: '2026-04-08' }));
    const result = getWeeklyGoalStatus(
      sessions,
      20,
      '2026-04-06',
      '2026-04-12',
    );
    expect(result.met).toBe(true);
  });

  it('counts ALL sessions regardless of duration (no min threshold)', () => {
    const sessions = [
      makeSession({ date: '2026-04-08', actualDuration: 1500 }),
      makeSession({ date: '2026-04-08', actualDuration: 300 }),
      makeSession({ date: '2026-04-08', actualDuration: 5 }),
    ];
    const result = getWeeklyGoalStatus(
      sessions,
      20,
      '2026-04-06',
      '2026-04-12',
    );
    expect(result.completed).toBe(3);
  });
});

describe('calculateGoalRate', () => {
  it('returns null with zero days (PRD 7.1: "—" until first full day)', () => {
    expect(calculateGoalRate(0, 0)).toBeNull();
  });

  it('calculates percentage correctly', () => {
    expect(calculateGoalRate(7, 10)).toBe(70);
    expect(calculateGoalRate(10, 10)).toBe(100);
    expect(calculateGoalRate(1, 3)).toBe(33); // Math.round(33.33) = 33
  });

  it('returns 0 when no goals met', () => {
    expect(calculateGoalRate(0, 10)).toBe(0);
  });

  it('handles single day', () => {
    expect(calculateGoalRate(1, 1)).toBe(100);
    expect(calculateGoalRate(0, 1)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(calculateGoalRate(1, 6)).toBe(17); // 16.67 -> 17
    expect(calculateGoalRate(2, 3)).toBe(67); // 66.67 -> 67
  });
});
