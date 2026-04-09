import { timerRepo } from '../repositories/timer.repo';
import { sessionRepo } from '../repositories/session.repo';
import { settingsRepo } from '../repositories/settings.repo';
import type { TimerState, TimerMode, SessionRecord } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('timer-service');

/**
 * Timer service - core state machine. PRD Section 5.
 * States: idle → running → paused → running → completed → overtime → idle
 * Strict Mode: idle → running → completed → overtime → idle (no pause)
 */
export const timerService = {
  /**
   * Get current timer state. PRD Section 5.2.7.
   * If heartbeat expired, clear controlling device.
   */
  async getState(userId: string): Promise<TimerState | null> {
    const state = await timerRepo.getState(userId);
    if (!state) return null;

    // Check heartbeat timeout (PRD 5.2.7: 60s without heartbeat clears controller)
    if ((state.status === 'running' || state.status === 'paused') && state.controllingDeviceId) {
      const expired = await timerRepo.isHeartbeatExpired(userId);
      if (expired) {
        // Stale running timer — clear controller so any device can claim it
        state.controllingDeviceId = null;
        state.lastHeartbeatAt = null;
        await timerRepo.setState(userId, state);
      }
    }

    // If timer has been "running" for longer than its configured duration + 1 hour
    // with no heartbeat, it's abandoned — reset to idle
    if (state.status === 'running' && state.startedAt && !state.controllingDeviceId) {
      const elapsed = Date.now() - new Date(state.startedAt).getTime();
      const maxReasonable = (state.configuredDuration * 60 + 3600) * 1000; // duration + 1 hour
      if (elapsed > maxReasonable) {
        state.status = 'idle';
        state.startedAt = null;
        state.pausedAt = null;
        state.overtimeStartedAt = null;
        await timerRepo.setState(userId, state);
      }
    }

    return state;
  },

  /**
   * Start timer. PRD Section 5.3.
   * Transitions: idle → running
   */
  async start(
    userId: string,
    mode: TimerMode,
    deviceId: string,
    intent: string | null,
    category: string,
  ): Promise<TimerState> {
    const existing = await timerRepo.getState(userId);

    // Reject if already running on another device (PRD 5.2.7)
    if (existing && existing.status === 'running' && existing.controllingDeviceId !== deviceId) {
      const expired = await timerRepo.isHeartbeatExpired(userId);
      if (!expired) {
        throw new TimerConflictError('Timer is running on another device');
      }
    }

    const settings = await settingsRepo.get(userId);
    const duration = getDurationForMode(mode, settings);

    const now = new Date().toISOString();
    const state: TimerState = {
      status: 'running',
      mode,
      startedAt: now,
      pausedAt: null,
      configuredDuration: duration,
      controllingDeviceId: deviceId,
      lastHeartbeatAt: now,
      intent,
      category,
      cycleNumber: existing?.cycleNumber ?? 1,
      overtimeStartedAt: null,
    };

    await timerRepo.setState(userId, state);
    logger.info('Timer started', { userId, mode, duration, deviceId });
    return state;
  },

  /**
   * Pause timer. PRD Section 5.2.5.
   * Transitions: running → paused
   * PRD: Strict Mode ON = pause DISABLED
   */
  async pause(userId: string, deviceId: string): Promise<TimerState> {
    const state = await timerRepo.getState(userId);
    if (!state || state.status !== 'running') {
      throw new InvalidStateError('Timer is not running');
    }

    // Check controller (PRD 5.2.7: only controller can pause)
    assertController(state, deviceId);

    // Check strict mode (PRD 5.3: Strict Mode ON during focus = no pause)
    const settings = await settingsRepo.get(userId);
    if (settings.strictMode && state.mode === 'focus') {
      throw new StrictModeError('Cannot pause during strict focus mode');
    }

    state.status = 'paused';
    state.pausedAt = new Date().toISOString();
    await timerRepo.setState(userId, state);
    logger.info('Timer paused', { userId });
    return state;
  },

  /**
   * Resume timer. PRD Section 5.2.5.
   * Transitions: paused → running
   * Adjusts startedAt to account for pause duration.
   */
  async resume(userId: string, deviceId: string): Promise<TimerState> {
    const state = await timerRepo.getState(userId);
    if (!state || state.status !== 'paused') {
      throw new InvalidStateError('Timer is not paused');
    }

    assertController(state, deviceId);

    // Adjust startedAt to compensate for pause duration
    if (state.startedAt && state.pausedAt) {
      const pauseDuration = Date.now() - new Date(state.pausedAt).getTime();
      const originalStart = new Date(state.startedAt).getTime();
      state.startedAt = new Date(originalStart + pauseDuration).toISOString();
    }

    state.status = 'running';
    state.pausedAt = null;
    state.lastHeartbeatAt = new Date().toISOString();
    state.controllingDeviceId = deviceId;
    await timerRepo.setState(userId, state);
    logger.info('Timer resumed', { userId });
    return state;
  },

  /**
   * Complete timer (reached 00:00). PRD Section 5.2.4.
   * Transitions: running → completed (or → overtime if enabled)
   */
  async complete(userId: string): Promise<{ state: TimerState; session: SessionRecord | null }> {
    const state = await timerRepo.getState(userId);
    if (!state || state.status !== 'running') {
      throw new InvalidStateError('Timer is not running');
    }

    const settings = await settingsRepo.get(userId);

    // Check if overtime is enabled (PRD 6.1)
    if (settings.overtimeAllowance && state.mode === 'focus') {
      state.status = 'overtime';
      state.overtimeStartedAt = new Date().toISOString();
      await timerRepo.setState(userId, state);
      logger.info('Timer entered overtime', { userId });
      return { state, session: null };
    }

    // Complete and log session
    const session = await this.finalizeSession(userId, state, settings);

    // Determine next mode (PRD 5.1.3)
    const nextMode = getNextMode(state.mode, state.cycleNumber, settings.cycleCount);
    state.status = 'idle';
    state.mode = nextMode;
    state.startedAt = null;
    state.pausedAt = null;
    state.controllingDeviceId = null;
    state.lastHeartbeatAt = null;
    state.overtimeStartedAt = null;
    state.configuredDuration = getDurationForMode(nextMode, settings);

    if (state.mode === 'focus' && nextMode !== 'focus') {
      // Cycle completed
    }
    if (nextMode === 'long_break') {
      state.cycleNumber++;
    }

    await timerRepo.setState(userId, state);
    logger.info('Timer completed', { userId, mode: state.mode, nextMode });
    return { state, session };
  },

  /**
   * Stop overtime. PRD Section 5.2.4.
   * Transitions: overtime → idle
   */
  async stopOvertime(userId: string, deviceId: string): Promise<{ state: TimerState; session: SessionRecord }> {
    const state = await timerRepo.getState(userId);
    if (!state || state.status !== 'overtime') {
      throw new InvalidStateError('Timer is not in overtime');
    }

    assertController(state, deviceId);
    const settings = await settingsRepo.get(userId);
    const session = await this.finalizeSession(userId, state, settings);

    const nextMode = getNextMode(state.mode, state.cycleNumber, settings.cycleCount);
    state.status = 'idle';
    state.mode = nextMode;
    state.startedAt = null;
    state.pausedAt = null;
    state.controllingDeviceId = null;
    state.lastHeartbeatAt = null;
    state.overtimeStartedAt = null;
    state.configuredDuration = getDurationForMode(nextMode, settings);
    if (nextMode === 'long_break') {
      state.cycleNumber++;
    }

    await timerRepo.setState(userId, state);
    return { state, session: session! };
  },

  /**
   * Finish Early — log a PARTIAL completed session with actual elapsed time.
   * Counts toward daily goal and focus total. Transitions to next phase.
   */
  async finishEarly(userId: string, deviceId: string): Promise<{ state: TimerState; session: SessionRecord | null }> {
    const state = await timerRepo.getState(userId);
    if (!state || (state.status !== 'running' && state.status !== 'paused')) {
      throw new InvalidStateError('Timer is not active');
    }

    assertController(state, deviceId);
    const settings = await settingsRepo.get(userId);

    // Log partial completed session (same as finalizeSession but no min-duration gate)
    const session = await this.logPartialSession(userId, state);

    // Advance to next mode
    const nextMode = getNextMode(state.mode, state.cycleNumber, settings.cycleCount);
    state.status = 'idle';
    state.mode = nextMode;
    state.startedAt = null;
    state.pausedAt = null;
    state.controllingDeviceId = null;
    state.lastHeartbeatAt = null;
    state.overtimeStartedAt = null;
    state.configuredDuration = getDurationForMode(nextMode, settings);
    if (nextMode === 'long_break') state.cycleNumber++;

    await timerRepo.setState(userId, state);
    logger.info('Timer finished early', { userId, mode: state.mode });
    return { state, session };
  },

  /**
   * Skip current session — NO log, NO credit, NO record.
   * Zero time logged. Counter unchanged. Transitions to next phase.
   * For breaks: jumps to focus. For focus: resets to fresh focus.
   */
  async skip(userId: string, deviceId: string): Promise<TimerState> {
    const state = await timerRepo.getState(userId);
    if (!state || (state.status !== 'running' && state.status !== 'paused')) {
      throw new InvalidStateError('Timer is not active');
    }

    assertController(state, deviceId);

    const settings = await settingsRepo.get(userId);
    if (settings.strictMode && state.mode === 'focus') {
      throw new StrictModeError('Cannot skip during strict focus mode');
    }

    // NO session logged — skip means it never happened

    // Advance to next mode
    const nextMode = getNextMode(state.mode, state.cycleNumber, settings.cycleCount);
    state.status = 'idle';
    state.mode = nextMode;
    state.startedAt = null;
    state.pausedAt = null;
    state.controllingDeviceId = null;
    state.lastHeartbeatAt = null;
    state.overtimeStartedAt = null;
    state.configuredDuration = getDurationForMode(nextMode, settings);

    await timerRepo.setState(userId, state);
    logger.info('Timer skipped (no log)', { userId });
    return state;
  },

  /**
   * Reset current session. PRD Section 5.3.
   * Transitions: running/paused → idle (same mode)
   */
  async reset(userId: string, deviceId: string): Promise<TimerState> {
    const state = await timerRepo.getState(userId);
    if (!state || (state.status !== 'running' && state.status !== 'paused')) {
      throw new InvalidStateError('Timer is not active');
    }

    assertController(state, deviceId);

    const settings = await settingsRepo.get(userId);
    if (settings.strictMode && state.mode === 'focus') {
      throw new StrictModeError('Cannot reset during strict focus mode');
    }

    await this.logAbandonedSession(userId, state, 'reset');

    state.status = 'idle';
    state.startedAt = null;
    state.pausedAt = null;
    state.controllingDeviceId = null;
    state.lastHeartbeatAt = null;
    state.overtimeStartedAt = null;
    state.configuredDuration = getDurationForMode(state.mode, settings);

    await timerRepo.setState(userId, state);
    logger.info('Timer reset', { userId });
    return state;
  },

  /**
   * Abandon session (e.g., logout, mode switch while running).
   * PRD Section 5.1.2, 3.3.
   */
  async abandon(userId: string, reason: 'switch' | 'close' | 'timeout'): Promise<void> {
    const state = await timerRepo.getState(userId);
    if (!state || state.status === 'idle') return;

    await this.logAbandonedSession(userId, state, reason);
    await timerRepo.clearState(userId);
    logger.info('Timer abandoned', { userId, reason });
  },

  /**
   * Switch timer mode. PRD Section 5.1.2.
   * IDLE: instant switch. RUNNING/PAUSED: requires confirmation (handled client-side).
   */
  async switchMode(userId: string, newMode: TimerMode, deviceId: string): Promise<TimerState> {
    const state = await timerRepo.getState(userId);
    const settings = await settingsRepo.get(userId);

    if (state && (state.status === 'running' || state.status === 'paused')) {
      assertController(state, deviceId);
      await this.logAbandonedSession(userId, state, 'switch');
    }

    const duration = getDurationForMode(newMode, settings);
    const newState: TimerState = {
      status: 'idle',
      mode: newMode,
      startedAt: null,
      pausedAt: null,
      configuredDuration: duration,
      controllingDeviceId: null,
      lastHeartbeatAt: null,
      intent: state?.intent ?? null,
      category: state?.category ?? 'General',
      cycleNumber: state?.cycleNumber ?? 1,
      overtimeStartedAt: null,
    };

    await timerRepo.setState(userId, newState);
    return newState;
  },

  /**
   * Heartbeat from controlling device. PRD Section 5.2.7.
   */
  async heartbeat(userId: string, deviceId: string): Promise<void> {
    await timerRepo.updateHeartbeat(userId, deviceId);
  },

  /**
   * Take over control from another device. PRD Section 5.2.7.
   */
  async takeOver(userId: string, newDeviceId: string): Promise<TimerState> {
    const state = await timerRepo.getState(userId);
    if (!state) {
      throw new InvalidStateError('No timer state');
    }

    const oldDeviceId = state.controllingDeviceId;
    await timerRepo.transferControl(userId, newDeviceId);
    state.controllingDeviceId = newDeviceId;
    state.lastHeartbeatAt = new Date().toISOString();
    logger.info('Timer control transferred', { userId, from: oldDeviceId, to: newDeviceId });
    return state;
  },

  /**
   * Finalize and log a completed session.
   */
  async finalizeSession(
    userId: string,
    state: TimerState,
    settings: { minCountableSession: number; autoLogSessions: boolean },
  ): Promise<SessionRecord | null> {
    if (!state.startedAt) return null;

    const now = new Date();
    const startTime = new Date(state.startedAt);
    const actualDurationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const overtimeSeconds = state.overtimeStartedAt
      ? Math.floor((now.getTime() - new Date(state.overtimeStartedAt).getTime()) / 1000)
      : 0;

    // PRD 6.1: Sessions under min countable are not logged.
    // Invariant: minCountableSession can never exceed the configured duration for this session.
    // This catches stale settings where minCountable=10 but focus=1.
    const effectiveMinCountable = Math.min(
      settings.minCountableSession,
      state.configuredDuration, // in minutes
    );
    if (actualDurationSeconds < effectiveMinCountable * 60) {
      logger.info('Session too short, not logged', {
        userId,
        duration: actualDurationSeconds,
        minCountable: effectiveMinCountable,
      });
      return null;
    }

    const session: SessionRecord = {
      id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      date: startTime.toISOString().split('T')[0] ?? '',
      startedAt: state.startedAt,
      completedAt: now.toISOString(),
      mode: state.mode,
      configuredDuration: state.configuredDuration * 60,
      actualDuration: actualDurationSeconds,
      overtimeDuration: overtimeSeconds,
      intent: state.intent,
      category: state.category,
      status: 'completed',
      notes: null,
      deviceId: state.controllingDeviceId ?? 'unknown',
      deletedAt: null,
    };

    await sessionRepo.create(session);
    return session;
  },

  /**
   * Log an abandoned session.
   */
  async logAbandonedSession(
    userId: string,
    state: TimerState,
    reason: 'skip' | 'reset' | 'switch' | 'close' | 'timeout',
  ): Promise<void> {
    if (!state.startedAt) return;

    const now = new Date();
    const startTime = new Date(state.startedAt);
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const session: SessionRecord = {
      id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      date: startTime.toISOString().split('T')[0] ?? '',
      startedAt: state.startedAt,
      completedAt: now.toISOString(),
      mode: state.mode,
      configuredDuration: state.configuredDuration * 60,
      actualDuration: elapsedSeconds,
      overtimeDuration: 0,
      intent: state.intent,
      category: state.category,
      status: 'abandoned',
      abandonReason: reason,
      notes: null,
      deviceId: state.controllingDeviceId ?? 'unknown',
      deletedAt: null,
    };

    await sessionRepo.create(session);
  },

  /**
   * Log a partial completed session (Finish Early).
   * Status = 'completed', counts toward goals and daily total.
   * No min-duration gate — user explicitly chose to log it.
   */
  async logPartialSession(
    userId: string,
    state: TimerState,
  ): Promise<SessionRecord | null> {
    if (!state.startedAt) return null;

    const now = new Date();
    const startTime = new Date(state.startedAt);
    const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    const session: SessionRecord = {
      id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      date: startTime.toISOString().split('T')[0] ?? '',
      startedAt: state.startedAt,
      completedAt: now.toISOString(),
      mode: state.mode,
      configuredDuration: state.configuredDuration * 60,
      actualDuration: elapsedSeconds,
      overtimeDuration: 0,
      intent: state.intent,
      category: state.category,
      status: 'completed', // Partial but still counts
      notes: null,
      deviceId: state.controllingDeviceId ?? 'unknown',
      deletedAt: null,
    };

    await sessionRepo.create(session);
    logger.info('Partial session logged', { userId, mode: state.mode, duration: elapsedSeconds });
    return session;
  },
};

