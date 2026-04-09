/** User roles in the system. PRD Section 3.2, 10.1 */
export type UserRole = 'user' | 'admin' | 'super_admin';

/** User profile stored in KV. PRD Section 1.2.1 step 9 */
export interface User {
  id: string;
  sub: string;
  email: string;
  name: string;
  picture: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  lastLoginIP: string;
  lastLoginDevice: string;
  onboardingCompleted: boolean;
  tosAccepted: TosRecord | null;
  settingsVersion: number;
}

/** TOS acceptance record. PRD Section 1.3.4 */
export interface TosRecord {
  acceptedVersion: string;
  acceptedAt: string;
  acceptedFromIP: string;
  userAgent: string;
}

/** Server-side session record. PRD Section 1.2.2 */
export interface AuthSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  picture: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  deviceInfo: DeviceInfo;
}

/** Device information for sessions. PRD Section 11 */
export interface DeviceInfo {
  userAgent: string;
  ip: string;
  deviceId: string;
}

/** Beta configuration. PRD Section 1.1.1 */
export interface BetaConfig {
  maxUsers: number;
  currentUsers: number;
}
