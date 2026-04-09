import { kvClient, keys } from '../repositories/kv.client';
import { userRepo } from '../repositories/user.repo';
import { auditRepo } from '../repositories/audit.repo';
import type { TosRecord } from '@becoming/shared';
import { APP_DEFAULTS } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('tos-service');

/**
 * Terms of Service service. PRD Section 1.3.
 */
export const tosService = {
  /**
   * Check if user needs to accept TOS. PRD Section 1.3.2.
   */
  async needsAcceptance(userId: string): Promise<{ needed: boolean; reason?: string; currentVersion: string }> {
    const record = await kvClient.get<TosRecord>(keys.tos(userId));
    const currentVersion = APP_DEFAULTS.TOS_VERSION;

    if (!record) {
      return { needed: true, reason: 'first_time', currentVersion };
    }

    if (record.acceptedVersion !== currentVersion) {
      if (record.acceptedVersion > currentVersion) {
        // Data integrity error (PRD 1.3.2)
        logger.error('TOS version integrity error', {
          userId,
          acceptedVersion: record.acceptedVersion,
          currentVersion,
        });
      }
      return {
        needed: true,
        reason: record.acceptedVersion < currentVersion ? 'updated' : 'integrity_error',
        currentVersion,
      };
    }

    return { needed: false, currentVersion };
  },

  /**
   * Record TOS acceptance. PRD Section 1.3.1.
   * Immutable audit trail (PRD 1.3.4).
   */
  async accept(
    userId: string,
    email: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    const record: TosRecord = {
      acceptedVersion: APP_DEFAULTS.TOS_VERSION,
      acceptedAt: new Date().toISOString(),
      acceptedFromIP: ip,
      userAgent,
    };

    await kvClient.set(keys.tos(userId), record as unknown as Record<string, unknown>);
    await userRepo.update(userId, { tosAccepted: record });

    // Immutable audit log (PRD 1.3.4)
    await auditRepo.log({
      actorId: userId,
      actorEmail: email,
      action: 'tos_updated',
      targetId: userId,
      targetEmail: email,
      details: { version: APP_DEFAULTS.TOS_VERSION, action: 'accepted' },
    });

    logger.info('TOS accepted', { userId, version: APP_DEFAULTS.TOS_VERSION });
  },

  /**
   * Get TOS acceptance status. PRD Section 10.8.
   */
  async getAcceptanceStatus(userId: string): Promise<TosRecord | null> {
    return kvClient.get<TosRecord>(keys.tos(userId));
  },
};
