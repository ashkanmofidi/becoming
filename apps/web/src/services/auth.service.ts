import { userRepo } from '../repositories/user.repo';
import { settingsRepo } from '../repositories/settings.repo';
import { auditRepo } from '../repositories/audit.repo';
import { kvClient, keys } from '../repositories/kv.client';
import type { User, AuthSession, UserRole } from '@becoming/shared';
import { APP_DEFAULTS } from '@becoming/shared';
import { createLogger } from '../lib/logger';

const logger = createLogger('auth-service');
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Authentication service. PRD Section 1.2.
 * Handles OAuth callback, session management, beta cap enforcement.
 */
export const authService = {
  /**
   * Exchange authorization code for tokens. PRD Section 1.2.1 step 7.
   */
  async exchangeCodeForTokens(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<{ idToken: string; accessToken: string; refreshToken?: string }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('Token exchange failed', { status: response.status, body: errorBody });
      throw new Error(`Token exchange ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return {
      idToken: data.id_token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  },

  /**
   * Decode and validate ID token. PRD Section 1.2.1 step 8.
   * Returns Google user info from the JWT payload.
   */
  async decodeIdToken(idToken: string): Promise<{
    sub: string;
    email: string;
    name: string;
    picture: string;
    emailVerified: boolean;
  }> {
    // Verify with Google's tokeninfo endpoint
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      throw new Error('Invalid ID token');
    }

    const payload = await response.json();

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Token audience mismatch');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || '',
      emailVerified: payload.email_verified === 'true',
    };
  },

  /**
   * Process OAuth callback. PRD Section 1.2.1 steps 9-11.
   * Handles new user registration with beta cap check.
   */
  async processOAuthCallback(
    googleUser: { sub: string; email: string; name: string; picture: string },
    ip: string,
    userAgent: string,
  ): Promise<{ session: AuthSession; isNewUser: boolean; needsTos: boolean }> {
    const existingUser = await userRepo.findById(googleUser.sub);
    let user: User;
    let isNewUser = false;

    if (existingUser) {
      // Existing user: update login info (PRD 1.2.1 step 9)
      await userRepo.update(googleUser.sub, {
        email: googleUser.email, // PRD: email may change, sub doesn't
        name: googleUser.name,
        picture: googleUser.picture,
        lastLoginAt: new Date().toISOString(),
        lastLoginIP: ip,
        lastLoginDevice: userAgent,
      });
      user = { ...existingUser, email: googleUser.email, name: googleUser.name, picture: googleUser.picture };
    } else {
      // New user: check beta cap (PRD 1.1.1)
      const currentCount = await userRepo.getBetaUserCount();
      const isAllowlisted = await userRepo.isOnAllowlist(googleUser.email);

      if (currentCount >= APP_DEFAULTS.BETA_CAP && !isAllowlisted) {
        throw new BetaCapReachedError();
      }

      // Determine role
      let role: UserRole = 'user';
      if (googleUser.email === APP_DEFAULTS.SUPER_ADMIN_EMAIL) {
        role = 'super_admin';
      }

      const now = new Date().toISOString();
      user = {
        id: googleUser.sub,
        sub: googleUser.sub,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        role,
        createdAt: now,
        lastLoginAt: now,
        lastLoginIP: ip,
        lastLoginDevice: userAgent,
        onboardingCompleted: false,
        tosAccepted: null,
        settingsVersion: APP_DEFAULTS.SETTINGS_SCHEMA_VERSION,
      };

      await userRepo.create(user);
      await userRepo.incrementBetaUserCount();
      await settingsRepo.resetToDefaults(googleUser.sub);

      if (role === 'super_admin') {
        await userRepo.addAdmin(googleUser.email);
      }

      await auditRepo.log({
        actorId: googleUser.sub,
        actorEmail: googleUser.email,
        action: 'user_registered',
        targetId: null,
        targetEmail: null,
        details: { source: isAllowlisted ? 'invited' : 'direct' },
      });

      isNewUser = true;
      logger.info('New user registered', { userId: googleUser.sub, email: googleUser.email });
    }

    // Create session (PRD 1.2.2)
    const session = await this.createSession(user, userAgent, ip);

    // Check TOS (PRD 1.3)
    const needsTos = !user.tosAccepted ||
      user.tosAccepted.acceptedVersion !== APP_DEFAULTS.TOS_VERSION;

    return { session, isNewUser, needsTos };
  },

  /**
   * Create a server-side session. PRD Section 1.2.2.
   */
  async createSession(user: User, userAgent: string, ip: string): Promise<AuthSession> {
    const token = generateSessionToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);

    const session: AuthSession = {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivityAt: now.toISOString(),
      deviceInfo: {
        userAgent,
        ip,
        deviceId: generateDeviceId(),
      },
    };

    await kvClient.set(
      keys.authSession(token),
      session as unknown as Record<string, unknown>,
      { ex: SESSION_MAX_AGE_SECONDS },
    );

    return session;
  },

  /**
   * Validate and extend session. PRD: sliding 30-day expiry.
   */
  async validateSession(token: string): Promise<AuthSession | null> {
    const session = await kvClient.get<AuthSession>(keys.authSession(token));
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      await kvClient.del(keys.authSession(token));
      return null;
    }

    // Extend session (sliding window)
    session.lastActivityAt = new Date().toISOString();
    session.expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
    await kvClient.set(
      keys.authSession(token),
      session as unknown as Record<string, unknown>,
      { ex: SESSION_MAX_AGE_SECONDS },
    );

    return session;
  },

  /**
   * Destroy session. PRD Section 1.2.2.
   */
  async destroySession(token: string): Promise<void> {
    await kvClient.del(keys.authSession(token));
  },

  /**
   * Delete user account. PRD Section 6.11.
   */
  async deleteAccount(userId: string, email: string): Promise<void> {
    const { sessionRepo } = await import('../repositories/session.repo');
    const { timerRepo } = await import('../repositories/timer.repo');

    // Mark any running timer as abandoned
    const timerState = await timerRepo.getState(userId);
    if (timerState && timerState.status === 'running') {
      await timerRepo.clearState(userId);
    }

    // Delete all user data
    await sessionRepo.deleteAllForUser(userId);
    await settingsRepo.delete(userId);
    await timerRepo.clearState(userId);
    await kvClient.del(keys.tos(userId));
    await kvClient.del(keys.intentHistory(userId));
    await userRepo.delete(userId);
    await userRepo.decrementBetaUserCount();

    await auditRepo.log({
      actorId: userId,
      actorEmail: email,
      action: 'user_deleted_self',
      targetId: userId,
      targetEmail: email,
      details: {},
    });

    logger.info('Account deleted', { userId, email });
  },
};

export class BetaCapReachedError extends Error {
  constructor() {
    super('Beta cap reached');
    this.name = 'BetaCapReachedError';
  }
}

function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateDeviceId(): string {
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
