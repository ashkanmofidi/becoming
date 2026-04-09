'use client';

import { useState, useEffect } from 'react';

/**
 * Feedback page. PRD Section 9.1 (admin view).
 */
export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Array<Record<string, unknown>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin?view=feedback')
      .then((res) => {
        if (res.status === 401) { window.location.href = '/login?error=session_expired'; return null; }
        if (res.status === 403) { window.location.href = '/timer?error=forbidden'; return null; }
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data) => { if (data) setFeedback(data.feedback ?? []); })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-6"><div className="h-48 bg-surface-900/50 rounded animate-pulse" /></div>;
  }

  if (feedback.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-xl font-semibold mb-6">Feedback</h1>
        <div className="text-center py-16 text-surface-500">
          No feedback yet. Users can submit feedback via the button in the app header.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">Feedback ({feedback.length})</h1>
      <div className="space-y-3">
        {feedback.map((item, i) => (
          <div key={i} className="bg-bg-card border border-surface-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
                item.category === 'bug' ? 'bg-red-900/30 text-red-400'
                : item.category === 'feature_request' ? 'bg-blue-900/30 text-blue-400'
                : 'bg-surface-700 text-surface-300'
              }`}>
                {String(item.category ?? 'general').replace('_', ' ')}
              </span>
              <span className="text-surface-500 text-xs">{String(item.createdAt ?? '').slice(0, 10)}</span>
            </div>
            <h3 className="text-surface-100 text-sm font-medium">{String(item.subject ?? '')}</h3>
            <p className="text-surface-300 text-xs mt-1 line-clamp-2">{String(item.description ?? '')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
