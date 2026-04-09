import { kvClient, keys } from './kv.client';
import type { UserSettings } from '@becoming/shared';
import { createDefaultSettings, migrateSettings } from '@becoming/shared';

/**
 * Settings repository. PRD Section 6, 18.
 * KV key: settings:{userId}
 */
export const settingsRepo = {
  async get(userId: string): Promise<UserSettings> {
    const raw = await kvClient.get<Record<string, unknown>>(keys.settings(userId));
    if (!raw) {
      return createDefaultSettings();
    }
    return migrateSettings(raw);
  },

  async save(userId: string, settings: UserSettings): Promise<void> {
    settings.updatedAt = new Date().toISOString();
    await kvClient.set(keys.settings(userId), settings as unknown as Record<string, unknown>);
  },

  async delete(userId: string): Promise<void> {
    await kvClient.del(keys.settings(userId));
  },

  async resetToDefaults(userId: string): Promise<UserSettings> {
    const defaults = createDefaultSettings();
    await this.save(userId, defaults);
    return defaults;
  },
};
