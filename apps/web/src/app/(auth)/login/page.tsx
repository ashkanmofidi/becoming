'use client';

import { useState, useCallback } from 'react';

const GOOGLE_CLIENT_ID = '115795527932-2q1afagsog0eg29pbdfn3qfs44e27uui.apps.googleusercontent.com';

/**
 * Login page. PRD Section 1.1.
 * Simplified OAuth flow (no PKCE — we have a server-side client_secret).
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'session_expired') {
        return 'Session expired, please log in again.';
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: `${window.location.origin}/api/auth/callback`,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
      });

      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } catch {
      setError("Couldn't connect to Google. Please check your internet connection and try again.");
      setIsLoading(false);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="font-serif text-4xl md:text-5xl mb-2">
        Becoming<span className="text-amber">.</span><span className="text-amber">.</span>
      </h1>
      <p className="text-surface-500 text-xs tracking-[0.3em] uppercase font-mono mb-12">
        ENTERPRISE FOCUS TIMER
      </p>

      <div className="w-full max-w-sm bg-bg-card rounded-xl p-8 border border-surface-900">
        <h2 className="text-white text-xl font-semibold mb-2 text-center">Welcome</h2>
        <p className="text-surface-500 text-sm text-center mb-8">
          Sign in with your Google account to start focusing.
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 text-sm p-3 rounded-lg mb-4">
            {error}
            <button
              onClick={() => { setError(null); handleGoogleSignIn(); }}
              className="block mt-2 text-amber hover:text-amber-light underline"
            >
              Retry
            </button>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <p className="text-surface-500 text-xs text-center mt-6">
          Limited to 10 beta users. By signing in you agree to our{' '}
          <button className="text-amber hover:text-amber-light underline">
            terms of use
          </button>.
        </p>
      </div>
    </main>
  );
}
