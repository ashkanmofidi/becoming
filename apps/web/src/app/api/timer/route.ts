import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit } from '@/app/api/middleware';
import { timerService, TimerConflictError, InvalidStateError, StrictModeError } from '@/services/timer.service';

/**
 * Timer API. PRD Section 5.
 * GET: Get current timer state
 * POST: Timer actions (start, pause, resume, skip, reset, complete, stopOvertime, heartbeat, takeOver, switchMode)
 */
export async function GET(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const state = await timerService.getState(result.session.userId);
  return NextResponse.json({ state });
}

export async function POST(request: NextRequest) {
  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const { userId } = result.session;
  const body = await request.json();
  const { action, deviceId, mode, intent, category, newMode } = body;

  try {
    switch (action) {
      case 'start': {
        const state = await timerService.start(
          userId,
          mode ?? 'focus',
          deviceId,
          intent ?? null,
          category ?? 'General',
        );
        return NextResponse.json({ state });
      }

      case 'pause': {
        const state = await timerService.pause(userId, deviceId);
        return NextResponse.json({ state });
      }

      case 'resume': {
        const state = await timerService.resume(userId, deviceId);
        return NextResponse.json({ state });
      }

      case 'skip': {
        const state = await timerService.skip(userId, deviceId);
        return NextResponse.json({ state });
      }

      case 'reset': {
        const state = await timerService.reset(userId, deviceId);
        return NextResponse.json({ state });
      }

      case 'complete': {
        const { state, session } = await timerService.complete(userId);
        return NextResponse.json({ state, session });
      }

      case 'finishEarly': {
        const { state, session } = await timerService.finishEarly(userId, deviceId);
        return NextResponse.json({ state, session });
      }

      case 'stopOvertime': {
        const { state, session } = await timerService.stopOvertime(userId, deviceId);
        return NextResponse.json({ state, session });
      }

      case 'heartbeat': {
        await timerService.heartbeat(userId, deviceId);
        return NextResponse.json({ success: true });
      }

      case 'takeOver': {
        const state = await timerService.takeOver(userId, deviceId);
        return NextResponse.json({ state });
      }

      case 'switchMode': {
        const state = await timerService.switchMode(userId, newMode, deviceId);
        return NextResponse.json({ state });
      }

      case 'abandon': {
        // Used by logout and session expiry — logs partial session, clears timer
        await timerService.abandon(userId, 'close');
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof TimerConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof InvalidStateError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof StrictModeError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
