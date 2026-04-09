'use client';

import { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Feedback modal. PRD Section 9.1.
 */
export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<'bug' | 'feature_request' | 'general'>('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('moderate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; ref?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject,
          description,
          severity: category === 'bug' ? severity : undefined,
          page: window.location.pathname,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, ref: data.referenceNumber });
        setTimeout(onClose, 4000);
      } else {
        setResult({ success: false });
      }
    } catch {
      setResult({ success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-bg-card border border-surface-700 rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto" role="dialog">
        {result?.success ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">✓</div>
            <p className="text-surface-100 font-medium">Thank you for your feedback!</p>
            <p className="text-surface-500 text-sm mt-1">Reference: #{result.ref}</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-surface-100 mb-4">Send Feedback</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                {(['general', 'bug', 'feature_request'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase ${
                      category === cat ? 'bg-amber text-white' : 'bg-surface-900 text-surface-400'
                    }`}
                  >
                    {cat === 'feature_request' ? 'Feature' : cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 100))}
                placeholder="Subject"
                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 outline-none focus:border-amber"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                placeholder="Description (min 10 characters)"
                rows={4}
                className="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 outline-none focus:border-amber resize-none"
              />
              <p className="text-xs text-surface-500">{description.length}/2000</p>

              {category === 'bug' && (
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-sm text-surface-100 outline-none"
                >
                  <option value="minor">Minor</option>
                  <option value="moderate">Moderate</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              )}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={onClose} className="px-4 py-2 text-sm text-surface-300 border border-surface-700 rounded-lg hover:bg-surface-900">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !subject.trim() || description.length < 10}
                className="px-4 py-2 text-sm bg-amber text-white rounded-lg hover:bg-amber-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Submit'}
              </button>
            </div>

            {result?.success === false && (
              <p className="text-red-400 text-sm mt-3">Failed to submit. Please try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
