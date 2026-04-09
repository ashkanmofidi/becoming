import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth.service';
import { tosService } from '@/services/tos.service';

/**
 * TOS acceptance endpoint. PRD Section 1.3.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('bm_sid')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await authService.validateSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const status = await tosService.needsAcceptance(session.userId);
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('bm_sid')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await authService.validateSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }

  const body = await request.json();
  if (!body.accepted) {
    return NextResponse.json({ error: 'TOS must be accepted' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await tosService.accept(session.userId, session.email, ip, userAgent);

  return NextResponse.json({ success: true });
}