/**
 * Get duration in minutes for a mode. PRD Appendix A.
 */
function getDurationForMode(
  mode: TimerMode,
  settings: { focusDuration: number; shortBreakDuration: number; longBreakDuration: number },
): number {
  switch (mode) {
    case 'focus': return settings.focusDuration;
    case 'break': return settings.shortBreakDuration;
    case 'long_break': return settings.longBreakDuration;
  }
}

/**
 * Determine next mode in cycle. PRD Section 5.1.3.
 * Focus → Break → Focus → ... → Focus → Long Break
 */
function getNextMode(currentMode: TimerMode, cycleNumber: number, cycleCount: number): TimerMode {
  switch (currentMode) {
    case 'focus':
      return cycleNumber % cycleCount === 0 ? 'long_break' : 'break';
    case 'break':
    case 'long_break':
      return 'focus';
  }
}

/**
 * Assert the requesting device is the controller.
 */
function assertController(state: TimerState, deviceId: string): void {
  if (state.controllingDeviceId && state.controllingDeviceId !== deviceId) {
    throw new TimerConflictError('Another device controls this timer');
  }
}

export class TimerConflictError extends Error {
  constructor(message: string) { super(message); this.name = 'TimerConflictError'; }
}

export class InvalidStateError extends Error {
  constructor(message: string) { super(message); this.name = 'InvalidStateError'; }
}

export class StrictModeError extends Error {
  constructor(message: string) { super(message); this.name = 'StrictModeError'; }
}
