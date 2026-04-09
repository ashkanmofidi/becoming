import { userRepo } from '../repositories/user.repo';
import { sessionRepo } from '../repositories/session.repo';
import { feedbackRepo } from '../repositories/feedback.repo';
import { auditRepo } from '../repositories/audit.repo';
import { settingsRepo } from '../repositories/settings.repo';
import { kvClient, keys } from '../repositories/kv.client';
import type { User, UserRole, FeedbackSubmission, AuditLogEntry, UserHealthStatus } from '@becoming/shared';
import { APP_DEFAULTS } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('admin-service');

/**
 * Admin service. PRD Section 10.
 * Analytics aggregation, user management, role enforcement.
 */
export const adminService = {
  /**
   * Get real-time pulse data. PRD Section 10.2.
   * 6 live stat cards with 10-second refresh.
   */
  async getPulseData(): Promise<PulseData> {
    const betaCount = await userRepo.getBetaUserCount();

    return {
      activeNow: 0, // Would scan timer:* keys for running timers
      todaySessions: 0, // Aggregated from all users
      todayFocusHours: 0,
      todayActiveUsers: 0,
      betaCapacity: { current: betaCount, max: APP_DEFAULTS.BETA_CAP },
      systemStatus: 'green',
    };
  },

  /**
   * Get user list for admin. PRD Section 10.9.
   */
  async getUsers(): Promise<AdminUserEntry[]> {
    // Scan for all user keys
    const userKeys = await kvClient.keys('user:*');
    const users: AdminUserEntry[] = [];

    for (const key of userKeys) {
      if (key.includes(':settings') || key.includes(':sessions')) continue;
      const user = await kvClient.get<User>(key);
      if (!user) continue;

      const sessionCount = await sessionRepo.getSessionCount(user.id);

      users.push({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        joinedAt: user.createdAt,
        lastActive: user.lastLoginAt,
        sessions: sessionCount,
        health: getHealthStatus(user.lastLoginAt, sessionCount),
      });
    }

    return users.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
  },

  /**
   * Change user role. PRD Section 10.1, 10.9.
   */
  async changeRole(
    actorId: string,
    actorEmail: string,
    targetUserId: string,
    newRole: UserRole,
  ): Promise<void> {
    const target = await userRepo.findById(targetUserId);
    if (!target) throw new Error('User not found');

    // Cannot change super admin role (PRD 10.1)
    if (target.email === APP_DEFAULTS.SUPER_ADMIN_EMAIL) {
      throw new Error('Cannot modify Super Admin role');
    }

    const oldRole = target.role;
    await userRepo.update(targetUserId, { role: newRole });

    if (newRole === 'admin' || newRole === 'super_admin') {
      await userRepo.addAdmin(target.email);
    } else {
      await userRepo.removeAdmin(target.email);
    }

    await auditRepo.log({
      actorId,
      actorEmail,
      action: 'role_changed',
      targetId: targetUserId,
      targetEmail: target.email,
      details: { oldRole, newRole },
    });

    logger.info('Role changed', { targetId: targetUserId, oldRole, newRole });
  },

  /**
   * Get feedback list. PRD Section 10.
   */
  async getFeedback(options?: { offset?: number; limit?: number }): Promise<FeedbackSubmission[]> {
    return feedbackRepo.findAll(options);
  },

  /**
   * Update feedback status. PRD Section 9.1.
   */
  async updateFeedbackStatus(
    feedbackId: string,
    status: string,
    actorId: string,
    actorEmail: string,
  ): Promise<void> {
    await feedbackRepo.update(feedbackId, { status: status as FeedbackSubmission['status'] });

    await auditRepo.log({
      actorId,
      actorEmail,
      action: 'feedback_status_changed',
      targetId: feedbackId,
      targetEmail: null,
      details: { newStatus: status },
    });
  },

  /**
   * Get audit log. PRD Section 10.10.
   */
  async getAuditLog(options?: { offset?: number; limit?: number }): Promise<AuditLogEntry[]> {
    return auditRepo.findAll(options);
  },

  /**
   * Get beta config. PRD Section 10.9.
   */
  async getBetaConfig(): Promise<{ currentUsers: number; maxUsers: number; allowlist: string[] }> {
    const currentUsers = await userRepo.getBetaUserCount();
    const allowlist = await userRepo.getAllowlist();
    return { currentUsers, maxUsers: APP_DEFAULTS.BETA_CAP, allowlist };
  },
};

function getHealthStatus(lastActive: string, sessions: number): UserHealthStatus {
  const daysSinceActive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceActive >= 30) return 'dormant';
  if (daysSinceActive >= 7) return 'churning';
  if (daysSinceActive >= 3 || sessions < 5) return 'at_risk';
  if (sessions >= 20) return 'thriving';
  return 'healthy';
}

interface PulseData {
  activeNow: number;
  todaySessions: number;
  todayFocusHours: number;
  todayActiveUsers: number;
  betaCapacity: { current: number; max: number };
  systemStatus: 'green' | 'yellow' | 'red';
}

interface AdminUserEntry {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: UserRole;
  joinedAt: string;
  lastActive: string;
  sessions: number;
  health: UserHealthStatus;
}
