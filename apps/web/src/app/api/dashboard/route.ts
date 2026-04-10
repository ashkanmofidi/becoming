import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { dashboardService } from '@/services/dashboard.service';

/**
 * Dashboard API. PRD Section 7.
 * Server-side computation. 30s cache.
 */
export async function GET(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  try {
    const data = await dashboardService.getDashboardData(result.session.userId);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('Dashboard API error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Failed to load dashboard data. Please try again.' },
      { status: 500 },
    );
  }
}
