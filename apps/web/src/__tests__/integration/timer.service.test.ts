import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockKvClient, resetMockKV, getMockStore } from '@/__tests__/mocks/kv.mock';

// Mock the KV client before any repo imports
vi.mock('@/repositories/kv.client', () => ({
  kvClient: mockKvClient,
  keys: {
    user: (userId: string) => `user:${userId}`,
    session: (userId: string, sessionId: string) => `session:${userId}:${sessionId}`,
    sessionList: (userId: string) => `sessions:${userId}`,
    timer: (userId: string) => `timer:${userId}`,
    tos: (userId: string) => `tos:${userId}`,
    authSession: (token: string) => `auth:session:${token}`,
    settings: (userId: string) => `settings:${userId}`,
    feedback: (feedbackId: string) => `feedback:${feedbackId}`,
    feedbackList: () => `feedback:all`,
    audit: (auditId: string) => `audit:${auditId}`,
    auditList: () => `audit:all`,
    intentHistory: (userId: string) => `intent_history:${userId}`,
    betaConfig: () => `beta:config`,
    betaInvite: (email: string) => `beta:invites:${email}`,
    betaAllowlist: () => `beta:allowlist`,
    betaUserCount: () => `beta:user_count`,
    dailyAggregation: (userId: string, date: string) => `agg:daily:${userId}:${date}`,
    streakFreeze: (userId: string, month: string) => `streak:freeze:${userId}:${month}`,
    adminList: () => `bm:admins`,
  },
}));

// Mock the logger to suppress output during tests
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import {
  timerService,
  TimerConflictError,
  InvalidStateError,
  StrictModeError,
} from '@/services/timer.service';
import type { TimerState } from '@becoming/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = 'user_test_123';
const DEVICE_A = 'device_a';
const DEVICE_B = 'device_b';

const mockSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cycleCount: 4,
  minCountableSession: 10,
  overtimeAllowance: false,
  strictMode: false,
  autoLogSessions: true,
};

/**
 * Seed settings into the mock KV store so settingsRepo.get returns our mock.
 * settingsRepo.get reads from `settings:{userId}` and, if present, passes it
 * through migrateSettings. We store a full-ish UserSettings object so the
 * migration is a no-op.
 */
function seedSettings(overrides: Partial<typeof mockSettings> = {}): void {
  const settings = {
    ...mockSettings,
    ...overrides,
    // Required fields for UserSettings that migrateSettings may expect
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    autoStartBreaks: false,
    autoStartFocus: false,
    desktopNotifications: true,
    notifySessionComplete: true,
    notifyBreakComplete: true,
    notifyDailyGoal: true,
    notifyStreakMilestone: true,
    notificationStyle: 'standard',
    dailyGoal: 4,
    dayResetTime: '04:00',
    dayResetTimezone: 'America/New_York',
    streakCalculation: 'one_session',
    streakFreezePerMonth: 1,
    theme: 'dark',
    fontSize: 'normal',
    accentColor: '#FF6B6B',
    breakAccentColor: '#4ECDC4',
    clockFont: 'flip',
    showSeconds: true,
    reducedMotion: false,
    completionAnimationIntensity: 'standard',
    tabTitleTimer: true,
    dynamicFavicon: true,
    soundTheme: 'warm',
    masterVolume: 80,
    customCompletionSound: null,
    tickDuringFocus: false,
    tickDuringBreaks: false,
    last30sTicking: true,
    hapticEnabled: true,
    hapticCompletion: true,
    hapticPauseResume: false,
    hapticLast10s: false,
    respectSilentMode: true,
    ambientSound: 'none',
    ambientVolume: 50,
    categories: [{ name: 'General', color: '#888', order: 0, createdAt: new Date().toISOString() }],
    defaultCategory: 'General',
    shortcutsEnabled: true,
    shortcutBindings: {},
    screenWakeLock: false,
    fullscreenFocus: false,
    weeklyGoalEnabled: false,
    weeklyGoalTarget: 20,
    milestoneCelebrations: true,
    idleReminder: false,
    idleReminderDelay: 5,
    dailySummary: false,
    dailySummaryTime: '20:00',
    emailNotifications: false,
    emailWeeklySummary: false,
    emailStreakAtRisk: false,
    emailMilestones: false,
    intentAutocomplete: true,
    sessionNotes: false,
    screenReaderVerbosity: 'standard',
    highContrast: false,
    largeTapTargets: false,
    colorBlindMode: 'off',
  };
  getMockStore().set(`settings:${USER_ID}`, settings);
}

