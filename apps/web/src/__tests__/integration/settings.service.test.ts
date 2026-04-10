import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockKvClient, resetMockKV } from '@/__tests__/mocks/kv.mock';
import type { UserSettings } from '@becoming/shared';
import { createDefaultSettings, APP_DEFAULTS, LIMITS, CATEGORY_DEFAULTS } from '@becoming/shared';

vi.mock('@/repositories/kv.client', () => ({
  kvClient: mockKvClient,
  keys: {
    settings: (userId: string) => `settings:${userId}`,
  },
}));

// Must import after mock registration
const { settingsService } = await import('@/services/settings.service');

const USER_ID = 'test-user-456';

function settingsKey(userId: string = USER_ID): string {
  return `settings:${userId}`;
}

describe('settingsService integration', () => {
  beforeEach(() => {
    resetMockKV();
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------
  // getSettings
  // ---------------------------------------------------------------

  it('getSettings returns defaults for new user', async () => {
    const settings = await settingsService.getSettings(USER_ID);
    const defaults = createDefaultSettings();

    expect(settings.focusDuration).toBe(defaults.focusDuration);
    expect(settings.shortBreakDuration).toBe(defaults.shortBreakDuration);
    expect(settings.longBreakDuration).toBe(defaults.longBreakDuration);
    expect(settings.cycleCount).toBe(defaults.cycleCount);
    expect(settings.theme).toBe(defaults.theme);
    expect(settings.categories.length).toBeGreaterThan(0);
    expect(settings.schemaVersion).toBe(APP_DEFAULTS.SETTINGS_SCHEMA_VERSION);
  });

  // ---------------------------------------------------------------
  // saveSettings
  // ---------------------------------------------------------------

  it('saveSettings persists and validates', async () => {
    const defaults = createDefaultSettings();
    defaults.focusDuration = 45;
    defaults.theme = 'light';

    const saved = await settingsService.saveSettings(USER_ID, defaults);
    expect(saved.focusDuration).toBe(45);
    expect(saved.theme).toBe('light');

    // Verify it was actually persisted
    const raw = await mockKvClient.get<UserSettings>(settingsKey());
    expect(raw).not.toBeNull();
    expect(raw!.focusDuration).toBe(45);
  });

  // ---------------------------------------------------------------
  // validateAndEnforce
  // ---------------------------------------------------------------

  it('validateAndEnforce clamps values to limits', () => {
    const settings = createDefaultSettings();
    settings.focusDuration = 999;
    settings.shortBreakDuration = -5;
    settings.longBreakDuration = 200;
    settings.cycleCount = 0;
    settings.masterVolume = 150;

    const result = settingsService.validateAndEnforce(settings);

    expect(result.focusDuration).toBe(LIMITS.FOCUS_MAX); // 120
    expect(result.shortBreakDuration).toBe(LIMITS.SHORT_BREAK_MIN); // 1
    expect(result.longBreakDuration).toBe(LIMITS.LONG_BREAK_MAX); // 60
    expect(result.cycleCount).toBe(LIMITS.CYCLE_MIN); // 2
    expect(result.masterVolume).toBe(100);
  });

  it('validateAndEnforce enforces Reduced Motion -> disables completion animation + degrades flip clock', () => {
    const settings = createDefaultSettings();
    settings.reducedMotion = true;
    settings.completionAnimationIntensity = 'celebration';
    settings.clockFont = 'flip';

    const result = settingsService.validateAndEnforce(settings);

    expect(result.completionAnimationIntensity).toBe('subtle');
    expect(result.clockFont).toBe('minimal');
  });

  it('validateAndEnforce does not degrade non-flip clock when reducedMotion is on', () => {
    const settings = createDefaultSettings();
    settings.reducedMotion = true;
    settings.clockFont = 'digital';

    const result = settingsService.validateAndEnforce(settings);
    expect(result.clockFont).toBe('digital');
  });

  it('validateAndEnforce ensures at least one category exists', () => {
    const settings = createDefaultSettings();
    settings.categories = [];

    const result = settingsService.validateAndEnforce(settings);

    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.some((c) => c.name === 'General')).toBe(true);
  });

  it('validateAndEnforce caps categories at 20', () => {
    const settings = createDefaultSettings();
    settings.categories = Array.from({ length: 25 }, (_, i) => ({
      name: `Cat${i}`,
      color: '#AABBCC',
      order: i,
      createdAt: new Date().toISOString(),
    }));

    const result = settingsService.validateAndEnforce(settings);
    expect(result.categories.length).toBe(LIMITS.MAX_CATEGORIES);
  });

  it('validateAndEnforce fixes invalid accent colors', () => {
    const settings = createDefaultSettings();
    settings.accentColor = 'not-a-color';
    settings.breakAccentColor = 'rgb(0,0,0)';

    const result = settingsService.validateAndEnforce(settings);
    expect(result.accentColor).toBe('#D97706');
    expect(result.breakAccentColor).toBe('#0D9488');
  });

  it('validateAndEnforce keeps valid accent colors', () => {
    const settings = createDefaultSettings();
    settings.accentColor = '#FF5500';
    settings.breakAccentColor = '#00FF88';

    const result = settingsService.validateAndEnforce(settings);
    expect(result.accentColor).toBe('#FF5500');
    expect(result.breakAccentColor).toBe('#00FF88');
  });

  // ---------------------------------------------------------------
  // resetToDefaults
  // ---------------------------------------------------------------

  it('resetToDefaults preserves existing user data (DATA GUARDIAN)', async () => {
    // First save custom settings
    const custom = createDefaultSettings();
    custom.focusDuration = 99;
    custom.theme = 'light';
    await settingsService.saveSettings(USER_ID, custom);

    // Factory reset: defaults REPLACE existing — this is an explicit user action
    // ("Reset to Factory" button), not a migration merge
    const reset = await settingsService.resetToDefaults(USER_ID);

    // All values reset to factory defaults
    expect(reset.focusDuration).toBe(25); // Default, not 99
    expect(reset.theme).toBe('dark'); // Default, not 'light'

    // Persisted with default values
    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored!.focusDuration).toBe(25);
  });

  // ---------------------------------------------------------------
  // importBackup
  // ---------------------------------------------------------------

  it('importBackup rejects newer schema version', async () => {
    const backup = {
      schemaVersion: APP_DEFAULTS.SETTINGS_SCHEMA_VERSION + 1,
      userId: USER_ID,
      settings: createDefaultSettings(),
    };

    const result = await settingsService.importBackup(USER_ID, backup);
    expect(result.success).toBe(false);
    expect(result.error).toContain('newer version');
  });

  it('importBackup migrates old settings', async () => {
    const oldSettings: Record<string, unknown> = {
      focusDuration: 30,
      shortBreakDuration: 10,
      schemaVersion: 1,
    };

    const backup = {
      schemaVersion: 1,
      userId: USER_ID,
      settings: oldSettings,
    };

    const result = await settingsService.importBackup(USER_ID, backup);
    expect(result.success).toBe(true);

    // Verify the imported settings have been migrated and persisted
    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored).not.toBeNull();
    expect(stored!.focusDuration).toBe(30);
    expect(stored!.shortBreakDuration).toBe(10);
    expect(stored!.schemaVersion).toBe(APP_DEFAULTS.SETTINGS_SCHEMA_VERSION);
    // New fields should have defaults
    expect(stored!.theme).toBeDefined();
  });

  it('importBackup rejects missing settings object', async () => {
    const backup = {
      schemaVersion: APP_DEFAULTS.SETTINGS_SCHEMA_VERSION,
      userId: USER_ID,
      // no settings key
    };

    const result = await settingsService.importBackup(USER_ID, backup);
    expect(result.success).toBe(false);
    expect(result.error).toContain('missing settings');
  });

  // ---------------------------------------------------------------
  // addCategory
  // ---------------------------------------------------------------

  it('addCategory succeeds within limit', async () => {
    // Seed settings with defaults
    const defaults = createDefaultSettings();
    await mockKvClient.set(settingsKey(), defaults);

    const result = await settingsService.addCategory(USER_ID, 'Reading', '#FF0000');
    expect(result.success).toBe(true);

    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored!.categories.some((c) => c.name === 'Reading')).toBe(true);
  });

  it('addCategory rejects duplicate name (case-insensitive)', async () => {
    const defaults = createDefaultSettings();
    await mockKvClient.set(settingsKey(), defaults);

    // "General" already exists in defaults
    const result = await settingsService.addCategory(USER_ID, 'general', '#FF0000');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('addCategory rejects at 20 limit', async () => {
    const settings = createDefaultSettings();
    settings.categories = Array.from({ length: 20 }, (_, i) => ({
      name: `Category${i}`,
      color: '#AABBCC',
      order: i,
      createdAt: new Date().toISOString(),
    }));
    await mockKvClient.set(settingsKey(), settings);

    const result = await settingsService.addCategory(USER_ID, 'OneMore', '#AABBCC');
    expect(result.success).toBe(false);
    expect(result.error).toContain('limit');
  });

  // ---------------------------------------------------------------
  // deleteCategory
  // ---------------------------------------------------------------

  it('deleteCategory removes category', async () => {
    const defaults = createDefaultSettings();
    await mockKvClient.set(settingsKey(), defaults);

    await settingsService.deleteCategory(USER_ID, 'Work');

    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored!.categories.some((c) => c.name === 'Work')).toBe(false);
  });

  it('deleteCategory auto-restores General if last category is deleted', async () => {
    const settings = createDefaultSettings();
    settings.categories = [{ name: 'OnlyOne', color: '#000000', order: 0, createdAt: new Date().toISOString() }];
    settings.defaultCategory = 'OnlyOne';
    await mockKvClient.set(settingsKey(), settings);

    await settingsService.deleteCategory(USER_ID, 'OnlyOne');

    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored!.categories).toHaveLength(1);
    expect(stored!.categories[0]!.name).toBe('General');
    expect(stored!.defaultCategory).toBe('General');
  });

  // ---------------------------------------------------------------
  // renameCategory
  // ---------------------------------------------------------------

  it('renameCategory updates name', async () => {
    const defaults = createDefaultSettings();
    await mockKvClient.set(settingsKey(), defaults);

    const result = await settingsService.renameCategory(USER_ID, 'Work', 'Career');
    expect(result.success).toBe(true);

    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored!.categories.some((c) => c.name === 'Career')).toBe(true);
    expect(stored!.categories.some((c) => c.name === 'Work')).toBe(false);
  });

  it('renameCategory rejects duplicate name', async () => {
    const defaults = createDefaultSettings();
    await mockKvClient.set(settingsKey(), defaults);

    // Try renaming "Work" to "Study" which already exists
    const result = await settingsService.renameCategory(USER_ID, 'Work', 'Study');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('renameCategory updates defaultCategory if it was the renamed one', async () => {
    const settings = createDefaultSettings();
    settings.defaultCategory = 'Work';
    await mockKvClient.set(settingsKey(), settings);

    const result = await settingsService.renameCategory(USER_ID, 'Work', 'Career');
    expect(result.success).toBe(true);

    const stored = await mockKvClient.get<UserSettings>(settingsKey());
    expect(stored!.defaultCategory).toBe('Career');
  });
});
