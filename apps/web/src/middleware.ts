import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware. PRD Section 17.
 * Handles auth redirects, CSP headers, and security.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('bm_sid')?.value;

  // Auth redirect: unauthenticated users to login (PRD 1.1.1)
  const protectedPaths = ['/timer', '/dashboard', '/session-log', '/settings'];
  const adminPaths = ['/analytics', '/users', '/feedback', '/audit', '/system'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));

  if ((isProtected || isAdmin) && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in? Redirect login to timer
  if (pathname === '/login' && sessionToken) {
    return NextResponse.redirect(new URL('/timer', request.url));
  }

  const response = NextResponse.next();

  // CSP headers (PRD Section 17)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://lh3.googleusercontent.com",
    "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://*.vercel-storage.com",
    "frame-src https://accounts.google.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HTTPS enforcement (PRD 17)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sounds|icons|manifest.json).*)',
  ],
};
