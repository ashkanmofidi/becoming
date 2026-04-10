import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { sessionService } from '@/services/session.service';
import type { TimerMode } from '@becoming/shared';

/**
 * Sessions API. PRD Section 8.
 * GET: List sessions with filters
 * PATCH: Update session (intent/category/notes)
 * DELETE: Soft delete session(s)
 */
export async function GET(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const { searchParams } = request.nextUrl;
  const typeParam = searchParams.get('type');
  const validTypes = ['focus', 'break', 'long_break', 'all'];
  const type = (typeParam && validTypes.includes(typeParam) ? typeParam : 'all') as TimerMode | 'all';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const categories = searchParams.get('categories')?.split(',').filter(Boolean);
  const search = searchParams.get('search');
  const showAbandoned = searchParams.get('showAbandoned') === 'true';
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50));
  const format = searchParams.get('format');

  const { sessions, total } = await sessionService.getSessions(
    result.session.userId,
    {
      type: type ?? 'all',
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
      categories,
      search: search ?? undefined,
      showAbandoned,
      offset,
      limit: format === 'csv' ? 10000 : limit,
    },
  );

  // CSV export (PRD 9.2)
  if (format === 'csv') {
    const csv = sessionService.exportToCsv(sessions, {
      includeIntent: searchParams.get('includeIntent') !== 'false',
      includeCategory: searchParams.get('includeCategory') !== 'false',
      includeNotes: searchParams.get('includeNotes') === 'true',
      includeDevice: searchParams.get('includeDevice') === 'true',
      includeOvertime: searchParams.get('includeOvertime') !== 'false',
    });

    const date = new Date().toISOString().slice(0, 16).replace(':', '');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="becoming_sessions_${date}.csv"`,
      },
    });
  }

  return NextResponse.json({ sessions, total, offset, limit });
}

export async function PATCH(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const { sessionId, intent, category, notes } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }
  if (intent !== undefined && intent !== null && (typeof intent !== 'string' || intent.length > 500)) {
    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 });
  }
  if (category !== undefined && (typeof category !== 'string' || category.length > 100)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }
  if (notes !== undefined && notes !== null && (typeof notes !== 'string' || notes.length > 5000)) {
    return NextResponse.json({ error: 'Invalid notes' }, { status: 400 });
  }

  const session = await sessionService.updateSession(
    result.session.userId,
    sessionId,
    { intent, category, notes },
  );

  return NextResponse.json({ session });
}

export async function DELETE(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const { sessionIds, clearAll } = body;

  // Clear ALL user data — nuclear option from Settings > Data Management
  if (clearAll === true) {
    const { sessionRepo } = await import('@/repositories/session.repo');
    const { settingsRepo } = await import('@/repositories/settings.repo');
    const { timerRepo } = await import('@/repositories/timer.repo');

    await sessionRepo.deleteAllForUser(result.session.userId);
    await settingsRepo.delete(result.session.userId);
    await timerRepo.clearState(result.session.userId);

    return NextResponse.json({ success: true, cleared: true });
  }

  if (!sessionIds || !Array.isArray(sessionIds)) {
    return NextResponse.json({ error: 'sessionIds array required' }, { status: 400 });
  }

  // Runtime validation (P2-1)
  if (sessionIds.length === 0) {
    return NextResponse.json({ error: 'sessionIds must not be empty' }, { status: 400 });
  }
  if (sessionIds.length > 100) {
    return NextResponse.json({ error: 'sessionIds must contain at most 100 items' }, { status: 400 });
  }
  if (!sessionIds.every((id: unknown) => typeof id === 'string' && id.length > 0)) {
    return NextResponse.json({ error: 'each sessionId must be a non-empty string' }, { status: 400 });
  }

  const { succeeded, failed } = await sessionService.bulkDelete(result.session.userId, sessionIds);
  return NextResponse.json({ deleted: succeeded, ...(failed.length > 0 ? { failed } : {}) });
}
