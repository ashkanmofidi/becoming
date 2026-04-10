/** All user settings with defaults. PRD Section 6 + Appendix A */
export interface UserSettings {
  // Timer (Section 6.1)
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  cycleCount: number;
  overtimeAllowance: boolean;

  // Behavior (Section 6.2)
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  desktopNotifications: boolean;
  notifySessionComplete: boolean;
  notifyBreakComplete: boolean;
  notifyDailyGoal: boolean;
  notifyStreakMilestone: boolean;
  notificationStyle: 'standard' | 'persistent';
  dailyGoal: number;
  strictMode: boolean;
  dayResetTime: string;
  dayResetTimezone: string;
  streakCalculation: 'one_session' | 'meet_goal' | 'open_app';
  streakFreezePerMonth: number;
  confirmLogoutWithActiveTimer: boolean;
  muted: boolean;

  // Display (Section 6.3)
  theme: 'dark' | 'light' | 'system';
  fontSize: 'small' | 'normal' | 'large' | 'xl';
  accentColor: string;
  breakAccentColor: string;
  clockFont: 'flip' | 'digital' | 'minimal' | 'analog';
  showSeconds: boolean;
  reducedMotion: boolean;
  completionAnimationIntensity: 'subtle' | 'standard' | 'celebration';
  tabTitleTimer: boolean;
  dynamicFavicon: boolean;

  // Sound (Section 6.4)
  soundTheme: 'warm' | 'minimal' | 'nature' | 'silent';
  masterVolume: number;
  customCompletionSound: string | null;
  tickDuringFocus: boolean;
  tickDuringBreaks: boolean;
  last30sTicking: boolean;
  hapticEnabled: boolean;
  hapticCompletion: boolean;
  hapticPauseResume: boolean;
  hapticLast10s: boolean;
  respectSilentMode: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number;

  // Categories (Section 6.5)
  categories: Category[];
  defaultCategory: string;

  // Shortcuts (Section 6.6)
  shortcutsEnabled: boolean;
  shortcutBindings: Record<string, string>;

  // Focus Mode (Section 6.7)
  screenWakeLock: boolean;
  fullscreenFocus: boolean;

  // Streak & Goals (Section 6.8)
  weeklyGoalEnabled: boolean;
  weeklyGoalTarget: number;
  milestoneCelebrations: boolean;

  // Notifications (Section 6.9)
  idleReminder: boolean;
  idleReminderDelay: number;
  dailySummary: boolean;
  dailySummaryTime: string;
  emailNotifications: boolean;
  emailWeeklySummary: boolean;
  emailStreakAtRisk: boolean;
  emailMilestones: boolean;

  // Session & Data (Section 6.10)
  intentAutocomplete: boolean;
  autoLogSessions: boolean;
  sessionNotes: boolean;

  // Accessibility (Section 6.12)
  screenReaderVerbosity: 'standard' | 'minimal' | 'verbose';
  highContrast: boolean;
  largeTapTargets: boolean;
  colorBlindMode: 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia';

  // Metadata
  schemaVersion: number;
  updatedAt: string;
}

/** Session category. PRD Section 6.5 */
export interface Category {
  name: string;
  color: string;
  order: number;
  createdAt: string;
}

/** Ambient sound options. PRD Section 5.7 */
export type AmbientSoundType =
  | 'none'
  | 'white_noise'
  | 'brown_noise'
  | 'rain'
  | 'coffee_shop'
  | 'lofi_beats'
  | 'forest';
