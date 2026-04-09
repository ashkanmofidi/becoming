/** Timer states. PRD Section 5.2 */
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'overtime';

/** Timer modes. PRD Section 5.1 */
export type TimerMode = 'focus' | 'break' | 'long_break';

/** Server-side timer state. PRD Section 5.2.7 (KV key: timer:{userId}) */
export interface TimerState {
  status: TimerStatus;
  mode: TimerMode;
  startedAt: string | null;
  pausedAt: string | null;
  configuredDuration: number;
  controllingDeviceId: string | null;
  lastHeartbeatAt: string | null;
  intent: string | null;
  category: string;
  cycleNumber: number;
  overtimeStartedAt: string | null;
}

/** Completed session record. PRD Section 8 */
export interface SessionRecord {
  id: string;
  userId: string;
  date: string;
  startedAt: string;
  completedAt: string;
  mode: TimerMode;
  configuredDuration: number;
  actualDuration: number;
  overtimeDuration: number;
  intent: string | null;
  category: string;
  status: 'completed' | 'abandoned';
  abandonReason?: 'skip' | 'reset' | 'switch' | 'close' | 'timeout';
  notes: string | null;
  deviceId: string;
  deletedAt: string | null;
}

/** Daily aggregation for dashboard. PRD Section 7 */
export interface DailyAggregation {
  date: string;
  focusSessions: number;
  breakSessions: number;
  longBreakSessions: number;
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  goalMet: boolean;
  categories: Record<string, number>;
  topIntents: Array<{ intent: string; count: number }>;
}
