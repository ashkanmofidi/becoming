import { NextRequest, NextResponse } from 'next/server';
import { authService, BetaCapReachedError } from '@/services/auth.service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-callback');

/**
 * OAuth callback handler. PRD Section 1.2.1.
 * Simplified: no PKCE (server has client_secret).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    logger.warn('OAuth error from Google', { error });
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url));
  }

  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/callback`;

    // Exchange code for tokens (no PKCE verifier needed with client_secret)
    const tokens = await authService.exchangeCodeForTokens(code, redirectUri);

    // Decode ID token
    const googleUser = await authService.decodeIdToken(tokens.idToken);

    // Process callback — create user if needed, create session
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { session, needsTos } = await authService.processOAuthCallback(
      googleUser,
      ip,
      userAgent,
    );

    // Set session cookie and redirect
    const redirectPath = needsTos ? '/tos' : '/timer';
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    response.cookies.set('bm_sid', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax', // Changed from 'strict' — needs to work on redirect from Google
      path: '/',
      maxAge: 3 * 24 * 60 * 60, // Hard 3-day expiry, matches server-side check
    });

    return response;
  } catch (error) {
    if (error instanceof BetaCapReachedError) {
      return NextResponse.redirect(new URL('/login?error=beta_cap', request.url));
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('OAuth callback failed', { error: errMsg });
    return NextResponse.redirect(
      new URL(`/login?error=auth_failed&detail=${encodeURIComponent(errMsg)}`, request.url),
    );
  }
}
