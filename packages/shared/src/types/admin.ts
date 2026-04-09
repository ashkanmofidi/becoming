/** Admin analytics types. PRD Section 10 */

/** User health status. PRD Section 10.6 */
export type UserHealthStatus = 'thriving' | 'healthy' | 'at_risk' | 'churning' | 'dormant';

/** Real-time pulse data. PRD Section 10.2 */
export interface PulseData {
  activeNow: number;
  activeUsers: string[];
  todaySessions: number;
  todaySessionsVsYesterday: number;
  todayFocusHours: number;
  todayFocusHoursVsYesterday: number;
  todayActiveUsers: number;
  betaCapacity: { current: number; max: number };
  systemStatus: 'green' | 'yellow' | 'red';
}

/** User health scorecard entry. PRD Section 10.6 */
export interface UserHealthEntry {
  userId: string;
  email: string;
  name: string;
  role: string;
  lastActive: string;
  sessions7d: number;
  streak: number;
  goalRate: number;
  health: UserHealthStatus;
}

/** Audit log entry. PRD Section 10.10 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetId: string | null;
  targetEmail: string | null;
  details: Record<string, unknown>;
}

export type AuditAction =
  | 'role_changed'
  | 'account_deactivated'
  | 'account_deleted'
  | 'account_reset'
  | 'feedback_status_changed'
  | 'admin_note_added'
  | 'beta_cap_changed'
  | 'invitation_sent'
  | 'invitation_revoked'
  | 'tos_updated'
  | 'user_registered'
  | 'user_deleted_self'
  | 'data_exported'
  | 'failed_login';

/** Retention cohort data. PRD Section 10.3 */
export interface RetentionCohort {
  weekStart: string;
  signups: number;
  retention: number[];
}

/** Feature adoption entry. PRD Section 10.5 */
export interface FeatureAdoption {
  feature: string;
  usersEnabled: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}
