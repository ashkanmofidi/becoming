import { kvClient, keys } from './kv.client';
import type { SessionRecord } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('session-repo');

/**
 * Session repository. PRD Section 8, 18.
 * KV key: session:{userId}:{id}, sessions:{userId} (list)
 */
export const sessionRepo = {
  async create(session: SessionRecord): Promise<void> {
    // Write session data first
    await kvClient.set(
      keys.session(session.userId, session.id),
      session as unknown as Record<string, unknown>,
    );
    // Add to user's session list — if this fails, clean up the orphaned key
    try {
      await kvClient.lpush(keys.sessionList(session.userId), session.id);
    } catch (err) {
      logger.error('Failed to add session to list, cleaning up orphaned key', {
        userId: session.userId, sessionId: session.id, error: err,
      });
      // Best-effort cleanup of the orphaned session key
      try { await kvClient.del(keys.session(session.userId, session.id)); } catch { /* silent */ }
      throw err; // Re-throw so caller knows creation failed
    }
    logger.info('Session created', { userId: session.userId, sessionId: session.id, mode: session.mode });
  },

  async findById(userId: string, sessionId: string): Promise<SessionRecord | null> {
    return kvClient.get<SessionRecord>(keys.session(userId, sessionId));
  },

  async findByUser(
    userId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<SessionRecord[]> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    const sessionIds = await kvClient.lrange<string>(
      keys.sessionList(userId),
      offset,
      offset + limit - 1,
    );

    const sessions: SessionRecord[] = [];
    for (const id of sessionIds) {
      const session = await kvClient.get<SessionRecord>(keys.session(userId, id));
      if (session) {
        sessions.push(session);
      }
    }
    return sessions;
  },

  async getSessionCount(userId: string): Promise<number> {
    return kvClient.llen(keys.sessionList(userId));
  },

  async update(userId: string, sessionId: string, data: Partial<SessionRecord>): Promise<void> {
    const existing = await this.findById(userId, sessionId);
    if (!existing) {
      throw new Error(`Session ${sessionId} not found for user ${userId}`);
    }
    const updated = { ...existing, ...data };
    await kvClient.set(keys.session(userId, sessionId), updated as unknown as Record<string, unknown>);
  },

  /** Soft delete with 30-day retention. PRD Section 8. */
  async softDelete(userId: string, sessionId: string): Promise<void> {
    await this.update(userId, sessionId, { deletedAt: new Date().toISOString() });
    logger.info('Session soft deleted', { userId, sessionId });
  },

  async deleteAllForUser(userId: string): Promise<void> {
    const sessionIds = await kvClient.lrange<string>(keys.sessionList(userId), 0, -1);
    const keysToDelete = sessionIds.map((id) => keys.session(userId, id));
    keysToDelete.push(keys.sessionList(userId));
    if (keysToDelete.length > 0) {
      await kvClient.del(...keysToDelete);
    }
    logger.info('All sessions deleted for user', { userId, count: sessionIds.length });
  },
};
