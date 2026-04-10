import { kvClient, keys } from './kv.client';
import type { UserSettings } from '@becoming/shared';
import { createDefaultSettings, migrateSettings } from '@becoming/shared';

/**
 * Settings repository. PRD Section 6, 18.
 * KV key: settings:{userId}
 *
 * DATA SAFETY: save() MERGES with existing data — never overwrites.
 * This prevents data loss when the client sends a partial settings object.
 */
export const settingsRepo = {
  async get(userId: string): Promise<UserSettings> {
    const raw = await kvClient.get<Record<string, unknown>>(keys.settings(userId));
    if (!raw) {
      return createDefaultSettings();
    }
    return migrateSettings(raw);
  },

  /**
   * SAFE SAVE: merges incoming settings with existing data.
   * - New fields are added
   * - Existing fields are updated to new values
   * - Fields in KV but NOT in the incoming object are PRESERVED
   * This prevents data loss from partial updates.
   */
  async save(userId: string, settings: UserSettings): Promise<void> {
    // Read existing data first
    const existing = await kvClient.get<Record<string, unknown>>(keys.settings(userId));

    // Merge: existing values are the base, incoming settings override
    const merged = existing
      ? { ...existing, ...(settings as unknown as Record<string, unknown>) }
      : (settings as unknown as Record<string, unknown>);

    merged.updatedAt = new Date().toISOString();

    await kvClient.set(keys.settings(userId), merged);
  },

  async delete(userId: string): Promise<void> {
    await kvClient.del(keys.settings(userId));
  },

  /**
   * Reset settings to defaults. ONLY called for brand-new users.
   * For existing users, use save() which merges.
   */
  async resetToDefaults(userId: string): Promise<UserSettings> {
    const defaults = createDefaultSettings();
    // Check if settings already exist — if so, DON'T overwrite
    const existing = await kvClient.get<Record<string, unknown>>(keys.settings(userId));
    if (existing && Object.keys(existing).length > 0) {
      // Settings exist — merge defaults into existing (adds new fields without losing old)
      const merged = { ...defaults, ...existing } as unknown as UserSettings;
      merged.updatedAt = new Date().toISOString();
      await kvClient.set(keys.settings(userId), merged as unknown as Record<string, unknown>);
      return merged;
    }
    // Truly new — safe to write defaults
    await this.save(userId, defaults);
    return defaults;
  },
};
