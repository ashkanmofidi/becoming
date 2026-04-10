import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { settingsService } from '@/services/settings.service';
import { broadcast } from '@/lib/pusher-server';
import type { UserSettings } from '@becoming/shared';

/**
 * Settings API. PRD Section 6.
 * GET: Fetch current settings
 * PUT: Save settings — MUST go through settingsService.saveSettings()
 *      which runs validateAndEnforce() (feature interactions, bounds clamping).
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

  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return NextResponse.json({ error: 'settings must be a non-null object' }, { status: 400 });
  }

  // Runtime bounds validation (P2-1)
  if ('focusDuration' in settings) {
    if (typeof settings.focusDuration !== 'number' || settings.focusDuration < 1 || settings.focusDuration > 120) {
      return NextResponse.json(
        { error: 'focusDuration must be a number between 1 and 120' },
        { status: 400 },
      );
    }
  }

  // Route through settingsService which validates and enforces feature interactions
  const validated = await settingsService.saveSettings(result.session.userId, settings);
  // Broadcast settings change to all devices (fire-and-forget)
  broadcast(result.session.userId, 'settings-changed', validated as unknown as Record<string, unknown>).catch(() => {});

  return NextResponse.json({ success: true, settings: validated });
}
