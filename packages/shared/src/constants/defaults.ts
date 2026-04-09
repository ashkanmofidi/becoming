/** Default values from PRD Appendix A. Every default in the app comes from here. */

export const TIMER_DEFAULTS = {
  FOCUS_DURATION: 25,
  SHORT_BREAK_DURATION: 5,
  LONG_BREAK_DURATION: 15,
  CYCLE_COUNT: 4,
  MIN_COUNTABLE_SESSION: 10,
  OVERTIME_ALLOWANCE: false,
} as const;

export const BEHAVIOR_DEFAULTS = {
  AUTO_START_BREAKS: false,
  AUTO_START_FOCUS: false,
  DESKTOP_NOTIFICATIONS: true,
  NOTIFY_SESSION_COMPLETE: true,
  NOTIFY_BREAK_COMPLETE: true,
  NOTIFY_DAILY_GOAL: true,
  NOTIFY_STREAK_MILESTONE: true,
  NOTIFICATION_STYLE: 'standard' as const,
  DAILY_GOAL: 4,
  STRICT_MODE: false,
  DAY_RESET_TIME: '00:00',
  STREAK_CALCULATION: 'one_session' as const,
  STREAK_FREEZE_PER_MONTH: 2,
} as const;

export const DISPLAY_DEFAULTS = {
  THEME: 'dark' as const,
  FONT_SIZE: 'normal' as const,
  ACCENT_COLOR: '#D97706',
  BREAK_ACCENT_COLOR: '#0D9488',
  CLOCK_FONT: 'flip' as const,
  SHOW_SECONDS: true,
  REDUCED_MOTION: false,
  COMPLETION_ANIMATION_INTENSITY: 'standard' as const,
  TAB_TITLE_TIMER: true,
  DYNAMIC_FAVICON: true,
} as const;

export const SOUND_DEFAULTS = {
  SOUND_THEME: 'warm' as const,
  MASTER_VOLUME: 60,
  CUSTOM_COMPLETION_SOUND: null,
  TICK_DURING_FOCUS: false,
  TICK_DURING_BREAKS: false,
  LAST_30S_TICKING: true,
  HAPTIC_ENABLED: true,
  HAPTIC_COMPLETION: true,
  HAPTIC_PAUSE_RESUME: true,
  HAPTIC_LAST_10S: false,
  RESPECT_SILENT_MODE: true,
  AMBIENT_SOUND: 'none' as const,
  AMBIENT_VOLUME: 30,
} as const;

export const CATEGORY_DEFAULTS = {
  DEFAULT_CATEGORY: 'General',
  INITIAL_CATEGORIES: [
    { name: 'General', color: '#6B7280' },
    { name: 'Work', color: '#D97706' },
    { name: 'Study', color: '#2563EB' },
    { name: 'Personal', color: '#7C3AED' },
    { name: 'Health', color: '#16A34A' },
    { name: 'Creative', color: '#EC4899' },
  ],
} as const;

export const SHORTCUTS_DEFAULTS = {
  ENABLED: true,
  BINDINGS: {
    'play_pause': 'Space',
    'reset': 'r',
    'skip': 's',
    'fullscreen': 'f',
    'mute': 'm',
    'focus_mode': '1',
    'break_mode': '2',
    'long_break_mode': '3',
    'show_shortcuts': '?',
  },
} as const;

export const FOCUS_MODE_DEFAULTS = {
  SCREEN_WAKE_LOCK: true,
  FULLSCREEN_FOCUS: false,
} as const;

export const STREAK_GOALS_DEFAULTS = {
  WEEKLY_GOAL_ENABLED: false,
  WEEKLY_GOAL_TARGET: 20,
  MILESTONE_CELEBRATIONS: true,
} as const;

export const NOTIFICATION_DEFAULTS = {
  IDLE_REMINDER: false,
  IDLE_REMINDER_DELAY: 15,
  DAILY_SUMMARY: false,
  DAILY_SUMMARY_TIME: '20:00',
  EMAIL_NOTIFICATIONS: false,
  EMAIL_WEEKLY_SUMMARY: false,
  EMAIL_STREAK_AT_RISK: false,
  EMAIL_MILESTONES: false,
} as const;

export const SESSION_DATA_DEFAULTS = {
  INTENT_AUTOCOMPLETE: true,
  AUTO_LOG_SESSIONS: true,
  SESSION_NOTES: false,
} as const;

export const ACCESSIBILITY_DEFAULTS = {
  SCREEN_READER_VERBOSITY: 'standard' as const,
  HIGH_CONTRAST: false,
  LARGE_TAP_TARGETS: false,
  COLOR_BLIND_MODE: 'off' as const,
} as const;

export const APP_DEFAULTS = {
  SETTINGS_SCHEMA_VERSION: 3,
  BETA_CAP: 10,
  SUPER_ADMIN_EMAIL: 'ashkan.mofidi@gmail.com',
  TOS_VERSION: '1.0',
  PRIVACY_POLICY_VERSION: '1.0',
} as const;
