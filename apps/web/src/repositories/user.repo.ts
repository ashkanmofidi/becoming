import { kvClient, keys } from './kv.client';
import type { User, BetaConfig } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('user-repo');

/**
 * User repository. PRD Section 1.2, 18.
 * KV key: user:{sub}
 */
export const userRepo = {
  async findById(userId: string): Promise<User | null> {
    return kvClient.get<User>(keys.user(userId));
  },

  async create(user: User): Promise<void> {
    await kvClient.set(keys.user(user.id), user as unknown as Record<string, unknown>);
    logger.info('User created', { userId: user.id, email: user.email });
  },

  async update(userId: string, data: Partial<User>): Promise<void> {
    const existing = await this.findById(userId);
    if (!existing) {
      throw new Error(`User ${userId} not found`);
    }
    const updated = { ...existing, ...data };
    await kvClient.set(keys.user(userId), updated as unknown as Record<string, unknown>);
  },

  async delete(userId: string): Promise<void> {
    await kvClient.del(keys.user(userId));
    logger.info('User deleted', { userId });
  },

  async getBetaUserCount(): Promise<number> {
    const count = await kvClient.get<number>(keys.betaUserCount());
    return count ?? 0;
  },

  async incrementBetaUserCount(): Promise<number> {
    return kvClient.incr(keys.betaUserCount());
  },

  async decrementBetaUserCount(): Promise<number> {
    return kvClient.decr(keys.betaUserCount());
  },

  async isOnAllowlist(email: string): Promise<boolean> {
    const result = await kvClient.sismember(keys.betaAllowlist(), email);
    return result === 1;
  },

  async addToAllowlist(email: string): Promise<void> {
    await kvClient.sadd(keys.betaAllowlist(), email);
  },

  async removeFromAllowlist(email: string): Promise<void> {
    await kvClient.srem(keys.betaAllowlist(), email);
  },

  async getAllowlist(): Promise<string[]> {
    return kvClient.smembers(keys.betaAllowlist());
  },

  async getAdminEmails(): Promise<string[]> {
    return kvClient.smembers(keys.adminList());
  },

  async addAdmin(email: string): Promise<void> {
    await kvClient.sadd(keys.adminList(), email);
  },

  async removeAdmin(email: string): Promise<void> {
    await kvClient.srem(keys.adminList(), email);
  },
};
