import { describe, it, expect } from 'vitest';
import { createDefaultSettings, migrateSettings } from './migration';
import { APP_DEFAULTS } from '../constants/defaults';

describe('createDefaultSettings', () => {
  it('creates settings with all timer defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.focusDuration).toBe(25);
    expect(settings.shortBreakDuration).toBe(5);
    expect(settings.longBreakDuration).toBe(15);
    expect(settings.cycleCount).toBe(4);
    expect(settings.overtimeAllowance).toBe(false);
  });

  it('creates settings with all behavior defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.dailyGoal).toBe(4);
    expect(settings.strictMode).toBe(false);
    expect(settings.autoStartBreaks).toBe(false);
    expect(settings.autoStartFocus).toBe(false);
    expect(settings.dayResetTime).toBe('00:00');
    expect(settings.streakCalculation).toBe('one_session');
    expect(settings.streakFreezePerMonth).toBe(2);
  });

  it('creates settings with all display defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.theme).toBe('dark');
    expect(settings.showSeconds).toBe(true);
    expect(settings.clockFont).toBe('flip');
    expect(settings.accentColor).toBe('#D97706');
    expect(settings.breakAccentColor).toBe('#0D9488');
    expect(settings.reducedMotion).toBe(false);
    expect(settings.tabTitleTimer).toBe(true);
    expect(settings.dynamicFavicon).toBe(true);
  });

  it('creates settings with all sound defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.soundTheme).toBe('warm');
    expect(settings.masterVolume).toBe(60);
    expect(settings.tickDuringFocus).toBe(false);
    expect(settings.last30sTicking).toBe(true);
    expect(settings.hapticEnabled).toBe(true);
    expect(settings.ambientSound).toBe('none');
    expect(settings.ambientVolume).toBe(30);
  });

  it('creates settings with correct schema version', () => {
    const settings = createDefaultSettings();
    expect(settings.schemaVersion).toBe(APP_DEFAULTS.SETTINGS_SCHEMA_VERSION);
  });

  it('creates valid categories with correct defaults', () => {
    const settings = createDefaultSettings();
    const names = settings.categories.map((c) => c.name);
    expect(settings.categories).toHaveLength(6);
    expect(names).toContain('General');
    expect(names).toContain('Work');
    expect(names).toContain('Study');
    expect(names).toContain('Personal');
    expect(names).toContain('Health');
    expect(names).toContain('Creative');
  });

  it('sets default category to General', () => {
    const settings = createDefaultSettings();
    expect(settings.defaultCategory).toBe('General');
  });

  it('categories have correct colors', () => {
    const settings = createDefaultSettings();
    const general = settings.categories.find((c) => c.name === 'General');
    const work = settings.categories.find((c) => c.name === 'Work');
    expect(general?.color).toBe('#6B7280');
    expect(work?.color).toBe('#D97706');
  });

  it('categories have sequential order values', () => {
    const settings = createDefaultSettings();
    settings.categories.forEach((cat, i) => {
      expect(cat.order).toBe(i);
    });
  });

  it('categories have createdAt timestamps', () => {
    const settings = createDefaultSettings();
    settings.categories.forEach((cat) => {
      expect(cat.createdAt).toBeDefined();
      expect(new Date(cat.createdAt).getTime()).not.toBeNaN();
    });
  });

  it('sets updatedAt to a valid ISO timestamp', () => {
    const before = Date.now();
    const settings = createDefaultSettings();
    const after = Date.now();
    const updatedAt = new Date(settings.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });

  it('includes notification defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.desktopNotifications).toBe(true);
    expect(settings.notifySessionComplete).toBe(true);
    expect(settings.notifyBreakComplete).toBe(true);
    expect(settings.notifyDailyGoal).toBe(true);
    expect(settings.idleReminder).toBe(false);
    expect(settings.emailNotifications).toBe(false);
  });

  it('includes accessibility defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.screenReaderVerbosity).toBe('standard');
    expect(settings.highContrast).toBe(false);
    expect(settings.largeTapTargets).toBe(false);
    expect(settings.colorBlindMode).toBe('off');
  });

  it('includes keyboard shortcut defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.shortcutsEnabled).toBe(true);
    expect(settings.shortcutBindings).toBeDefined();
    expect(settings.shortcutBindings['play_pause']).toBe('Space');
    expect(settings.shortcutBindings['reset']).toBe('r');
  });

  it('includes focus mode defaults', () => {
    const settings = createDefaultSettings();
    expect(settings.screenWakeLock).toBe(true);
    expect(settings.fullscreenFocus).toBe(false);
  });
});