/** Helper: start a timer in focus mode and return the state. */
async function startFocusTimer(
  deviceId: string = DEVICE_A,
  intent: string | null = 'Deep work',
  category: string = 'General',
): Promise<TimerState> {
  return timerService.start(USER_ID, 'focus', deviceId, intent, category);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('timerService integration', () => {
  beforeEach(() => {
    resetMockKV();
    seedSettings();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-07T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // 1. Start timer
  // -----------------------------------------------------------------------
  describe('start', () => {
    it('creates a running state with correct fields', async () => {
      const state = await startFocusTimer();

      expect(state.status).toBe('running');
      expect(state.mode).toBe('focus');
      expect(state.startedAt).toBe('2026-04-07T10:00:00.000Z');
      expect(state.pausedAt).toBeNull();
      expect(state.configuredDuration).toBe(25);
      expect(state.controllingDeviceId).toBe(DEVICE_A);
      expect(state.lastHeartbeatAt).toBe('2026-04-07T10:00:00.000Z');
      expect(state.intent).toBe('Deep work');
      expect(state.category).toBe('General');
      expect(state.cycleNumber).toBe(1);
      expect(state.overtimeStartedAt).toBeNull();
    });

    it('uses break duration when starting a break', async () => {
      const state = await timerService.start(USER_ID, 'break', DEVICE_A, null, 'General');
      expect(state.configuredDuration).toBe(5);
      expect(state.mode).toBe('break');
    });

    it('uses long break duration when starting a long break', async () => {
      const state = await timerService.start(USER_ID, 'long_break', DEVICE_A, null, 'General');
      expect(state.configuredDuration).toBe(15);
    });

    it('preserves cycleNumber from existing state', async () => {
      // Seed an existing state with cycleNumber 3
      getMockStore().set(`timer:${USER_ID}`, {
        status: 'idle',
        mode: 'focus',
        startedAt: null,
        pausedAt: null,
        configuredDuration: 25,
        controllingDeviceId: null,
        lastHeartbeatAt: null,
        intent: null,
        category: 'General',
        cycleNumber: 3,
        overtimeStartedAt: null,
      });

      const state = await startFocusTimer();
      expect(state.cycleNumber).toBe(3);
    });

    it('persists state to KV store', async () => {
      await startFocusTimer();
      const stored = getMockStore().get(`timer:${USER_ID}`) as TimerState;
      expect(stored).toBeDefined();
      expect(stored.status).toBe('running');
    });
  });

  // -----------------------------------------------------------------------
  // 2. Pause timer
  // -----------------------------------------------------------------------
  describe('pause', () => {
    it('transitions running to paused and records pausedAt', async () => {
      await startFocusTimer();

      vi.setSystemTime(new Date('2026-04-07T10:05:00.000Z'));
      const paused = await timerService.pause(USER_ID, DEVICE_A);

      expect(paused.status).toBe('paused');
      expect(paused.pausedAt).toBe('2026-04-07T10:05:00.000Z');
      expect(paused.startedAt).toBe('2026-04-07T10:00:00.000Z');
    });

    it('throws InvalidStateError when timer is idle', async () => {
      await expect(timerService.pause(USER_ID, DEVICE_A)).rejects.toThrow(InvalidStateError);
    });

    it('throws TimerConflictError when wrong device pauses', async () => {
      await startFocusTimer(DEVICE_A);
      await expect(timerService.pause(USER_ID, DEVICE_B)).rejects.toThrow(TimerConflictError);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Resume timer
  // -----------------------------------------------------------------------
  describe('resume', () => {
    it('transitions paused back to running and adjusts startedAt', async () => {
      await startFocusTimer();

      // Pause at +5 min
      vi.setSystemTime(new Date('2026-04-07T10:05:00.000Z'));
      await timerService.pause(USER_ID, DEVICE_A);

      // Resume at +10 min (paused for 5 min)
      vi.setSystemTime(new Date('2026-04-07T10:10:00.000Z'));
      const resumed = await timerService.resume(USER_ID, DEVICE_A);

      expect(resumed.status).toBe('running');
      expect(resumed.pausedAt).toBeNull();
      // startedAt should shift forward by 5 minutes of pause
      // Original startedAt was 10:00, paused at 10:05, resumed at 10:10
      // Pause duration = 5 min, so new startedAt = 10:00 + 5min = 10:05
      expect(resumed.startedAt).toBe('2026-04-07T10:05:00.000Z');
      expect(resumed.lastHeartbeatAt).toBe('2026-04-07T10:10:00.000Z');
    });

    it('throws InvalidStateError when timer is not paused', async () => {
      await startFocusTimer();
      await expect(timerService.resume(USER_ID, DEVICE_A)).rejects.toThrow(InvalidStateError);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Complete timer
  // -----------------------------------------------------------------------
  describe('complete', () => {
    it('logs session and advances to next mode (focus -> break)', async () => {
      await startFocusTimer();

      // Advance 25 minutes to reach completion
      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      const { state, session } = await timerService.complete(USER_ID);

      expect(state.status).toBe('idle');
      expect(state.mode).toBe('break');
      expect(state.configuredDuration).toBe(5);
      expect(state.startedAt).toBeNull();
      expect(state.controllingDeviceId).toBeNull();

      // Session should be logged (25 min >= 10 min minimum)
      expect(session).not.toBeNull();
      expect(session!.mode).toBe('focus');
      expect(session!.status).toBe('completed');
      expect(session!.actualDuration).toBe(25 * 60); // 1500 seconds
      expect(session!.overtimeDuration).toBe(0);
      expect(session!.userId).toBe(USER_ID);
    });

    it('does not log session shorter than minCountableSession', async () => {
      await startFocusTimer();

      // Only 5 minutes elapsed (less than 10 min minimum)
      vi.setSystemTime(new Date('2026-04-07T10:05:00.000Z'));
      const { session } = await timerService.complete(USER_ID);

      expect(session).toBeNull();
    });

    it('advances to long_break after cycleCount focus sessions', async () => {
      // Set cycleNumber = 4 (matches cycleCount=4, so 4 % 4 === 0 -> long_break)
      getMockStore().set(`timer:${USER_ID}`, {
        status: 'running',
        mode: 'focus',
        startedAt: '2026-04-07T09:35:00.000Z',
        pausedAt: null,
        configuredDuration: 25,
        controllingDeviceId: DEVICE_A,
        lastHeartbeatAt: '2026-04-07T10:00:00.000Z',
        intent: 'Deep work',
        category: 'General',
        cycleNumber: 4,
        overtimeStartedAt: null,
      });

      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      const { state } = await timerService.complete(USER_ID);

      expect(state.mode).toBe('long_break');
      expect(state.configuredDuration).toBe(15);
      expect(state.cycleNumber).toBe(5); // incremented
    });

    it('advances from break back to focus', async () => {
      // Start a break
      getMockStore().set(`timer:${USER_ID}`, {
        status: 'running',
        mode: 'break',
        startedAt: '2026-04-07T09:50:00.000Z',
        pausedAt: null,
        configuredDuration: 5,
        controllingDeviceId: DEVICE_A,
        lastHeartbeatAt: '2026-04-07T10:00:00.000Z',
        intent: null,
        category: 'General',
        cycleNumber: 1,
        overtimeStartedAt: null,
      });

      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      const { state } = await timerService.complete(USER_ID);

      expect(state.mode).toBe('focus');
      expect(state.configuredDuration).toBe(25);
    });

    it('throws InvalidStateError when timer is not running', async () => {
      await expect(timerService.complete(USER_ID)).rejects.toThrow(InvalidStateError);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Skip timer
  // -----------------------------------------------------------------------
  describe('skip', () => {
    it('skips with NO log and advances mode', async () => {
      await startFocusTimer();

      vi.setSystemTime(new Date('2026-04-07T10:15:00.000Z'));
      const state = await timerService.skip(USER_ID, DEVICE_A);

      expect(state.status).toBe('idle');
      expect(state.mode).toBe('break'); // focus -> break
      expect(state.startedAt).toBeNull();
      expect(state.controllingDeviceId).toBeNull();

      // Skip = NO session logged at all (changed from abandoned logging)
      const sessionKeys = [...getMockStore().keys()].filter((k) =>
        k.startsWith(`session:${USER_ID}:ses_`),
      );
      expect(sessionKeys.length).toBe(0);
    });

    it('works when timer is paused', async () => {
      await startFocusTimer();
      vi.setSystemTime(new Date('2026-04-07T10:05:00.000Z'));
      await timerService.pause(USER_ID, DEVICE_A);

      const state = await timerService.skip(USER_ID, DEVICE_A);
      expect(state.status).toBe('idle');
      expect(state.mode).toBe('break');
    });

    it('throws InvalidStateError when timer is idle', async () => {
      await expect(timerService.skip(USER_ID, DEVICE_A)).rejects.toThrow(InvalidStateError);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Reset timer
  // -----------------------------------------------------------------------
  describe('reset', () => {
    it('resets to idle with same mode', async () => {
      await startFocusTimer();

      vi.setSystemTime(new Date('2026-04-07T10:10:00.000Z'));
      const state = await timerService.reset(USER_ID, DEVICE_A);

      expect(state.status).toBe('idle');
      expect(state.mode).toBe('focus'); // same mode, not advanced
      expect(state.startedAt).toBeNull();
      expect(state.pausedAt).toBeNull();
      expect(state.controllingDeviceId).toBeNull();
      expect(state.configuredDuration).toBe(25);
    });

    it('logs abandoned session with reason reset', async () => {
      await startFocusTimer();
      vi.setSystemTime(new Date('2026-04-07T10:10:00.000Z'));
      await timerService.reset(USER_ID, DEVICE_A);

      const sessionKeys = [...getMockStore().keys()].filter((k) =>
        k.startsWith(`session:${USER_ID}:ses_`),
      );
      expect(sessionKeys.length).toBe(1);
      const session = getMockStore().get(sessionKeys[0]!) as Record<string, unknown>;
      expect(session.status).toBe('abandoned');
      expect(session.abandonReason).toBe('reset');
    });

    it('throws InvalidStateError when timer is idle', async () => {
      await expect(timerService.reset(USER_ID, DEVICE_A)).rejects.toThrow(InvalidStateError);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Strict mode
  // -----------------------------------------------------------------------
  describe('strict mode', () => {
    beforeEach(() => {
      seedSettings({ strictMode: true });
    });

    it('throws StrictModeError when pausing during focus', async () => {
      await startFocusTimer();
      await expect(timerService.pause(USER_ID, DEVICE_A)).rejects.toThrow(StrictModeError);
    });

    it('throws StrictModeError when skipping during focus', async () => {
      await startFocusTimer();
      await expect(timerService.skip(USER_ID, DEVICE_A)).rejects.toThrow(StrictModeError);
    });

    it('throws StrictModeError when resetting during focus', async () => {
      await startFocusTimer();
      await expect(timerService.reset(USER_ID, DEVICE_A)).rejects.toThrow(StrictModeError);
    });

    it('allows pause during break even with strict mode', async () => {
      const breakState = await timerService.start(USER_ID, 'break', DEVICE_A, null, 'General');
      expect(breakState.mode).toBe('break');

      const paused = await timerService.pause(USER_ID, DEVICE_A);
      expect(paused.status).toBe('paused');
    });

    it('allows skip during break even with strict mode', async () => {
      await timerService.start(USER_ID, 'break', DEVICE_A, null, 'General');
      const state = await timerService.skip(USER_ID, DEVICE_A);
      expect(state.status).toBe('idle');
    });
  });

  // -----------------------------------------------------------------------
  // 8. Overtime
  // -----------------------------------------------------------------------
  describe('overtime', () => {
    beforeEach(() => {
      seedSettings({ overtimeAllowance: true });
    });

    it('enters overtime on focus completion when overtimeAllowance is enabled', async () => {
      await startFocusTimer();

      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      const { state, session } = await timerService.complete(USER_ID);

      expect(state.status).toBe('overtime');
      expect(state.overtimeStartedAt).toBe('2026-04-07T10:25:00.000Z');
      // No session logged yet during overtime entry
      expect(session).toBeNull();
    });

    it('does not enter overtime during break completion', async () => {
      getMockStore().set(`timer:${USER_ID}`, {
        status: 'running',
        mode: 'break',
        startedAt: '2026-04-07T09:50:00.000Z',
        pausedAt: null,
        configuredDuration: 5,
        controllingDeviceId: DEVICE_A,
        lastHeartbeatAt: '2026-04-07T10:00:00.000Z',
        intent: null,
        category: 'General',
        cycleNumber: 1,
        overtimeStartedAt: null,
      });

      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      const { state } = await timerService.complete(USER_ID);

      // Breaks do not enter overtime even when the setting is on
      expect(state.status).toBe('idle');
      expect(state.mode).toBe('focus');
    });
  });

  // -----------------------------------------------------------------------
  // 9. Stop overtime
  // -----------------------------------------------------------------------
  describe('stopOvertime', () => {
    it('finalizes session with overtime duration and advances mode', async () => {
      seedSettings({ overtimeAllowance: true });

      await startFocusTimer();

      // Complete at 25 min -> enters overtime
      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      await timerService.complete(USER_ID);

      // Stop overtime at 30 min (5 min overtime)
      vi.setSystemTime(new Date('2026-04-07T10:30:00.000Z'));
      const { state, session } = await timerService.stopOvertime(USER_ID, DEVICE_A);

      expect(state.status).toBe('idle');
      expect(state.mode).toBe('break');
      expect(state.overtimeStartedAt).toBeNull();

      expect(session).toBeDefined();
      expect(session.status).toBe('completed');
      expect(session.actualDuration).toBe(30 * 60); // 1800 seconds total
      expect(session.overtimeDuration).toBe(5 * 60); // 300 seconds overtime
    });

    it('throws InvalidStateError when not in overtime', async () => {
      await startFocusTimer();
      await expect(timerService.stopOvertime(USER_ID, DEVICE_A)).rejects.toThrow(
        InvalidStateError,
      );
    });
  });

  // -----------------------------------------------------------------------
  // 10. Multi-device
  // -----------------------------------------------------------------------
  describe('multi-device', () => {
    it('rejects second device starting while first is active', async () => {
      await startFocusTimer(DEVICE_A);

      await expect(
        timerService.start(USER_ID, 'focus', DEVICE_B, null, 'General'),
      ).rejects.toThrow(TimerConflictError);
    });

    it('allows second device if heartbeat has expired', async () => {
      await startFocusTimer(DEVICE_A);

      // Advance past 60s heartbeat timeout
      vi.setSystemTime(new Date('2026-04-07T10:02:00.000Z'));
      const state = await timerService.start(USER_ID, 'focus', DEVICE_B, null, 'General');
      expect(state.controllingDeviceId).toBe(DEVICE_B);
    });

    it('heartbeat timeout clears controller on getState', async () => {
      await startFocusTimer(DEVICE_A);

      // Advance past 60s heartbeat timeout
      vi.setSystemTime(new Date('2026-04-07T10:02:00.000Z'));
      const state = await timerService.getState(USER_ID);

      expect(state).not.toBeNull();
      expect(state!.controllingDeviceId).toBeNull();
    });

    it('heartbeat keeps the controller alive', async () => {
      await startFocusTimer(DEVICE_A);

      // Heartbeat at 30s
      vi.setSystemTime(new Date('2026-04-07T10:00:30.000Z'));
      await timerService.heartbeat(USER_ID, DEVICE_A);

      // Check at 61s from start (but only 31s since last heartbeat)
      vi.setSystemTime(new Date('2026-04-07T10:01:01.000Z'));
      const state = await timerService.getState(USER_ID);

      expect(state).not.toBeNull();
      expect(state!.controllingDeviceId).toBe(DEVICE_A);
    });

    it('rejects wrong device from pausing', async () => {
      await startFocusTimer(DEVICE_A);
      await expect(timerService.pause(USER_ID, DEVICE_B)).rejects.toThrow(TimerConflictError);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Take over
  // -----------------------------------------------------------------------
  describe('takeOver', () => {
    it('transfers control to new device', async () => {
      await startFocusTimer(DEVICE_A);

      const state = await timerService.takeOver(USER_ID, DEVICE_B);

      expect(state.controllingDeviceId).toBe(DEVICE_B);
      expect(state.lastHeartbeatAt).toBeDefined();
    });

    it('new device can pause after takeover', async () => {
      await startFocusTimer(DEVICE_A);
      await timerService.takeOver(USER_ID, DEVICE_B);

      const paused = await timerService.pause(USER_ID, DEVICE_B);
      expect(paused.status).toBe('paused');
    });

    it('old device is rejected after takeover', async () => {
      await startFocusTimer(DEVICE_A);
      await timerService.takeOver(USER_ID, DEVICE_B);

      await expect(timerService.pause(USER_ID, DEVICE_A)).rejects.toThrow(TimerConflictError);
    });

    it('throws InvalidStateError when no timer state exists', async () => {
      await expect(timerService.takeOver(USER_ID, DEVICE_B)).rejects.toThrow(InvalidStateError);
    });
  });

  // -----------------------------------------------------------------------
  // 12. Mode switch
  // -----------------------------------------------------------------------
  describe('switchMode', () => {
    it('switches instantly from idle', async () => {
      const state = await timerService.switchMode(USER_ID, 'break', DEVICE_A);

      expect(state.status).toBe('idle');
      expect(state.mode).toBe('break');
      expect(state.configuredDuration).toBe(5);
    });

    it('abandons running session and switches mode', async () => {
      await startFocusTimer(DEVICE_A);

      vi.setSystemTime(new Date('2026-04-07T10:10:00.000Z'));
      const state = await timerService.switchMode(USER_ID, 'long_break', DEVICE_A);

      expect(state.status).toBe('idle');
      expect(state.mode).toBe('long_break');
      expect(state.configuredDuration).toBe(15);

      // Verify abandoned session was logged with reason 'switch'
      const sessionKeys = [...getMockStore().keys()].filter((k) =>
        k.startsWith(`session:${USER_ID}:ses_`),
      );
      expect(sessionKeys.length).toBe(1);
      const session = getMockStore().get(sessionKeys[0]!) as Record<string, unknown>;
      expect(session.status).toBe('abandoned');
      expect(session.abandonReason).toBe('switch');
    });

    it('rejects switch from running by wrong device', async () => {
      await startFocusTimer(DEVICE_A);
      await expect(
        timerService.switchMode(USER_ID, 'break', DEVICE_B),
      ).rejects.toThrow(TimerConflictError);
    });

    it('abandons paused session and switches mode', async () => {
      await startFocusTimer(DEVICE_A);
      vi.setSystemTime(new Date('2026-04-07T10:05:00.000Z'));
      await timerService.pause(USER_ID, DEVICE_A);

      const state = await timerService.switchMode(USER_ID, 'break', DEVICE_A);
      expect(state.status).toBe('idle');
      expect(state.mode).toBe('break');
    });

    it('preserves cycleNumber and category across switch', async () => {
      // Seed state with specific cycleNumber/category
      getMockStore().set(`timer:${USER_ID}`, {
        status: 'idle',
        mode: 'focus',
        startedAt: null,
        pausedAt: null,
        configuredDuration: 25,
        controllingDeviceId: null,
        lastHeartbeatAt: null,
        intent: 'reading',
        category: 'Study',
        cycleNumber: 3,
        overtimeStartedAt: null,
      });

      const state = await timerService.switchMode(USER_ID, 'break', DEVICE_A);
      expect(state.cycleNumber).toBe(3);
      expect(state.category).toBe('Study');
      expect(state.intent).toBe('reading');
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('getState returns null when no state exists', async () => {
      const state = await timerService.getState(USER_ID);
      expect(state).toBeNull();
    });

    it('abandon is a no-op when timer is idle', async () => {
      getMockStore().set(`timer:${USER_ID}`, {
        status: 'idle',
        mode: 'focus',
        startedAt: null,
        pausedAt: null,
        configuredDuration: 25,
        controllingDeviceId: null,
        lastHeartbeatAt: null,
        intent: null,
        category: 'General',
        cycleNumber: 1,
        overtimeStartedAt: null,
      });

      // Should not throw
      await timerService.abandon(USER_ID, 'close');

      // State should still exist (abandon for idle is a no-op, no clear)
      // Actually, looking at the code: if status === 'idle' it returns early
      const state = getMockStore().get(`timer:${USER_ID}`) as TimerState;
      expect(state).toBeDefined();
    });

    it('abandon clears state when running', async () => {
      await startFocusTimer();

      vi.setSystemTime(new Date('2026-04-07T10:10:00.000Z'));
      await timerService.abandon(USER_ID, 'timeout');

      const state = getMockStore().get(`timer:${USER_ID}`);
      expect(state).toBeUndefined();
    });

    it('full focus-break cycle flow', async () => {
      // Start focus
      const focus = await startFocusTimer();
      expect(focus.status).toBe('running');
      expect(focus.mode).toBe('focus');

      // Complete focus -> moves to break
      vi.setSystemTime(new Date('2026-04-07T10:25:00.000Z'));
      const { state: breakIdle } = await timerService.complete(USER_ID);
      expect(breakIdle.status).toBe('idle');
      expect(breakIdle.mode).toBe('break');

      // Start break
      const breakRunning = await timerService.start(
        USER_ID,
        'break',
        DEVICE_A,
        null,
        'General',
      );
      expect(breakRunning.status).toBe('running');
      expect(breakRunning.mode).toBe('break');

      // Complete break -> moves back to focus
      vi.setSystemTime(new Date('2026-04-07T10:30:00.000Z'));
      const { state: focusIdle } = await timerService.complete(USER_ID);
      expect(focusIdle.status).toBe('idle');
      expect(focusIdle.mode).toBe('focus');
    });
  });
});
