'use client';

import { useState } from 'react';
import { FeedbackModal } from './FeedbackModal';

/**
 * Header action buttons. PRD Section 9.
 * Feedback, Export, Keys buttons in the top-right.
 */
export function HeaderButtons() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Feedback button (PRD 9.1) */}
        <button
          onClick={() => setShowFeedback(true)}
          className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-900 transition-colors"
          title="Send Feedback"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 0 0-7 7c0 1.6.5 3 1.5 4.2L1 15l2.8-1.5C5 14.5 6.4 15 8 15a7 7 0 0 0 0-14zM4 7h8v1H4V7zm0 2h6v1H4V9z" />
          </svg>
        </button>

        {/* Export button (PRD 9.2) */}
        <button
          onClick={() => {
            window.location.href = '/api/sessions?format=csv';
          }}
          className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-900 transition-colors"
          title="Export"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12L3 7h3V1h4v6h3L8 12zm-6 2h12v1H2v-1z" />
          </svg>
        </button>

        {/* Shortcuts button (PRD 9.3) */}
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-surface-900 transition-colors"
          title="Keyboard Shortcuts"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2z" />
            <path d="M3 5h2v2H3V5zm3 0h2v2H6V5zm3 0h2v2H9V5zm3 0h1v2h-1V5zM3 8h1v2H3V8zm2 0h6v2H5V8zm7 0h1v2h-1V8z" />
          </svg>
        </button>
      </div>

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="relative bg-bg-card border border-surface-700 rounded-xl p-6 max-w-md w-full shadow-2xl" role="dialog">
            <h2 className="text-lg font-semibold mb-4">Keyboard Shortcuts</h2>
            <div className="space-y-2">
              {[
                { key: 'Space', action: 'Play / Pause' },
                { key: 'R', action: 'Reset' },
                { key: 'S', action: 'Skip' },
                { key: '1', action: 'Focus mode' },
                { key: '2', action: 'Break mode' },
                { key: '3', action: 'Long break mode' },
                { key: 'F', action: 'Fullscreen' },
                { key: 'M', action: 'Mute' },
                { key: '?', action: 'Show shortcuts' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-surface-300">{action}</span>
                  <kbd className="px-2 py-0.5 bg-surface-900 border border-surface-700 rounded text-xs font-mono text-surface-400">{key}</kbd>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full px-4 py-2 bg-surface-900 text-surface-300 rounded-lg text-sm hover:bg-surface-700">
              Close
            </button>
          </div>
        </div>
      )}

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