describe('migrateSettings', () => {
  it('preserves existing values and fills missing with defaults', () => {
    const old = { focusDuration: 30, schemaVersion: 1 };
    const migrated = migrateSettings(old);

    expect(migrated.focusDuration).toBe(30); // preserved
    expect(migrated.shortBreakDuration).toBe(5); // default
    expect(migrated.schemaVersion).toBe(APP_DEFAULTS.SETTINGS_SCHEMA_VERSION); // updated
  });

  it('handles empty old settings', () => {
    const migrated = migrateSettings({});
    expect(migrated.focusDuration).toBe(25);
    expect(migrated.shortBreakDuration).toBe(5);
    expect(migrated.longBreakDuration).toBe(15);
    expect(migrated.schemaVersion).toBe(APP_DEFAULTS.SETTINGS_SCHEMA_VERSION);
  });

  it('migrates v2 settings preserving all existing values', () => {
    const v2 = {
      focusDuration: 45,
      shortBreakDuration: 10,
      dailyGoal: 6,
      theme: 'light',
      schemaVersion: 2,
    };
    const migrated = migrateSettings(v2);
    expect(migrated.focusDuration).toBe(45);
    expect(migrated.shortBreakDuration).toBe(10);
    expect(migrated.dailyGoal).toBe(6);
    expect(migrated.theme).toBe('light');
    // New fields get defaults
    expect(migrated.strictMode).toBe(false);
    expect(migrated.overtimeAllowance).toBe(false);
  });

  it('always updates schemaVersion to latest', () => {
    const old = { schemaVersion: 1 };
    const migrated = migrateSettings(old);
    expect(migrated.schemaVersion).toBe(APP_DEFAULTS.SETTINGS_SCHEMA_VERSION);
  });

  it('always updates updatedAt', () => {
    const old = { updatedAt: '2020-01-01T00:00:00Z' };
    const before = Date.now();
    const migrated = migrateSettings(old);
    const after = Date.now();
    const updatedAt = new Date(migrated.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });

  it('preserves custom categories from old settings', () => {
    const customCategories = [
      { name: 'MyCategory', color: '#FF0000', order: 0, createdAt: '2026-01-01T00:00:00Z' },
    ];
    const old = { categories: customCategories, schemaVersion: 2 };
    const migrated = migrateSettings(old);
    expect(migrated.categories).toEqual(customCategories);
  });

  it('preserves boolean false values (does not overwrite with defaults)', () => {
    const old = {
      desktopNotifications: false, // default is true
      showSeconds: false, // default is true
      schemaVersion: 2,
    };
    const migrated = migrateSettings(old);
    expect(migrated.desktopNotifications).toBe(false);
    expect(migrated.showSeconds).toBe(false);
  });

  it('preserves zero numeric values', () => {
    const old = {
      masterVolume: 0, // default is 60
      schemaVersion: 2,
    };
    const migrated = migrateSettings(old);
    expect(migrated.masterVolume).toBe(0);
  });

  it('does not preserve undefined values (uses defaults instead)', () => {
    const old = {
      focusDuration: undefined,
      schemaVersion: 2,
    };
    const migrated = migrateSettings(old);
    expect(migrated.focusDuration).toBe(25); // default, not undefined
  });

  it('ignores unknown keys from old settings', () => {
    const old = {
      focusDuration: 30,
      unknownField: 'should be ignored',
      anotherUnknown: 42,
      schemaVersion: 1,
    };
    const migrated = migrateSettings(old);
    expect(migrated.focusDuration).toBe(30);
    expect((migrated as unknown as Record<string, unknown>)['unknownField']).toBeUndefined();
    expect((migrated as unknown as Record<string, unknown>)['anotherUnknown']).toBeUndefined();
  });

  it('returns a complete UserSettings object', () => {
    const migrated = migrateSettings({});
    // Spot-check that all major sections are present
    expect(migrated.focusDuration).toBeDefined();
    expect(migrated.theme).toBeDefined();
    expect(migrated.soundTheme).toBeDefined();
    expect(migrated.categories).toBeDefined();
    expect(migrated.shortcutsEnabled).toBeDefined();
    expect(migrated.screenWakeLock).toBeDefined();
    expect(migrated.weeklyGoalEnabled).toBeDefined();
    expect(migrated.idleReminder).toBeDefined();
    expect(migrated.intentAutocomplete).toBeDefined();
    expect(migrated.screenReaderVerbosity).toBeDefined();
    expect(migrated.schemaVersion).toBeDefined();
    expect(migrated.updatedAt).toBeDefined();
  });
});
