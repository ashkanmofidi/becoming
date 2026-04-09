import { createLogger } from './logger';

const logger = createLogger('rate-limiter');

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000);

/**
 * Sliding window rate limiter. PRD Section 17.
 * Returns true if request should be blocked.
 */
export function isRateLimited(
  identifier: string,
  maxRequests: number,
  windowMs: number = 60_000,
): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    logger.warn('Rate limit exceeded', { identifier, count: entry.timestamps.length, max: maxRequests });
    return true;
  }

  entry.timestamps.push(now);
  return false;
}
