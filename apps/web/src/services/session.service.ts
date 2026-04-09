import { sessionRepo } from '../repositories/session.repo';
import { settingsRepo } from '../repositories/settings.repo';
import type { SessionRecord, TimerMode } from '@becoming/shared';
import { getCurrentDay } from '@becoming/shared';
/**
 * Session service. PRD Section 8.
 * Handles session queries, filtering, export, and bulk operations.
 */
export const sessionService = {
  /**
   * Get sessions for a user with filters.
   * PRD Section 8.1: Filters are AND together.
   */
  async getSessions(
    userId: string,
    filters?: {
      type?: TimerMode | 'all';
      dateFrom?: string;
      dateTo?: string;
      categories?: string[];
      search?: string;
      showAbandoned?: boolean;
      offset?: number;
      limit?: number;
    },
  ): Promise<{ sessions: SessionRecord[]; total: number }> {
    const allSessions = await sessionRepo.findByUser(userId, {
      offset: 0,
      limit: 10000,
    });

    let filtered = allSessions.filter((s) => s.deletedAt === null);

    // PRD Section 8: Only completed sessions by default
    if (!filters?.showAbandoned) {
      filtered = filtered.filter((s) => s.status === 'completed');
    }

    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter((s) => s.mode === filters.type);
    }

    if (filters?.dateFrom) {
      filtered = filtered.filter((s) => s.date >= filters.dateFrom!);
    }

    if (filters?.dateTo) {
      filtered = filtered.filter((s) => s.date <= filters.dateTo!);
    }

    if (filters?.categories && filters.categories.length > 0) {
      filtered = filtered.filter((s) => filters.categories!.includes(s.category));
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (s) => s.intent?.toLowerCase().includes(searchLower) ?? false,
      );
    }

    // Sort newest first (PRD 8.4)
    filtered.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    const total = filtered.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    const paginated = filtered.slice(offset, offset + limit);

    return { sessions: paginated, total };
  },

  /**
   * Get sessions for today based on Day Reset Time.
   * PRD Section 5.2.2: Session day = when it STARTED.
   */
  async getTodaySessions(userId: string): Promise<SessionRecord[]> {
    const settings = await settingsRepo.get(userId);
    const today = getCurrentDay(settings.dayResetTime, settings.dayResetTimezone);

    const allSessions = await sessionRepo.findByUser(userId, { offset: 0, limit: 10000 });
    return allSessions.filter(
      (s) => s.date === today && s.status === 'completed' && s.deletedAt === null,
    );
  },

  /**
   * Get all-time stats for a user.
   */
  async getAllTimeStats(userId: string): Promise<{
    totalSessions: number;
    totalFocusMinutes: number;
    totalBreakMinutes: number;
  }> {
    const allSessions = await sessionRepo.findByUser(userId, { offset: 0, limit: 10000 });
    const completed = allSessions.filter((s) => s.status === 'completed' && s.deletedAt === null);

    let totalFocusMinutes = 0;
    let totalBreakMinutes = 0;

    for (const session of completed) {
      const minutes = session.actualDuration / 60;
      if (session.mode === 'focus') {
        totalFocusMinutes += minutes;
      } else {
        totalBreakMinutes += minutes;
      }
    }

    return {
      totalSessions: completed.length,
      totalFocusMinutes: Math.round(totalFocusMinutes),
      totalBreakMinutes: Math.round(totalBreakMinutes),
    };
  },

  /**
   * Update session (intent, category, notes only). PRD Section 8.
   * Sessions are immutable except these fields.
   */
  async updateSession(
    userId: string,
    sessionId: string,
    data: { intent?: string; category?: string; notes?: string },
  ): Promise<SessionRecord> {
    const session = await sessionRepo.findById(userId, sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const updates: Partial<SessionRecord> = {};
    if (data.intent !== undefined) updates.intent = data.intent;
    if (data.category !== undefined) updates.category = data.category;
    if (data.notes !== undefined) updates.notes = data.notes;

    await sessionRepo.update(userId, sessionId, updates);
    return { ...session, ...updates };
  },

  /**
   * Delete session (soft delete). PRD Section 8.
   */
  async deleteSession(userId: string, sessionId: string): Promise<void> {
    await sessionRepo.softDelete(userId, sessionId);
  },

  /**
   * Bulk delete sessions.
   */
  async bulkDelete(userId: string, sessionIds: string[]): Promise<number> {
    let count = 0;
    for (const id of sessionIds) {
      await sessionRepo.softDelete(userId, id);
      count++;
    }
    return count;
  },

  /**
   * Bulk change category.
   */
  async bulkChangeCategory(userId: string, sessionIds: string[], newCategory: string): Promise<number> {
    let count = 0;
    for (const id of sessionIds) {
      await sessionRepo.update(userId, id, { category: newCategory });
      count++;
    }
    return count;
  },

  /**
   * Export sessions as CSV. PRD Section 9.2.
   * RFC 4180, UTF-8 BOM, timezone-aware.
   */
  exportToCsv(
    sessions: SessionRecord[],
    options?: {
      includeIntent?: boolean;
      includeCategory?: boolean;
      includeNotes?: boolean;
      includeDevice?: boolean;
      includeOvertime?: boolean;
    },
  ): string {
    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    const headers = ['Date', 'Time', 'Type', 'Duration (min)', 'Status'];

    if (options?.includeIntent !== false) headers.push('Intent');
    if (options?.includeCategory !== false) headers.push('Category');
    if (options?.includeOvertime !== false) headers.push('Overtime (min)');
    if (options?.includeNotes) headers.push('Notes');
    if (options?.includeDevice) headers.push('Device');

    const rows = sessions.map((s) => {
      const row = [
        s.date,
        new Date(s.startedAt).toISOString().slice(11, 16),
        s.mode,
        (s.actualDuration / 60).toFixed(1),
        s.status,
      ];

      if (options?.includeIntent !== false) row.push(csvEscape(s.intent ?? ''));
      if (options?.includeCategory !== false) row.push(csvEscape(s.category));
      if (options?.includeOvertime !== false) row.push((s.overtimeDuration / 60).toFixed(1));
      if (options?.includeNotes) row.push(csvEscape(s.notes ?? ''));
      if (options?.includeDevice) row.push(s.deviceId);

      return row.join(',');
    });

    return bom + headers.join(',') + '\r\n' + rows.join('\r\n');
  },
};

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
