import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockKvClient, resetMockKV } from '@/__tests__/mocks/kv.mock';
import type { SessionRecord } from '@becoming/shared';

vi.mock('@/repositories/kv.client', () => ({
  kvClient: mockKvClient,
  keys: {
    session: (userId: string, sessionId: string) => `session:${userId}:${sessionId}`,
    sessionList: (userId: string) => `sessions:${userId}`,
    settings: (userId: string) => `settings:${userId}`,
  },
}));

// Must import after mock registration
const { sessionService } = await import('@/services/session.service');

const USER_ID = 'test-user-123';

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  const id = overrides.id ?? `sess-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    userId: USER_ID,
    date: '2026-04-07',
    startedAt: '2026-04-07T10:00:00.000Z',
    completedAt: '2026-04-07T10:25:00.000Z',
    mode: 'focus',
    configuredDuration: 1500,
    actualDuration: 1500,
    overtimeDuration: 0,
    intent: null,
    category: 'General',
    status: 'completed',
    notes: null,
    deviceId: 'device-1',
    deletedAt: null,
    ...overrides,
  };
}

async function seedSession(session: SessionRecord): Promise<void> {
  const key = `session:${session.userId}:${session.id}`;
  const listKey = `sessions:${session.userId}`;
  await mockKvClient.set(key, session);
  await mockKvClient.lpush(listKey, session.id);
}

describe('sessionService integration', () => {
  beforeEach(() => {
    resetMockKV();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // getSessions
  // ---------------------------------------------------------------

  it('getSessions returns empty for new user', async () => {
    const result = await sessionService.getSessions(USER_ID);
    expect(result.sessions).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('getSessions filters by type (focus)', async () => {
    await seedSession(makeSession({ id: 's1', mode: 'focus' }));
    await seedSession(makeSession({ id: 's2', mode: 'break' }));
    await seedSession(makeSession({ id: 's3', mode: 'long_break' }));

    const result = await sessionService.getSessions(USER_ID, { type: 'focus' });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]!.mode).toBe('focus');
  });

  it('getSessions filters by type (break)', async () => {
    await seedSession(makeSession({ id: 's1', mode: 'focus' }));
    await seedSession(makeSession({ id: 's2', mode: 'break' }));

    const result = await sessionService.getSessions(USER_ID, { type: 'break' });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]!.id).toBe('s2');
  });

  it('getSessions filters by type (long_break)', async () => {
    await seedSession(makeSession({ id: 's1', mode: 'focus' }));
    await seedSession(makeSession({ id: 's2', mode: 'long_break' }));

    const result = await sessionService.getSessions(USER_ID, { type: 'long_break' });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]!.id).toBe('s2');
  });

  it('getSessions type=all returns everything', async () => {
    await seedSession(makeSession({ id: 's1', mode: 'focus' }));
    await seedSession(makeSession({ id: 's2', mode: 'break' }));

    const result = await sessionService.getSessions(USER_ID, { type: 'all' });
    expect(result.sessions).toHaveLength(2);
  });

  it('getSessions filters by date range', async () => {
    await seedSession(makeSession({ id: 's1', date: '2026-04-01', startedAt: '2026-04-01T10:00:00Z' }));
    await seedSession(makeSession({ id: 's2', date: '2026-04-05', startedAt: '2026-04-05T10:00:00Z' }));
    await seedSession(makeSession({ id: 's3', date: '2026-04-10', startedAt: '2026-04-10T10:00:00Z' }));

    const result = await sessionService.getSessions(USER_ID, {
      dateFrom: '2026-04-03',
      dateTo: '2026-04-07',
    });
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]!.id).toBe('s2');
  });

  it('getSessions filters by category', async () => {
    await seedSession(makeSession({ id: 's1', category: 'Work' }));
    await seedSession(makeSession({ id: 's2', category: 'Study' }));
    await seedSession(makeSession({ id: 's3', category: 'Work' }));

    const result = await sessionService.getSessions(USER_ID, { categories: ['Work'] });
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions.every((s) => s.category === 'Work')).toBe(true);
  });

  it('getSessions search by intent', async () => {
    await seedSession(makeSession({ id: 's1', intent: 'Write unit tests' }));
    await seedSession(makeSession({ id: 's2', intent: 'Read documentation' }));
    await seedSession(makeSession({ id: 's3', intent: 'Write integration tests' }));

    const result = await sessionService.getSessions(USER_ID, { search: 'write' });
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions.every((s) => s.intent!.toLowerCase().includes('write'))).toBe(true);
  });

  it('getSessions excludes abandoned by default, includes with showAbandoned', async () => {
    await seedSession(makeSession({ id: 's1', status: 'completed' }));
    await seedSession(makeSession({ id: 's2', status: 'abandoned', abandonReason: 'skip' }));

    const withoutAbandoned = await sessionService.getSessions(USER_ID);
    expect(withoutAbandoned.sessions).toHaveLength(1);
    expect(withoutAbandoned.sessions[0]!.id).toBe('s1');

    const withAbandoned = await sessionService.getSessions(USER_ID, { showAbandoned: true });
    expect(withAbandoned.sessions).toHaveLength(2);
  });

  it('getSessions excludes soft-deleted sessions', async () => {
    await seedSession(makeSession({ id: 's1' }));
    await seedSession(makeSession({ id: 's2', deletedAt: '2026-04-06T00:00:00Z' }));

    const result = await sessionService.getSessions(USER_ID);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0]!.id).toBe('s1');
  });

  it('getSessions sorts newest first', async () => {
    await seedSession(makeSession({ id: 'old', startedAt: '2026-04-01T08:00:00Z' }));
    await seedSession(makeSession({ id: 'mid', startedAt: '2026-04-05T08:00:00Z' }));
    await seedSession(makeSession({ id: 'new', startedAt: '2026-04-07T08:00:00Z' }));

    const result = await sessionService.getSessions(USER_ID);
    expect(result.sessions.map((s) => s.id)).toEqual(['new', 'mid', 'old']);
  });

  it('getSessions pagination (offset/limit)', async () => {
    for (let i = 0; i < 10; i++) {
      await seedSession(
        makeSession({
          id: `s${String(i).padStart(2, '0')}`,
          startedAt: `2026-04-07T${String(i + 10).padStart(2, '0')}:00:00Z`,
        }),
      );
    }

    const page1 = await sessionService.getSessions(USER_ID, { offset: 0, limit: 3 });
    expect(page1.sessions).toHaveLength(3);
    expect(page1.total).toBe(10);

    const page2 = await sessionService.getSessions(USER_ID, { offset: 3, limit: 3 });
    expect(page2.sessions).toHaveLength(3);
    expect(page2.total).toBe(10);

    // No overlap between pages
    const page1Ids = page1.sessions.map((s) => s.id);
    const page2Ids = page2.sessions.map((s) => s.id);
    expect(page1Ids.some((id) => page2Ids.includes(id))).toBe(false);
  });

  // ---------------------------------------------------------------
  // getTodaySessions
  // ---------------------------------------------------------------

  it('getTodaySessions returns only today\'s completed sessions', async () => {
    // Seed default settings so settingsRepo.get returns valid defaults
    const settingsKey = `settings:${USER_ID}`;
    await mockKvClient.set(settingsKey, {
      dayResetTime: '00:00',
      dayResetTimezone: 'UTC',
    });

    const today = new Date().toISOString().split('T')[0];
    await seedSession(makeSession({ id: 'today-done', date: today, status: 'completed' }));
    await seedSession(makeSession({ id: 'today-abandoned', date: today, status: 'abandoned' }));
    await seedSession(makeSession({ id: 'yesterday', date: '2020-01-01', status: 'completed' }));
    await seedSession(makeSession({ id: 'today-deleted', date: today, status: 'completed', deletedAt: '2026-04-07T00:00:00Z' }));

    const result = await sessionService.getTodaySessions(USER_ID);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('today-done');
  });

  // ---------------------------------------------------------------
  // getAllTimeStats
  // ---------------------------------------------------------------

  it('getAllTimeStats calculates correct totals', async () => {
    // 25 min focus = 1500s
    await seedSession(makeSession({ id: 's1', mode: 'focus', actualDuration: 1500 }));
    // 50 min focus = 3000s
    await seedSession(makeSession({ id: 's2', mode: 'focus', actualDuration: 3000 }));
    // 5 min break = 300s
    await seedSession(makeSession({ id: 's3', mode: 'break', actualDuration: 300 }));
    // 15 min long_break = 900s
    await seedSession(makeSession({ id: 's4', mode: 'long_break', actualDuration: 900 }));
    // Abandoned: should be excluded
    await seedSession(makeSession({ id: 's5', mode: 'focus', actualDuration: 600, status: 'abandoned' }));
    // Deleted: should be excluded
    await seedSession(makeSession({ id: 's6', mode: 'focus', actualDuration: 600, deletedAt: '2026-04-01T00:00:00Z' }));

    const stats = await sessionService.getAllTimeStats(USER_ID);
    expect(stats.totalSessions).toBe(4);
    expect(stats.totalFocusMinutes).toBe(75); // (1500+3000)/60
    expect(stats.totalBreakMinutes).toBe(20); // (300+900)/60
  });

  // ---------------------------------------------------------------
  // updateSession
  // ---------------------------------------------------------------

  it('updateSession changes intent/category/notes only', async () => {
    const original = makeSession({ id: 'upd1', intent: 'Old intent', category: 'General', notes: null });
    await seedSession(original);

    const updated = await sessionService.updateSession(USER_ID, 'upd1', {
      intent: 'New intent',
      category: 'Work',
      notes: 'Some notes',
    });

    expect(updated.intent).toBe('New intent');
    expect(updated.category).toBe('Work');
    expect(updated.notes).toBe('Some notes');
    // Immutable fields should be unchanged
    expect(updated.mode).toBe(original.mode);
    expect(updated.actualDuration).toBe(original.actualDuration);
    expect(updated.startedAt).toBe(original.startedAt);
  });

  it('updateSession throws for non-existent session', async () => {
    await expect(
      sessionService.updateSession(USER_ID, 'nonexistent', { intent: 'Test' }),
    ).rejects.toThrow('Session not found');
  });

  // ---------------------------------------------------------------
  // deleteSession
  // ---------------------------------------------------------------

  it('deleteSession soft deletes (sets deletedAt)', async () => {
    await seedSession(makeSession({ id: 'del1' }));

    await sessionService.deleteSession(USER_ID, 'del1');

    // After soft delete the session should have a deletedAt timestamp
    const raw = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:del1`);
    expect(raw).not.toBeNull();
    expect(raw!.deletedAt).not.toBeNull();
    expect(typeof raw!.deletedAt).toBe('string');
  });

  // ---------------------------------------------------------------
  // bulkDelete
  // ---------------------------------------------------------------

  it('bulkDelete deletes multiple sessions', async () => {
    await seedSession(makeSession({ id: 'bd1' }));
    await seedSession(makeSession({ id: 'bd2' }));
    await seedSession(makeSession({ id: 'bd3' }));

    const result = await sessionService.bulkDelete(USER_ID, ['bd1', 'bd2']);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toHaveLength(0);

    const s1 = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:bd1`);
    const s2 = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:bd2`);
    const s3 = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:bd3`);

    expect(s1!.deletedAt).not.toBeNull();
    expect(s2!.deletedAt).not.toBeNull();
    expect(s3!.deletedAt).toBeNull();
  });

  // ---------------------------------------------------------------
  // bulkChangeCategory
  // ---------------------------------------------------------------

  it('bulkChangeCategory changes category on multiple sessions', async () => {
    await seedSession(makeSession({ id: 'bc1', category: 'General' }));
    await seedSession(makeSession({ id: 'bc2', category: 'General' }));
    await seedSession(makeSession({ id: 'bc3', category: 'Study' }));

    const result = await sessionService.bulkChangeCategory(USER_ID, ['bc1', 'bc2'], 'Work');
    expect(result.succeeded).toBe(2);
    expect(result.failed).toHaveLength(0);

    const s1 = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:bc1`);
    const s2 = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:bc2`);
    const s3 = await mockKvClient.get<SessionRecord>(`session:${USER_ID}:bc3`);

    expect(s1!.category).toBe('Work');
    expect(s2!.category).toBe('Work');
    expect(s3!.category).toBe('Study');
  });

  // ---------------------------------------------------------------
  // exportToCsv
  // ---------------------------------------------------------------

  it('exportToCsv generates valid CSV with UTF-8 BOM and proper escaping', () => {
    const sessions: SessionRecord[] = [
      makeSession({
        id: 'csv1',
        date: '2026-04-07',
        startedAt: '2026-04-07T10:00:00.000Z',
        mode: 'focus',
        actualDuration: 1500,
        overtimeDuration: 60,
        intent: 'Write "tests", please',
        category: 'Work',
        status: 'completed',
      }),
      makeSession({
        id: 'csv2',
        date: '2026-04-07',
        startedAt: '2026-04-07T11:00:00.000Z',
        mode: 'break',
        actualDuration: 300,
        overtimeDuration: 0,
        intent: null,
        category: 'General',
        status: 'completed',
        notes: 'Line1\nLine2',
      }),
    ];

    const csv = sessionService.exportToCsv(sessions, {
      includeIntent: true,
      includeCategory: true,
      includeNotes: true,
      includeOvertime: true,
    });

    // Starts with UTF-8 BOM
    expect(csv.charCodeAt(0)).toBe(0xfeff);

    const lines = csv.slice(1).split('\r\n');

    // Header row
    expect(lines[0]).toContain('Date');
    expect(lines[0]).toContain('Intent');
    expect(lines[0]).toContain('Category');
    expect(lines[0]).toContain('Overtime (min)');
    expect(lines[0]).toContain('Notes');

    // Row 1: intent with commas and quotes should be escaped
    expect(lines[1]).toContain('"Write ""tests"", please"');

    // Row 2: notes with newline should be escaped
    expect(lines[2]).toContain('"Line1\nLine2"');

    // Correct number of data rows
    expect(lines.length).toBe(3); // header + 2 data rows
  });

  it('exportToCsv omits optional columns when disabled', () => {
    const sessions = [makeSession({ id: 'csv3' })];
    const csv = sessionService.exportToCsv(sessions, {
      includeIntent: false,
      includeCategory: false,
      includeNotes: false,
      includeDevice: false,
      includeOvertime: false,
    });

    const header = csv.slice(1).split('\r\n')[0]!;
    expect(header).not.toContain('Intent');
    expect(header).not.toContain('Category');
    expect(header).not.toContain('Notes');
    expect(header).not.toContain('Device');
    expect(header).not.toContain('Overtime');
  });
});
