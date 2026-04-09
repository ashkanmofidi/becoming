import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { settingsRepo } from '@/repositories/settings.repo';
import type { UserSettings } from '@becoming/shared';

/**
 * Settings API. PRD Section 6.
 * GET: Fetch current settings
 * PUT: Save settings (auto-save from client with 500ms debounce)
 */
export async function GET(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const settings = await settingsRepo.get(result.session.userId);
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const body = await request.json();
  const settings = body.settings as UserSettings;

  if (!settings) {
    return NextResponse.json({ error: 'settings object required' }, { status: 400 });
  }

  await settingsRepo.save(result.session.userId, settings);
  return NextResponse.json({ success: true });
}
