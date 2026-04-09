import { describe, it, expect } from 'vitest';
import {
  calculateElapsedSeconds,
  calculateRemainingSeconds,
  formatTimerDisplay,
} from './time';

describe('calculateElapsedSeconds', () => {
  it('calculates elapsed seconds between two timestamps', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const now = '2026-04-08T10:25:00.000Z';
    expect(calculateElapsedSeconds(start, now)).toBe(1500);
  });

  it('returns 0 for same timestamp', () => {
    const ts = '2026-04-08T10:00:00.000Z';
    expect(calculateElapsedSeconds(ts, ts)).toBe(0);
  });

  it('handles DST transition (UTC-based, immune to DST)', () => {
    // PRD 5.2.2: timer uses UTC timestamps
    const start = '2026-03-08T09:50:00.000Z'; // before DST
    const end = '2026-03-08T10:15:00.000Z'; // after DST in US
    expect(calculateElapsedSeconds(start, end)).toBe(1500);
  });

  it('handles sub-second precision (floors to whole seconds)', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const end = '2026-04-08T10:00:01.999Z';
    expect(calculateElapsedSeconds(start, end)).toBe(1);
  });

  it('handles large time spans (24 hours)', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const end = '2026-04-09T10:00:00.000Z';
    expect(calculateElapsedSeconds(start, end)).toBe(86400);
  });

  it('uses Date.now() when nowUtc is not provided', () => {
    const start = new Date(Date.now() - 10_000).toISOString();
    const elapsed = calculateElapsedSeconds(start);
    // Should be approximately 10 seconds (allow 2s tolerance)
    expect(elapsed).toBeGreaterThanOrEqual(9);
    expect(elapsed).toBeLessThanOrEqual(12);
  });
});

describe('calculateRemainingSeconds', () => {
  it('calculates remaining time using paused timestamp', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const remainingPaused = calculateRemainingSeconds(
      start,
      25,
      '2026-04-08T10:20:00.000Z',
    );
    expect(remainingPaused).toBe(300); // 5 minutes left
  });

  it('returns full duration when paused at start', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const remaining = calculateRemainingSeconds(start, 25, start);
    expect(remaining).toBe(1500);
  });

  it('returns 0 when time is up', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const remaining = calculateRemainingSeconds(
      start,
      25,
      '2026-04-08T10:25:00.000Z',
    );
    expect(remaining).toBe(0);
  });

  it('returns 0 when past the duration (overtime)', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const remaining = calculateRemainingSeconds(
      start,
      25,
      '2026-04-08T10:35:00.000Z',
    );
    expect(remaining).toBe(0); // clamped to 0
  });

  it('handles null pausedAt by using current time', () => {
    const start = new Date(Date.now() - 60_000).toISOString(); // 1 minute ago
    const remaining = calculateRemainingSeconds(start, 25, null);
    // Should be approximately 24 minutes (1440 seconds, allow tolerance)
    expect(remaining).toBeGreaterThanOrEqual(1438);
    expect(remaining).toBeLessThanOrEqual(1440);
  });

  it('handles 1-minute duration', () => {
    const start = '2026-04-08T10:00:00.000Z';
    const remaining = calculateRemainingSeconds(
      start,
      1,
      '2026-04-08T10:00:30.000Z',
    );
    expect(remaining).toBe(30);
  });
});

describe('formatTimerDisplay', () => {
  it('formats MM:SS with seconds', () => {
    expect(formatTimerDisplay(1500, true)).toBe('25:00');
    expect(formatTimerDisplay(90, true)).toBe('01:30');
    expect(formatTimerDisplay(5, true)).toBe('00:05');
    expect(formatTimerDisplay(0, true)).toBe('00:00');
  });

  it('formats MM:00 without seconds (shows only minutes)', () => {
    expect(formatTimerDisplay(1500, false)).toBe('25:00');
    expect(formatTimerDisplay(90, false)).toBe('01:00');
    expect(formatTimerDisplay(5, false)).toBe('00:00');
  });

  it('formats HH:MM:SS for times over 60 minutes', () => {
    // PRD 5.2.2: exceeding 60 minutes switches to HH:MM:SS
    expect(formatTimerDisplay(3661, true)).toBe('01:01:01');
    expect(formatTimerDisplay(7200, true)).toBe('02:00:00');
    expect(formatTimerDisplay(3600, true)).toBe('01:00:00');
  });

  it('formats HH:MM:SS without seconds for times over 60 minutes', () => {
    expect(formatTimerDisplay(3661, false)).toBe('01:01:01');
    expect(formatTimerDisplay(7200, false)).toBe('02:00:00');
  });

  it('handles negative (overtime) with + prefix', () => {
    expect(formatTimerDisplay(-134, true)).toBe('+02:14');
    expect(formatTimerDisplay(-3661, true)).toBe('+01:01:01');
  });

  it('handles negative zero', () => {
    expect(formatTimerDisplay(-0, true)).toBe('00:00');
  });

  it('handles exact boundary at 59:59 (not HH:MM:SS)', () => {
    expect(formatTimerDisplay(3599, true)).toBe('59:59');
  });

  it('handles exact boundary at 60:00 (HH:MM:SS)', () => {
    expect(formatTimerDisplay(3600, true)).toBe('01:00:00');
  });

  it('pads single-digit hours, minutes, and seconds', () => {
    expect(formatTimerDisplay(3661, true)).toBe('01:01:01');
    expect(formatTimerDisplay(1, true)).toBe('00:01');
  });
});
