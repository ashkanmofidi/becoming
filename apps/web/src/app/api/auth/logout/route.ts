import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-logout');

/**
 * Logout endpoint. PRD Section 1.2.2, 3.3.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get('bm_sid')?.value;

  if (token) {
    try {
      await authService.destroySession(token);
    } catch (error) {
      // PRD: Logout API failure: cookie still cleared client-side
      logger.warn('Failed to destroy server session', { error: String(error) });
    }
  }

  const response = NextResponse.json({ success: true });

  // Clear cookie regardless of server-side success (PRD 1.2.2)
  response.cookies.set('bm_sid', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
