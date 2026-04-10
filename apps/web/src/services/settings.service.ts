import { settingsRepo } from '../repositories/settings.repo';
import type { UserSettings } from '@becoming/shared';
import { LIMITS, APP_DEFAULTS, CATEGORY_DEFAULTS } from '@becoming/shared';
import { migrateSettings, validateStepperValue, validateCategoryName, validateHexColor } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('settings-service');

/**
 * Settings service. PRD Section 6.
 * Handles validation, feature interactions, import/export.
 */
export const settingsService = {
  /**
   * Get settings for a user. Returns migrated settings with defaults.
   */
  async getSettings(userId: string): Promise<UserSettings> {
    const settings = await settingsRepo.get(userId);
    // Always validate on read — catches stale data with broken invariants
    return this.validateAndEnforce(settings);
  },

  /**
   * Save settings with validation and feature interaction enforcement.
   * PRD Section 6.0: Auto-save to KV. Last-write-wins.
   */
  async saveSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
    const validated = this.validateAndEnforce(settings);
    await settingsRepo.save(userId, validated);
    return validated;
  },

  /**
   * Update a single setting. Merges with existing settings.
   */
  async updateSetting(
    userId: string,
    key: keyof UserSettings,
    value: unknown,
  ): Promise<UserSettings> {
    const current = await settingsRepo.get(userId);
    (current as unknown as Record<string, unknown>)[key] = value;
    return this.saveSettings(userId, current);
  },

  /**
   * Validate all settings and enforce feature interactions.
   * PRD Appendix B: Feature Interaction Matrix.
   */
  validateAndEnforce(settings: UserSettings): UserSettings {
    const s = { ...settings };

    // Timer ranges (PRD 6.1)
    s.focusDuration = validateStepperValue(s.focusDuration, LIMITS.FOCUS_MIN, LIMITS.FOCUS_MAX);
    s.shortBreakDuration = validateStepperValue(s.shortBreakDuration, LIMITS.SHORT_BREAK_MIN, LIMITS.SHORT_BREAK_MAX);
    s.longBreakDuration = validateStepperValue(s.longBreakDuration, LIMITS.LONG_BREAK_MIN, LIMITS.LONG_BREAK_MAX);
    s.cycleCount = validateStepperValue(s.cycleCount, LIMITS.CYCLE_MIN, LIMITS.CYCLE_MAX);
    s.dailyGoal = validateStepperValue(s.dailyGoal, LIMITS.DAILY_GOAL_MIN, LIMITS.DAILY_GOAL_MAX);
    s.streakFreezePerMonth = validateStepperValue(s.streakFreezePerMonth, LIMITS.STREAK_FREEZE_MIN, LIMITS.STREAK_FREEZE_MAX);
    s.masterVolume = validateStepperValue(s.masterVolume, 0, 100);
    s.ambientVolume = validateStepperValue(s.ambientVolume, 0, 100);
    s.idleReminderDelay = validateStepperValue(s.idleReminderDelay, 5, 60);

    // Weekly goal (PRD 6.8)
    if (s.weeklyGoalEnabled) {
      s.weeklyGoalTarget = validateStepperValue(s.weeklyGoalTarget, LIMITS.WEEKLY_GOAL_MIN, LIMITS.WEEKLY_GOAL_MAX);
    }

    // Color validation
    if (!validateHexColor(s.accentColor)) s.accentColor = '#D97706';
    if (!validateHexColor(s.breakAccentColor)) s.breakAccentColor = '#0D9488';

    // FEATURE INTERACTION: Reduced Motion → disable Completion Animation Intensity (PRD Appendix B)
    if (s.reducedMotion) {
      s.completionAnimationIntensity = 'subtle';
    }

    // FEATURE INTERACTION: Reduced Motion → Flip Clock degrades to Minimal (PRD Appendix B)
    if (s.reducedMotion && s.clockFont === 'flip') {
      s.clockFont = 'minimal';
    }

    // FEATURE INTERACTION: Sound Theme Silent → individual toggles don't matter (PRD Appendix B)
    // (toggles preserved in data but grayed out in UI)

    // Categories: ensure at least one exists (PRD 6.5)
    if (!s.categories || s.categories.length === 0) {
      s.categories = CATEGORY_DEFAULTS.INITIAL_CATEGORIES.map((c, i) => ({
        name: c.name,
        color: c.color,
        order: i,
        createdAt: new Date().toISOString(),
      }));
    }

    // Enforce max categories (PRD 6.5: max 20)
    if (s.categories.length > LIMITS.MAX_CATEGORIES) {
      s.categories = s.categories.slice(0, LIMITS.MAX_CATEGORIES);
    }

    // Ensure default category exists in categories list
    if (!s.categories.some((c) => c.name === s.defaultCategory)) {
      s.defaultCategory = s.categories[0]?.name ?? 'General';
    }

    s.schemaVersion = APP_DEFAULTS.SETTINGS_SCHEMA_VERSION;
    s.updatedAt = new Date().toISOString();

    return s;
  },

  /**
   * Reset settings to defaults. PRD Section 6.11.
   * Keeps sessions, only resets settings.
   */
  async resetToDefaults(userId: string): Promise<UserSettings> {
    return settingsRepo.resetToDefaults(userId);
  },

  /**
   * Export settings as JSON backup. PRD Section 6.11.
   */
  async exportBackup(userId: string): Promise<Record<string, unknown>> {
    const settings = await settingsRepo.get(userId);
    return {
      exportedAt: new Date().toISOString(),
      userId,
      schemaVersion: APP_DEFAULTS.SETTINGS_SCHEMA_VERSION,
      settings,
    };
  },

  /**
   * Import settings from JSON backup. PRD Section 6.11.
   * Validates, previews, applies atomically.
   */
  async importBackup(
    userId: string,
    backup: Record<string, unknown>,
  ): Promise<{ success: boolean; error?: string }> {
    // Validate schema version (PRD 6.11: reject newer versions)
    const backupVersion = (backup.schemaVersion as number) ?? 0;
    if (backupVersion > APP_DEFAULTS.SETTINGS_SCHEMA_VERSION) {
      return {
        success: false,
        error: 'This backup is from a newer version of Becoming.. Please update the app first.',
      };
    }

    // Check userId match (PRD 6.11: warn on mismatch)
    if (backup.userId && backup.userId !== userId) {
      // UI handles double confirmation; service proceeds if called
      logger.warn('Cross-account import', { userId, backupUserId: backup.userId });
    }

    try {
      const importedSettings = backup.settings as Record<string, unknown>;
      if (!importedSettings) {
        return { success: false, error: 'Invalid backup format: missing settings' };
      }

      const migrated = migrateSettings(importedSettings);
      const validated = this.validateAndEnforce(migrated);
      await settingsRepo.save(userId, validated);

      logger.info('Settings imported', { userId });
      return { success: true };
    } catch (error) {
      logger.error('Import failed', { userId, error: String(error) });
      return { success: false, error: 'Failed to import settings' };
    }
  },

  /**
   * Add a new category. PRD Section 6.5.
   */
  async addCategory(
    userId: string,
    name: string,
    color: string,
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await settingsRepo.get(userId);

    if (settings.categories.length >= LIMITS.MAX_CATEGORIES) {
      return { success: false, error: 'Category limit reached (maximum 20)' };
    }

    const existingNames = settings.categories.map((c) => c.name);
    const validation = validateCategoryName(name, existingNames);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    settings.categories.push({
      name: name.trim(),
      color: validateHexColor(color) ? color : '#6B7280',
      order: settings.categories.length,
      createdAt: new Date().toISOString(),
    });

    await settingsRepo.save(userId, settings);
    return { success: true };
  },

  /**
   * Delete a category. PRD Section 6.5.
   * If last category deleted, "General" auto-restores.
   */
  async deleteCategory(
    userId: string,
    categoryName: string,
  ): Promise<void> {
    const settings = await settingsRepo.get(userId);
    settings.categories = settings.categories.filter((c) => c.name !== categoryName);

    // PRD 6.5: Cannot have zero categories
    if (settings.categories.length === 0) {
      settings.categories = [{
        name: 'General',
        color: '#6B7280',
        order: 0,
        createdAt: new Date().toISOString(),
      }];
    }

    if (settings.defaultCategory === categoryName) {
      settings.defaultCategory = settings.categories[0]?.name ?? 'General';
    }

    await settingsRepo.save(userId, settings);
  },

  /**
   * Rename a category. PRD Section 5.6.2.
   * Future sessions use new name; past sessions retain historical name.
   */
  async renameCategory(
    userId: string,
    oldName: string,
    newName: string,
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await settingsRepo.get(userId);
    const existingNames = settings.categories.filter((c) => c.name !== oldName).map((c) => c.name);
    const validation = validateCategoryName(newName, existingNames);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const cat = settings.categories.find((c) => c.name === oldName);
    if (cat) {
      cat.name = newName.trim();
    }

    if (settings.defaultCategory === oldName) {
      settings.defaultCategory = newName.trim();
    }

    await settingsRepo.save(userId, settings);
    return { success: true };
  },
};
