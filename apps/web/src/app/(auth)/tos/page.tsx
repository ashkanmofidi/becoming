'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Terms of Service page. PRD Section 1.3.
 * Full-screen TOS with scroll-to-accept requirement.
 */
export default function TosPage() {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true);
    }
  }, []);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/tos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted: true }),
      });
      if (response.ok) {
        window.location.href = '/timer';
      } else {
        throw new Error('Failed to accept TOS');
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    // PRD: Decline = logout immediately
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-serif text-3xl mb-1 text-center">Terms of Service</h1>
        <p className="text-surface-500 text-sm text-center mb-6 font-mono">
          Version 1.0
        </p>

        {/* Scrollable TOS content (PRD: max-height 60vh) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="bg-bg-card border border-surface-900 rounded-xl p-6 max-h-[60vh] overflow-y-auto mb-6"
        >
          <div className="prose prose-invert prose-sm max-w-none text-surface-300 space-y-4">
            <h2 className="text-surface-100 text-lg font-semibold">Becoming.. Terms of Service</h2>
            <p><strong>Effective Date:</strong> April 8, 2026</p>

            <h3 className="text-surface-100 text-base font-semibold">1. Acceptance of Terms</h3>
            <p>By accessing or using Becoming.. (&quot;the App&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the App.</p>

            <h3 className="text-surface-100 text-base font-semibold">2. Description of Service</h3>
            <p>Becoming.. is an enterprise focus timer application that helps users track productivity through Pomodoro-style focus sessions, analytics, and goal tracking.</p>

            <h3 className="text-surface-100 text-base font-semibold">3. Beta Program</h3>
            <p>The App is currently in Enterprise Beta. Access is limited to invited users. The service is provided &quot;AS IS&quot; without warranty. Features may change or be discontinued without notice.</p>

            <h3 className="text-surface-100 text-base font-semibold">4. User Accounts</h3>
            <p>You must sign in with a valid Google account. You are responsible for all activity under your account. You may delete your account and all associated data at any time through Settings.</p>

            <h3 className="text-surface-100 text-base font-semibold">5. Data Collection & Privacy</h3>
            <p>We collect only the data necessary to provide the service: your Google profile (name, email, avatar), focus session records, and app settings. We do not use third-party analytics or tracking. All data is stored securely on Vercel infrastructure in the United States. For full details, see our Privacy Policy.</p>

            <h3 className="text-surface-100 text-base font-semibold">6. Acceptable Use</h3>
            <p>You agree not to: (a) attempt to access other users&apos; data; (b) reverse engineer the App; (c) use the App for any unlawful purpose; (d) submit malicious content through feedback or session intents.</p>

            <h3 className="text-surface-100 text-base font-semibold">7. Intellectual Property</h3>
            <p>The App and its original content, features, and functionality are owned by the developer. Your session data belongs to you and can be exported or deleted at any time.</p>

            <h3 className="text-surface-100 text-base font-semibold">8. Limitation of Liability</h3>
            <p>In no event shall the developer be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data or productivity. Total liability shall not exceed $50 USD.</p>

            <h3 className="text-surface-100 text-base font-semibold">9. Changes to Terms</h3>
            <p>We may update these Terms from time to time. You will be asked to review and accept updated terms before continuing to use the App. Continued use after acceptance constitutes agreement.</p>

            <h3 className="text-surface-100 text-base font-semibold">10. Governing Law</h3>
            <p>These Terms shall be governed by the laws of the State of California, United States.</p>

            <h3 className="text-surface-100 text-base font-semibold">11. Contact</h3>
            <p>For questions about these Terms, use the feedback button within the App or contact us at ashkan.mofidi@gmail.com.</p>

            <p className="text-surface-500 text-xs mt-8">Version 1.0 · Last updated April 8, 2026</p>
          </div>
        </div>

        {!hasScrolledToBottom && (
          <p className="text-surface-500 text-sm text-center mb-4">
            Please scroll to the bottom to continue.
          </p>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleDecline}
            className="px-6 py-3 text-surface-300 hover:text-white border border-surface-700 rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={!hasScrolledToBottom || isSubmitting}
            className="px-6 py-3 bg-amber text-white font-semibold rounded-lg hover:bg-amber-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Accepting...' : 'I Accept'}
          </button>
        </div>
      </div>
    </main>
  );
}
