import type { UserSettings } from '../types/settings';
import { APP_DEFAULTS, TIMER_DEFAULTS, BEHAVIOR_DEFAULTS, DISPLAY_DEFAULTS, SOUND_DEFAULTS, CATEGORY_DEFAULTS, SHORTCUTS_DEFAULTS, FOCUS_MODE_DEFAULTS, STREAK_GOALS_DEFAULTS, NOTIFICATION_DEFAULTS, SESSION_DATA_DEFAULTS, ACCESSIBILITY_DEFAULTS } from '../constants/defaults';

/**
 * Settings migration engine. PRD Section 6.11, Data Preservation rules.
 * Migrations are additive: add new fields with defaults, never remove or rename.
 */

/**
 * Creates a fresh settings object with all defaults.
 */
export function createDefaultSettings(): UserSettings {
  const now = new Date().toISOString();
  return {
    focusDuration: TIMER_DEFAULTS.FOCUS_DURATION,
    shortBreakDuration: TIMER_DEFAULTS.SHORT_BREAK_DURATION,
    longBreakDuration: TIMER_DEFAULTS.LONG_BREAK_DURATION,
    cycleCount: TIMER_DEFAULTS.CYCLE_COUNT,
    minCountableSession: TIMER_DEFAULTS.MIN_COUNTABLE_SESSION,
    overtimeAllowance: TIMER_DEFAULTS.OVERTIME_ALLOWANCE,
    autoStartBreaks: BEHAVIOR_DEFAULTS.AUTO_START_BREAKS,
    autoStartFocus: BEHAVIOR_DEFAULTS.AUTO_START_FOCUS,
    desktopNotifications: BEHAVIOR_DEFAULTS.DESKTOP_NOTIFICATIONS,
    notifySessionComplete: BEHAVIOR_DEFAULTS.NOTIFY_SESSION_COMPLETE,
    notifyBreakComplete: BEHAVIOR_DEFAULTS.NOTIFY_BREAK_COMPLETE,
    notifyDailyGoal: BEHAVIOR_DEFAULTS.NOTIFY_DAILY_GOAL,
    notifyStreakMilestone: BEHAVIOR_DEFAULTS.NOTIFY_STREAK_MILESTONE,
    notificationStyle: BEHAVIOR_DEFAULTS.NOTIFICATION_STYLE,
    dailyGoal: BEHAVIOR_DEFAULTS.DAILY_GOAL,
    strictMode: BEHAVIOR_DEFAULTS.STRICT_MODE,
    dayResetTime: BEHAVIOR_DEFAULTS.DAY_RESET_TIME,
    dayResetTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    streakCalculation: BEHAVIOR_DEFAULTS.STREAK_CALCULATION,
    streakFreezePerMonth: BEHAVIOR_DEFAULTS.STREAK_FREEZE_PER_MONTH,
    confirmLogoutWithActiveTimer: BEHAVIOR_DEFAULTS.CONFIRM_LOGOUT_WITH_ACTIVE_TIMER,
    theme: DISPLAY_DEFAULTS.THEME,
    fontSize: DISPLAY_DEFAULTS.FONT_SIZE,
    accentColor: DISPLAY_DEFAULTS.ACCENT_COLOR,
    breakAccentColor: DISPLAY_DEFAULTS.BREAK_ACCENT_COLOR,
    clockFont: DISPLAY_DEFAULTS.CLOCK_FONT,
    showSeconds: DISPLAY_DEFAULTS.SHOW_SECONDS,
    reducedMotion: DISPLAY_DEFAULTS.REDUCED_MOTION,
    completionAnimationIntensity: DISPLAY_DEFAULTS.COMPLETION_ANIMATION_INTENSITY,
    tabTitleTimer: DISPLAY_DEFAULTS.TAB_TITLE_TIMER,
    dynamicFavicon: DISPLAY_DEFAULTS.DYNAMIC_FAVICON,
    soundTheme: SOUND_DEFAULTS.SOUND_THEME,
    masterVolume: SOUND_DEFAULTS.MASTER_VOLUME,
    customCompletionSound: SOUND_DEFAULTS.CUSTOM_COMPLETION_SOUND,
    tickDuringFocus: SOUND_DEFAULTS.TICK_DURING_FOCUS,
    tickDuringBreaks: SOUND_DEFAULTS.TICK_DURING_BREAKS,
    last30sTicking: SOUND_DEFAULTS.LAST_30S_TICKING,
    hapticEnabled: SOUND_DEFAULTS.HAPTIC_ENABLED,
    hapticCompletion: SOUND_DEFAULTS.HAPTIC_COMPLETION,
    hapticPauseResume: SOUND_DEFAULTS.HAPTIC_PAUSE_RESUME,
    hapticLast10s: SOUND_DEFAULTS.HAPTIC_LAST_10S,
    respectSilentMode: SOUND_DEFAULTS.RESPECT_SILENT_MODE,
    ambientSound: SOUND_DEFAULTS.AMBIENT_SOUND,
    ambientVolume: SOUND_DEFAULTS.AMBIENT_VOLUME,
    categories: CATEGORY_DEFAULTS.INITIAL_CATEGORIES.map((c, i) => ({
      name: c.name,
      color: c.color,
      order: i,
      createdAt: now,
    })),
    defaultCategory: CATEGORY_DEFAULTS.DEFAULT_CATEGORY,
    shortcutsEnabled: SHORTCUTS_DEFAULTS.ENABLED,
    shortcutBindings: { ...SHORTCUTS_DEFAULTS.BINDINGS },
    screenWakeLock: FOCUS_MODE_DEFAULTS.SCREEN_WAKE_LOCK,
    fullscreenFocus: FOCUS_MODE_DEFAULTS.FULLSCREEN_FOCUS,
    weeklyGoalEnabled: STREAK_GOALS_DEFAULTS.WEEKLY_GOAL_ENABLED,
    weeklyGoalTarget: STREAK_GOALS_DEFAULTS.WEEKLY_GOAL_TARGET,
    milestoneCelebrations: STREAK_GOALS_DEFAULTS.MILESTONE_CELEBRATIONS,
    idleReminder: NOTIFICATION_DEFAULTS.IDLE_REMINDER,
    idleReminderDelay: NOTIFICATION_DEFAULTS.IDLE_REMINDER_DELAY,
    dailySummary: NOTIFICATION_DEFAULTS.DAILY_SUMMARY,
    dailySummaryTime: NOTIFICATION_DEFAULTS.DAILY_SUMMARY_TIME,
    emailNotifications: NOTIFICATION_DEFAULTS.EMAIL_NOTIFICATIONS,
    emailWeeklySummary: NOTIFICATION_DEFAULTS.EMAIL_WEEKLY_SUMMARY,
    emailStreakAtRisk: NOTIFICATION_DEFAULTS.EMAIL_STREAK_AT_RISK,
    emailMilestones: NOTIFICATION_DEFAULTS.EMAIL_MILESTONES,
    intentAutocomplete: SESSION_DATA_DEFAULTS.INTENT_AUTOCOMPLETE,
    autoLogSessions: SESSION_DATA_DEFAULTS.AUTO_LOG_SESSIONS,
    sessionNotes: SESSION_DATA_DEFAULTS.SESSION_NOTES,
    screenReaderVerbosity: ACCESSIBILITY_DEFAULTS.SCREEN_READER_VERBOSITY,
    highContrast: ACCESSIBILITY_DEFAULTS.HIGH_CONTRAST,
    largeTapTargets: ACCESSIBILITY_DEFAULTS.LARGE_TAP_TARGETS,
    colorBlindMode: ACCESSIBILITY_DEFAULTS.COLOR_BLIND_MODE,
    schemaVersion: APP_DEFAULTS.SETTINGS_SCHEMA_VERSION,
    updatedAt: now,
  };
}

/**
 * Migrates settings from an older schema version to current.
 * PRD: Additive only. Never removes fields.
 */
export function migrateSettings(oldSettings: Record<string, unknown>): UserSettings {
  const defaults = createDefaultSettings();
  const version = (oldSettings.schemaVersion as number) || 1;

  const migrated: UserSettings = { ...defaults };

  for (const key of Object.keys(defaults) as Array<keyof UserSettings>) {
    if (key in oldSettings && oldSettings[key] !== undefined) {
      (migrated as unknown as Record<string, unknown>)[key] = oldSettings[key];
    }
  }

  migrated.schemaVersion = APP_DEFAULTS.SETTINGS_SCHEMA_VERSION;
  migrated.updatedAt = new Date().toISOString();

  return migrated;
}
