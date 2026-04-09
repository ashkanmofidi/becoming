import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { settingsService } from '@/services/settings.service';
import type { UserSettings } from '@becoming/shared';

/**
 * Settings API. PRD Section 6.
 * GET: Fetch current settings
 * PUT: Save settings — MUST go through settingsService.saveSettings()
 *      which runs validateAndEnforce() (feature interactions, bounds clamping).
 *      BUG FIX: was calling settingsRepo.save() directly, bypassing validation.
 *      This caused minCountableSession to stay at 10 when focusDuration was set to 1,
 *      silently discarding all 1-minute sessions.
 */
export async function GET(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const settings = await settingsService.getSettings(result.session.userId);
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

  // Route through settingsService which validates and enforces feature interactions
  const validated = await settingsService.saveSettings(result.session.userId, settings);
  return NextResponse.json({ success: true, settings: validated });
}
