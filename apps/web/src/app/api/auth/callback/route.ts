import { NextRequest, NextResponse } from 'next/server';
import { authService, BetaCapReachedError } from '@/services/auth.service';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth-callback');

/**
 * OAuth callback handler. PRD Section 1.2.1 steps 5-11.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    logger.warn('OAuth error from Google', { error });
    return NextResponse.redirect(
      new URL('/login?error=oauth_failed', request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=missing_params', request.url),
    );
  }

  try {
    // Exchange code for tokens (PRD 1.2.1 step 7)
    // Note: code_verifier is sent by client in the state or a separate cookie
    const codeVerifier = request.cookies.get('pkce_verifier')?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL('/login?error=missing_verifier', request.url),
      );
    }

    const tokens = await authService.exchangeCodeForTokens(
      code,
      codeVerifier,
      `${process.env.APP_URL}/api/auth/callback`,
    );

    // Decode ID token (PRD 1.2.1 step 8)
    const googleUser = await authService.decodeIdToken(tokens.idToken);

    // Process callback (PRD 1.2.1 steps 9-11)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const { session, isNewUser, needsTos } = await authService.processOAuthCallback(
      googleUser,
      ip,
      userAgent,
    );

    // Set session cookie (PRD 1.2.3)
    const redirectPath = needsTos ? '/tos' : '/timer';
    const response = NextResponse.redirect(new URL(redirectPath, request.url));

    response.cookies.set('bm_sid', session.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    // Clear PKCE cookie
    response.cookies.delete('pkce_verifier');

    return response;
  } catch (error) {
    if (error instanceof BetaCapReachedError) {
      return NextResponse.redirect(
        new URL('/login?error=beta_cap', request.url),
      );
    }

    logger.error('OAuth callback failed', { error: String(error) });
    return NextResponse.redirect(
      new URL('/login?error=auth_failed', request.url),
    );
  }
}
