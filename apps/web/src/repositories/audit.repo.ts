import { kvClient, keys } from './kv.client';
import type { AuditLogEntry, AuditAction } from '@becoming/shared';

/**
 * Audit log repository. PRD Section 10.10, 18.
 * Immutable, indefinite retention.
 * KV key: audit:{id}, audit:all (list)
 */
export const auditRepo = {
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };
    await kvClient.set(keys.audit(id), fullEntry as unknown as Record<string, unknown>);
    await kvClient.lpush(keys.auditList(), id);
    return id;
  },

  async findAll(options?: { offset?: number; limit?: number }): Promise<AuditLogEntry[]> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    const ids = await kvClient.lrange<string>(keys.auditList(), offset, offset + limit - 1);
    const entries: AuditLogEntry[] = [];
    for (const id of ids) {
      const entry = await kvClient.get<AuditLogEntry>(keys.audit(id));
      if (entry) entries.push(entry);
    }
    return entries;
  },

  async findByActor(actorId: string, limit = 50): Promise<AuditLogEntry[]> {
    const all = await this.findAll({ limit: 500 });
    return all.filter((e) => e.actorId === actorId).slice(0, limit);
  },

  async findByAction(action: AuditAction, limit = 50): Promise<AuditLogEntry[]> {
    const all = await this.findAll({ limit: 500 });
    return all.filter((e) => e.action === action).slice(0, limit);
  },

  async getCount(): Promise<number> {
    return kvClient.llen(keys.auditList());
  },
};
