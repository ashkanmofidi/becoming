import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import type { AuthSession, UserRole } from '@becoming/shared';
import { LIMITS } from '@becoming/shared';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-middleware');

/**
 * API middleware utilities. PRD Section 17.
 * Auth check, role check, rate limiting on every endpoint.
 */

/** Rate limiter storage (per-instance, cleaned periodically) */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60_000);

/**
 * Authenticate request and return session.
 */
export async function authenticate(request: NextRequest): Promise<AuthSession | null> {
  const token = request.cookies.get('bm_sid')?.value;
  if (!token) return null;
  return authService.validateSession(token);
}

/**
 * Require authentication. Returns 401 if not authenticated.
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ session: AuthSession } | NextResponse> {
  const session = await authenticate(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Your session has expired. Please sign in again.' },
      { status: 401 },
    );
  }
  return { session };
}

/**
 * Require specific role. Returns 403 if insufficient.
 * PRD Section 10.1: Server-side role checks on every admin API request.
 */
export async function requireRole(
  request: NextRequest,
  ...roles: UserRole[]
): Promise<{ session: AuthSession } | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (!roles.includes(result.session.role)) {
    logger.warn('Unauthorized role access attempt', {
      userId: result.session.userId,
      role: result.session.role,
      requiredRoles: roles,
      path: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "You don't have access to this resource." },
      { status: 403 },
    );
  }

  return result;
}

/**
 * Rate limit by IP. PRD Section 17.
 */
export function rateLimit(
  request: NextRequest,
  limitPerMinute: number = LIMITS.GENERAL_API_RATE_LIMIT_PER_MINUTE,
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  entry.count++;
  if (entry.count > limitPerMinute) {
    return NextResponse.json(
      { error: "You're doing that too quickly. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  return null;
}

/**
 * P2-7: Reject requests exceeding payload size limit.
 * Add this check at the start of POST/PUT/PATCH/DELETE handlers.
 */
export function checkPayloadSize(request: NextRequest, maxBytes = 1_048_576): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxBytes) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }
  return null;
}

/**
 * Get client IP for audit logging.
 */
export function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
}
