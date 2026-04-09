'use client';

import { useEffect, useState } from 'react';

interface AriaLiveProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

/**
 * ARIA live region for screen reader announcements.
 * PRD Section 5.2.9: Standard/Minimal/Verbose verbosity.
 */
export function AriaLive({ message, priority = 'polite' }: AriaLiveProps) {
  const [announced, setAnnounced] = useState('');

  useEffect(() => {
    if (message) {
      setAnnounced('');
      // Force re-announcement by clearing and setting
      requestAnimationFrame(() => setAnnounced(message));
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announced}
    </div>
  );
}
