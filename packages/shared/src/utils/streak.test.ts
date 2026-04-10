import { describe, it, expect } from 'vitest';
import { calculateStreak } from './streak';
import type { SessionRecord } from '../types/timer';
import type { UserSettings } from '../types/settings';
import { createDefaultSettings } from './migration';

function makeSession(date: string, overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: `ses_${Math.random()}`,
    userId: 'user1',
    date,
    startedAt: `${date}T10:00:00Z`,
    completedAt: `${date}T10:25:00Z`,
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

function makeSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return { ...createDefaultSettings(), ...overrides };
}

describe('calculateStreak', () => {
  it('returns 0 streak with no sessions', () => {
    const result = calculateStreak([], makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.startDate).toBeNull();
  });

  it('counts a 1-day streak with sessions today', () => {
    const sessions = [makeSession('2026-04-09')];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(1);
  });

  it('counts consecutive days as a streak', () => {
    const sessions = [
      makeSession('2026-04-09'),
      makeSession('2026-04-08'),
      makeSession('2026-04-07'),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(3);
  });

  it('breaks streak on missing day', () => {
    const sessions = [
      makeSession('2026-04-09'),
      // 2026-04-08 missing
      makeSession('2026-04-07'),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(1); // Only today counts
  });

  it('uses streak freeze to bridge a gap', () => {
    const sessions = [
      makeSession('2026-04-09'),
      // 2026-04-08 missing — freeze used
      makeSession('2026-04-07'),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 1);
    expect(result.current).toBe(3); // today + freeze + day before
    expect(result.freezesUsedThisMonth).toBe(1);
  });

  it('does not exceed available freezes', () => {
    const sessions = [
      makeSession('2026-04-09'),
      // 2026-04-08 missing — freeze 1
      // 2026-04-07 missing — no more freezes
      makeSession('2026-04-06'),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 1);
    // Freeze bridges 04-08, but 04-07 has no freeze → streak breaks
    expect(result.current).toBe(2); // Today + freeze day only
  });

  it('ignores abandoned sessions', () => {
    const sessions = [
      makeSession('2026-04-09', { status: 'abandoned' }),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(0);
  });

  it('ignores break sessions', () => {
    const sessions = [
      makeSession('2026-04-09', { mode: 'break' }),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(0);
  });

  it('ignores deleted sessions', () => {
    const sessions = [
      makeSession('2026-04-09', { deletedAt: '2026-04-09T12:00:00Z' }),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(0);
  });

  it('meet_goal rule requires daily goal sessions', () => {
    const sessions = [
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
    ];
    const settings = makeSettings({ streakCalculation: 'meet_goal', dailyGoal: 4 });
    const result = calculateStreak(sessions, settings, '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(0); // 3 < 4, goal not met
  });

  it('meet_goal rule succeeds when goal is met', () => {
    const sessions = [
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
    ];
    const settings = makeSettings({ streakCalculation: 'meet_goal', dailyGoal: 4 });
    const result = calculateStreak(sessions, settings, '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(1);
  });

  it('open_app rule always counts', () => {
    const settings = makeSettings({ streakCalculation: 'open_app' });
    const result = calculateStreak([], settings, '00:00', 'UTC', '2026-04-09', 0, 0);
    // open_app: dayMeetsRule always returns true
    expect(result.current).toBeGreaterThan(0);
  });

  it('tracks longest streak separately from current', () => {
    const sessions = [
      // Current streak: 2 days
      makeSession('2026-04-09'),
      makeSession('2026-04-08'),
      // Gap
      // Older streak: 4 days
      makeSession('2026-04-05'),
      makeSession('2026-04-04'),
      makeSession('2026-04-03'),
      makeSession('2026-04-02'),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(4);
  });

  it('handles multiple sessions per day', () => {
    const sessions = [
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
      makeSession('2026-04-09'),
    ];
    const result = calculateStreak(sessions, makeSettings(), '00:00', 'UTC', '2026-04-09', 0, 0);
    expect(result.current).toBe(1); // Multiple sessions on same day = 1 day
  });
});
