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
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-surface-300">Loading terms of service...</p>
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
