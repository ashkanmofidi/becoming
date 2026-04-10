import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, rateLimit, checkPayloadSize } from '@/app/api/middleware';
import { timerService, TimerConflictError, InvalidStateError, StrictModeError } from '@/services/timer.service';
import { broadcast } from '@/lib/pusher-server';

const VALID_ACTIONS = ['start', 'pause', 'resume', 'skip', 'reset', 'complete', 'finishEarly', 'stopOvertime', 'heartbeat', 'takeOver', 'switchMode', 'abandon'] as const;
const VALID_MODES = ['focus', 'break', 'long_break'] as const;

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
  const payloadCheck = checkPayloadSize(request, 8192); // 8KB max for timer actions
  if (payloadCheck) return payloadCheck;

  const rateLimited = rateLimit(request);
  if (rateLimited) return rateLimited;

  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const { userId } = result.session;
  const body = await request.json();
  const { action, deviceId, mode, intent, category, newMode } = body;

  // Validate action
  if (!action || typeof action !== 'string' || !VALID_ACTIONS.includes(action as typeof VALID_ACTIONS[number])) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // Validate deviceId for actions that require it
  if (action !== 'complete' && action !== 'abandon') {
    if (!deviceId || typeof deviceId !== 'string' || deviceId.length > 100) {
      return NextResponse.json({ error: 'Invalid deviceId' }, { status: 400 });
    }
  }

  // Validate mode for start and switchMode
  if ((action === 'start' || action === 'switchMode') && mode !== undefined && !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  }
  if (action === 'switchMode' && newMode !== undefined && !VALID_MODES.includes(newMode)) {
    return NextResponse.json({ error: 'Invalid newMode' }, { status: 400 });
  }

  // Validate string fields
  if (intent !== undefined && intent !== null && (typeof intent !== 'string' || intent.length > 500)) {
    return NextResponse.json({ error: 'Invalid intent' }, { status: 400 });
  }
  if (category !== undefined && (typeof category !== 'string' || category.length > 100)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  // Helper: broadcast state change to all connected devices via Pusher
  const broadcastTimer = (state: unknown) => {
    // Fire-and-forget — don't block the API response
    broadcast(userId, 'timer-update', state as Record<string, unknown>).catch(() => {});
  };

  try {
    switch (action) {
      case 'start': {
        const state = await timerService.start(userId, mode ?? 'focus', deviceId, intent ?? null, category ?? 'General');
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'pause': {
        const state = await timerService.pause(userId, deviceId);
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'resume': {
        const state = await timerService.resume(userId, deviceId);
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'skip': {
        const state = await timerService.skip(userId, deviceId);
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'reset': {
        const state = await timerService.reset(userId, deviceId);
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'complete': {
        const { state, session } = await timerService.complete(userId);
        broadcastTimer(state);
        broadcast(userId, 'session-logged', { session }).catch(() => {});
        return NextResponse.json({ state, session });
      }

      case 'finishEarly': {
        const { state, session } = await timerService.finishEarly(userId, deviceId);
        broadcastTimer(state);
        broadcast(userId, 'session-logged', { session }).catch(() => {});
        return NextResponse.json({ state, session });
      }

      case 'stopOvertime': {
        const { state, session } = await timerService.stopOvertime(userId, deviceId);
        broadcastTimer(state);
        broadcast(userId, 'session-logged', { session }).catch(() => {});
        return NextResponse.json({ state, session });
      }

      case 'heartbeat': {
        await timerService.heartbeat(userId, deviceId);
        return NextResponse.json({ success: true }); // No broadcast for heartbeats
      }

      case 'takeOver': {
        const state = await timerService.takeOver(userId, deviceId);
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'switchMode': {
        const state = await timerService.switchMode(userId, newMode, deviceId);
        broadcastTimer(state);
        return NextResponse.json({ state });
      }

      case 'abandon': {
        await timerService.abandon(userId, 'close');
        broadcastTimer(null); // Timer cleared
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e) {
    const err = e as Error;
    if (err instanceof TimerConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof InvalidStateError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof StrictModeError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw e;
  }
}
