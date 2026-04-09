import { vi } from 'vitest';

/**
 * In-memory mock of the Vercel KV store.
 * Provides the same interface as the real kvClient but stores data in a Map.
 * Reset between tests with resetMockKV().
 */

const store = new Map<string, unknown>();
const lists = new Map<string, unknown[]>();
const sets = new Map<string, Set<unknown>>();

export function resetMockKV(): void {
  store.clear();
  lists.clear();
  sets.clear();
}

export function getMockStore(): Map<string, unknown> {
  return store;
}

export const mockKvClient = {
  get: vi.fn(async <T>(key: string): Promise<T | null> => {
    return (store.get(key) as T) ?? null;
  }),

  set: vi.fn(async (key: string, value: unknown, _options?: { ex?: number }): Promise<void> => {
    store.set(key, value);
  }),

  del: vi.fn(async (...keys: string[]): Promise<void> => {
    for (const key of keys) {
      store.delete(key);
      lists.delete(key);
      sets.delete(key);
    }
  }),

  exists: vi.fn(async (...keys: string[]): Promise<number> => {
    return keys.filter((k) => store.has(k) || lists.has(k) || sets.has(k)).length;
  }),

  incr: vi.fn(async (key: string): Promise<number> => {
    const current = (store.get(key) as number) ?? 0;
    store.set(key, current + 1);
    return current + 1;
  }),

  decr: vi.fn(async (key: string): Promise<number> => {
    const current = (store.get(key) as number) ?? 0;
    store.set(key, current - 1);
    return current - 1;
  }),

  hget: vi.fn(async <T>(key: string, field: string): Promise<T | null> => {
    const hash = store.get(key) as Record<string, unknown> | undefined;
    return (hash?.[field] as T) ?? null;
  }),

  hset: vi.fn(async (key: string, data: Record<string, unknown>): Promise<void> => {
    const existing = (store.get(key) as Record<string, unknown>) ?? {};
    store.set(key, { ...existing, ...data });
  }),

  hgetall: vi.fn(async <T>(key: string): Promise<T | null> => {
    return (store.get(key) as T) ?? null;
  }),

  hdel: vi.fn(async (key: string, ...fields: string[]): Promise<void> => {
    const hash = store.get(key) as Record<string, unknown> | undefined;
    if (hash) {
      for (const f of fields) delete hash[f];
    }
  }),

  lpush: vi.fn(async (key: string, ...values: unknown[]): Promise<number> => {
    const list = lists.get(key) ?? [];
    list.unshift(...values);
    lists.set(key, list);
    return list.length;
  }),

  lrange: vi.fn(async <T>(key: string, start: number, stop: number): Promise<T[]> => {
    const list = lists.get(key) ?? [];
    const end = stop < 0 ? list.length : stop + 1;
    return list.slice(start, end) as T[];
  }),

  llen: vi.fn(async (key: string): Promise<number> => {
    return (lists.get(key) ?? []).length;
  }),

  sadd: vi.fn(async (key: string, ...members: unknown[]): Promise<number> => {
    const set = sets.get(key) ?? new Set();
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) { set.add(m); added++; }
    }
    sets.set(key, set);
    return added;
  }),

  srem: vi.fn(async (key: string, ...members: unknown[]): Promise<number> => {
    const set = sets.get(key) ?? new Set();
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }),

  smembers: vi.fn(async (key: string): Promise<string[]> => {
    const set = sets.get(key) ?? new Set();
    return [...set] as string[];
  }),

  sismember: vi.fn(async (key: string, member: unknown): Promise<number> => {
    const set = sets.get(key) ?? new Set();
    return set.has(member) ? 1 : 0;
  }),

  expire: vi.fn(async (): Promise<void> => {}),

  keys: vi.fn(async (pattern: string): Promise<string[]> => {
    const prefix = pattern.replace('*', '');
    const allKeys = [...store.keys(), ...lists.keys(), ...sets.keys()];
    return allKeys.filter((k) => k.startsWith(prefix));
  }),

  scan: vi.fn(async (): Promise<[string, string[]]> => {
    return ['0', [...store.keys()]];
  }),
};
