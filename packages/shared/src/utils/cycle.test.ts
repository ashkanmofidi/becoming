import { describe, it, expect } from 'vitest';
import { getCycleStatus } from './cycle';
import type { SessionRecord } from '../types/timer';

function makeSession(
  mode: 'focus' | 'break' | 'long_break',
  overrides: Partial<SessionRecord> = {},
): SessionRecord {
  return {
    id: `ses_${Math.random()}`,
    userId: 'user1',
    date: '2026-04-08',
    startedAt: '2026-04-08T10:00:00Z',
    completedAt: '2026-04-08T10:25:00Z',
    mode,
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

describe('getCycleStatus', () => {
  it('returns empty cycle for no sessions', () => {
    const result = getCycleStatus([], 4);
    expect(result.cycleNumber).toBe(1);
    expect(result.currentPosition).toBe(0);
    expect(result.dots.every((d) => !d.filled)).toBe(true);
  });

  it('generates correct number of dots (PRD 5.5: N focus + N-1 break)', () => {
    const result = getCycleStatus([], 4);
    expect(result.dots.length).toBe(7); // 4 focus + 3 break
    expect(result.totalPositions).toBe(7);
  });

  it('generates correct dots for cycle count of 2', () => {
    const result = getCycleStatus([], 2);
    expect(result.dots.length).toBe(3); // 2 focus + 1 break
    expect(result.totalPositions).toBe(3);
  });

  it('generates correct dots for cycle count of 10', () => {
    const result = getCycleStatus([], 10);
    expect(result.dots.length).toBe(19); // 10 focus + 9 break
    expect(result.totalPositions).toBe(19);
  });

  it('alternates between focus and break dot types', () => {
    const result = getCycleStatus([], 4);
    expect(result.dots[0]?.type).toBe('focus');
    expect(result.dots[1]?.type).toBe('break');
    expect(result.dots[2]?.type).toBe('focus');
    expect(result.dots[3]?.type).toBe('break');
    expect(result.dots[4]?.type).toBe('focus');
    expect(result.dots[5]?.type).toBe('break');
    expect(result.dots[6]?.type).toBe('focus');
  });

  it('fills dots as sessions complete', () => {
    const sessions = [makeSession('focus')];
    const result = getCycleStatus(sessions, 4);
    expect(result.dots[0]?.filled).toBe(true);
    expect(result.dots[1]?.filled).toBe(false);
  });

  it('fills multiple dots for focus + break', () => {
    const sessions = [makeSession('focus'), makeSession('break')];
    const result = getCycleStatus(sessions, 4);
    expect(result.dots[0]?.filled).toBe(true);
    expect(result.dots[1]?.filled).toBe(true);
    expect(result.dots[2]?.filled).toBe(false);
  });

  it('determines next mode correctly', () => {
    // No sessions: next is focus
    expect(getCycleStatus([], 4).nextMode).toBe('focus');

    // After 1 focus: next is break
    expect(getCycleStatus([makeSession('focus')], 4).nextMode).toBe('break');

    // After focus+break: next is focus
    expect(
      getCycleStatus([makeSession('focus'), makeSession('break')], 4).nextMode,
    ).toBe('focus');
  });

  it('suggests long_break after last focus in cycle', () => {
    // After 4 focus + 3 break (positions 0-6), the 7th item (position 6) is the 4th focus
    // After 3 focus + 3 break = 6 sessions, position 6 -> next is focus (the last one)
    // After that focus completes: 4 focus + 3 break = 7, which is a full cycle
    const sessions = [
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
    ];
    const result = getCycleStatus(sessions, 4);
    // Position 6 is even -> next is focus
    expect(result.nextMode).toBe('focus');
    expect(result.currentPosition).toBe(6);
  });

  it('detects long_break when at position after last break before final focus', () => {
    // With 4 cycles: positions 0-6
    // Position 5 (odd) = break position, focusInCycle = ceil((5+1)/2) = 3 < 4
    // So next is 'break', not 'long_break'
    // Position 5 with 3 focus sessions completed:
    const sessions = [
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
    ];
    const result = getCycleStatus(sessions, 4);
    expect(result.currentPosition).toBe(5);
    // focusInCycle = ceil((5+1)/2) = 3, cycleCount = 4, 3 < 4 => 'break'
    expect(result.nextMode).toBe('break');
  });

  it('advances cycle after full completion', () => {
    // 4 focus + 3 break = 7 sessions = 1 full cycle
    const sessions = [
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
    ];
    const result = getCycleStatus(sessions, 4);
    expect(result.cycleNumber).toBe(2);
    expect(result.currentPosition).toBe(0);
  });

  it('tracks position correctly in second cycle', () => {
    // 7 (full cycle) + 2 (focus+break in second)
    const sessions = [
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      makeSession('break'),
      makeSession('focus'),
      // Second cycle:
      makeSession('focus'),
      makeSession('break'),
    ];
    const result = getCycleStatus(sessions, 4);
    expect(result.cycleNumber).toBe(2);
    expect(result.currentPosition).toBe(2);
  });

  it('ignores abandoned sessions', () => {
    const sessions = [
      makeSession('focus', { status: 'abandoned' }),
    ];
    const result = getCycleStatus(sessions, 4);
    expect(result.currentPosition).toBe(0);
  });

  it('ignores soft-deleted sessions', () => {
    const sessions = [
      makeSession('focus', { deletedAt: '2026-04-08T12:00:00Z' }),
    ];
    const result = getCycleStatus(sessions, 4);
    expect(result.currentPosition).toBe(0);
  });

  it('counts long_break sessions as breaks', () => {
    const sessions = [
      makeSession('focus'),
      makeSession('long_break'),
    ];
    const result = getCycleStatus(sessions, 4);
    expect(result.currentPosition).toBe(2);
  });

  it('dot positions are sequential', () => {
    const result = getCycleStatus([], 4);
    result.dots.forEach((dot, i) => {
      expect(dot.position).toBe(i);
    });
  });
});
