import { kv } from '@vercel/kv';
import { createLogger } from '../lib/logger';

const logger = createLogger('kv-client');

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

/**
 * Vercel KV client wrapper with retry logic.
 * PRD Section 18: All KV operations go through this wrapper.
 */

type KVValue = string | number | boolean | null | Record<string, unknown> | unknown[];

async function withRetry<T>(
  operation: string,
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        logger.error(`KV ${operation} failed after ${retries + 1} attempts`, { error });
        throw error;
      }
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
      logger.warn(`KV ${operation} attempt ${attempt + 1} failed, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

export const kvClient = {
  async get<T = KVValue>(key: string): Promise<T | null> {
    return withRetry(`GET ${key}`, () => kv.get<T>(key));
  },

  async set(key: string, value: KVValue, options?: { ex?: number; px?: number; nx?: boolean }): Promise<void> {
    await withRetry(`SET ${key}`, () => kv.set(key, value, options ?? {}));
  },

  async del(...keys: string[]): Promise<void> {
    await withRetry(`DEL ${keys.join(',')}`, () => kv.del(...keys));
  },

  async exists(...keys: string[]): Promise<number> {
    return withRetry(`EXISTS ${keys.join(',')}`, () => kv.exists(...keys));
  },

  async incr(key: string): Promise<number> {
    return withRetry(`INCR ${key}`, () => kv.incr(key));
  },

  async decr(key: string): Promise<number> {
    return withRetry(`DECR ${key}`, () => kv.decr(key));
  },

  async hget<T = KVValue>(key: string, field: string): Promise<T | null> {
    return withRetry(`HGET ${key}:${field}`, () => kv.hget<T>(key, field));
  },

  async hset(key: string, data: Record<string, KVValue>): Promise<void> {
    await withRetry(`HSET ${key}`, () => kv.hset(key, data));
  },

  async hgetall<T = Record<string, KVValue>>(key: string): Promise<T | null> {
    return withRetry(`HGETALL ${key}`, () => kv.hgetall<T>(key));
  },

  async hdel(key: string, ...fields: string[]): Promise<void> {
    await withRetry(`HDEL ${key}`, () => kv.hdel(key, ...fields));
  },

  async lpush(key: string, ...values: KVValue[]): Promise<number> {
    return withRetry(`LPUSH ${key}`, () => kv.lpush(key, ...values));
  },

  async lrange<T = KVValue>(key: string, start: number, stop: number): Promise<T[]> {
    return withRetry(`LRANGE ${key}`, () => kv.lrange<T>(key, start, stop));
  },

  async llen(key: string): Promise<number> {
    return withRetry(`LLEN ${key}`, () => kv.llen(key));
  },

  async sadd(key: string, ...members: KVValue[]): Promise<number> {
    return withRetry(`SADD ${key}`, () => kv.sadd(key, ...members));
  },

  async srem(key: string, ...members: KVValue[]): Promise<number> {
    return withRetry(`SREM ${key}`, () => kv.srem(key, ...members));
  },

  async smembers<T = string>(key: string): Promise<T[]> {
    return withRetry(`SMEMBERS ${key}`, () => kv.smembers<T>(key));
  },

  async sismember(key: string, member: KVValue): Promise<number> {
    return withRetry(`SISMEMBER ${key}`, () => kv.sismember(key, member as string));
  },

  async expire(key: string, seconds: number): Promise<void> {
    await withRetry(`EXPIRE ${key}`, () => kv.expire(key, seconds));
  },

  async keys(pattern: string): Promise<string[]> {
    return withRetry(`KEYS ${pattern}`, () => kv.keys(pattern));
  },

  async scan(cursor: number, options?: { match?: string; count?: number }): Promise<[number, string[]]> {
    return withRetry(`SCAN`, () => kv.scan(cursor, options));
  },
};

/**
 * KV key generators. PRD Section 18.
 * No raw string KV keys anywhere in code.
 */
export const keys = {
  user: (userId: string) => `user:${userId}`,
  session: (userId: string, sessionId: string) => `session:${userId}:${sessionId}`,
  sessionList: (userId: string) => `sessions:${userId}`,
  timer: (userId: string) => `timer:${userId}`,
  tos: (userId: string) => `tos:${userId}`,
  authSession: (token: string) => `auth:session:${token}`,
  settings: (userId: string) => `settings:${userId}`,
  feedback: (feedbackId: string) => `feedback:${feedbackId}`,
  feedbackList: () => `feedback:all`,
  audit: (auditId: string) => `audit:${auditId}`,
  auditList: () => `audit:all`,
  intentHistory: (userId: string) => `intent_history:${userId}`,
  betaConfig: () => `beta:config`,
  betaInvite: (email: string) => `beta:invites:${email}`,
  betaAllowlist: () => `beta:allowlist`,
  betaUserCount: () => `beta:user_count`,
  dailyAggregation: (userId: string, date: string) => `agg:daily:${userId}:${date}`,
  streakFreeze: (userId: string, month: string) => `streak:freeze:${userId}:${month}`,
  adminList: () => `bm:admins`,
};
