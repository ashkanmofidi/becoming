import { NextRequest, NextResponse } from 'next/server';
import { requireRole, rateLimit } from '@/app/api/middleware';
import { adminService } from '@/services/admin.service';
import { LIMITS } from '@becoming/shared';

/**
 * Admin API. PRD Section 10.
 * All endpoints require admin or super_admin role.
 * Rate limited: 60/min (PRD 17).
 */
export async function GET(request: NextRequest) {
  const rateLimited = rateLimit(request, LIMITS.ADMIN_API_RATE_LIMIT_PER_MINUTE);
  if (rateLimited) return rateLimited;

  const result = await requireRole(request, 'admin', 'super_admin');
  if (result instanceof NextResponse) return result;

  const { searchParams } = request.nextUrl;
  const view = searchParams.get('view') ?? 'pulse';

  try {
  switch (view) {
    case 'pulse':
      return NextResponse.json(await adminService.getPulseData());
    case 'users':
      return NextResponse.json({ users: await adminService.getUsers() });
    case 'feedback':
      return NextResponse.json({ feedback: await adminService.getFeedback() });
    case 'audit':
      return NextResponse.json({ entries: await adminService.getAuditLog() });
    case 'beta':
      return NextResponse.json(await adminService.getBetaConfig());
    default:
      return NextResponse.json({ error: 'Unknown view' }, { status: 400 });
  }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : '';
    // Surface the actual error for debugging — remove after fix
    return NextResponse.json(
      { error: 'Admin API error', message, stack: stack?.split('\n').slice(0, 5) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request, LIMITS.ADMIN_API_RATE_LIMIT_PER_MINUTE);
  if (rateLimited) return rateLimited;

  const result = await requireRole(request, 'super_admin');
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'changeRole': {
      await adminService.changeRole(
        result.session.userId,
        result.session.email,
        body.targetUserId,
        body.newRole,
      );
      return NextResponse.json({ success: true });
    }
    case 'updateFeedbackStatus': {
      await adminService.updateFeedbackStatus(
        body.feedbackId,
        body.status,
        result.session.userId,
        result.session.email,
      );
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
