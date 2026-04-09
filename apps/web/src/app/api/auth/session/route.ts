import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';

/**
 * Session validation endpoint. PRD Section 1.2.2.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('bm_sid')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = await authService.validateSession(token);

  if (!session) {
    const response = NextResponse.json(
      { authenticated: false, message: 'Your session has expired. Please sign in again.' },
      { status: 401 },
    );
    response.cookies.delete('bm_sid');
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
