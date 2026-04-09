'use client';

import { useState } from 'react';
import type { TimerStatus } from '@becoming/shared';

interface PlaybackControlsProps {
  status: TimerStatus;
  isController: boolean;
  strictMode: boolean;
  isFocusMode: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onSkipBreak: () => void;
  onFinishEarly: () => void;
  onReset: () => void;
  onAbandon: () => void;
  onStopOvertime: () => void;
  onTakeOver: () => void;
}

/**
 * Playback controls. PRD Section 5.3.
 * Skip (|>, 40px), Play/Pause (>/||, 56px), Reset (reset arrow, 40px).
 * Strict Mode: only Abandon visible during focus.
 */
export function PlaybackControls({
  status,
  isController,
  strictMode,
  isFocusMode,
  onPlay,
  onPause,
  onResume,
  onSkip,
  onSkipBreak,
  onFinishEarly,
  onReset,
  onAbandon,
  onStopOvertime,
  onTakeOver,
}: PlaybackControlsProps) {
  const isStrictFocus = strictMode && isFocusMode;
  const isActive = status === 'running' || status === 'paused';
  const isBreakActive = isActive && !isFocusMode;
  const [showMore, setShowMore] = useState(false);

  // Non-controller view (PRD 5.2.7)
  if (isActive && !isController) {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-surface-500 text-xs font-mono">Timer running on another device</p>
        <button
          onClick={onTakeOver}
          className="px-4 py-2 text-sm text-amber border border-amber rounded-lg hover:bg-amber/10 transition-colors"
        >
          Take over here
        </button>
      </div>
    );
  }

  // Overtime controls (PRD 5.2.4)
  if (status === 'overtime') {
    return (
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onStopOvertime}
          className="w-14 h-14 rounded-full border-2 border-amber text-amber flex items-center justify-center hover:bg-amber/10 transition-colors"
          aria-label="Stop overtime"
        >
          <StopIcon />
        </button>
      </div>
    );
  }

  // Strict mode during focus (PRD 5.3): only Abandon
  if (isStrictFocus && isActive) {
    return (
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onAbandon}
          className="px-4 py-2 text-sm text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors flex items-center gap-2"
        >
          <LockIcon className="w-3 h-3" />
          Abandon
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="flex items-center justify-center gap-4">
      {/* Skip icon — contextual behavior:
          Focus: skip with confirmation (onSkip)
          Break/Long Break: skip immediately, no confirmation (onSkipBreak) */}
      <button
        onClick={isFocusMode ? onSkip : onSkipBreak}
        disabled={status === 'idle' || status === 'completed'}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          status === 'idle' || status === 'completed'
            ? 'text-surface-700 cursor-not-allowed'
            : isBreakActive
              ? 'text-teal hover:text-teal-dark hover:bg-teal/10'
              : 'text-surface-300 hover:text-white'
        }`}
        aria-label={isFocusMode ? 'Skip Session' : 'Skip to Focus'}
        title={isFocusMode ? 'Skip Session' : 'Skip to Focus'}
      >
        <SkipIcon />
      </button>

      {/* Play/Pause button (PRD: 56x56px, outlined circle) */}
      {status === 'idle' || status === 'completed' ? (
        <button
          onClick={onPlay}
          className="w-14 h-14 rounded-full border-2 border-amber text-amber flex items-center justify-center hover:bg-amber/10 transition-colors animate-pulse-play"
          aria-label="Start"
        >
          <PlayIcon />
        </button>
      ) : status === 'running' ? (
        <button
          onClick={onPause}
          className="w-14 h-14 rounded-full border-2 border-amber text-amber flex items-center justify-center hover:bg-amber/10 transition-colors"
          aria-label="Pause"
        >
          <PauseIcon />
        </button>
      ) : (
        <button
          onClick={onResume}
          className="w-14 h-14 rounded-full border-2 border-amber text-amber flex items-center justify-center hover:bg-amber/10 transition-colors"
          aria-label="Resume"
        >
          <PlayIcon />
        </button>
      )}

      {/* Reset button (PRD: 40x40px) */}
      <button
        onClick={onReset}
        disabled={status === 'idle'}
        className="w-10 h-10 rounded-full flex items-center justify-center text-surface-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Reset"
      >
        <ResetIcon />
      </button>

      {/* More options toggle — secondary actions (Finish Early / Skip) */}
      {isActive && !isStrictFocus && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-surface-500 hover:text-surface-300 transition-colors"
          aria-label="More options"
          title="More options"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="13" cy="8" r="1.5" />
          </svg>
        </button>
      )}
    </div>

    {/* Expandable more options menu */}
    {isActive && showMore && !isStrictFocus && (
      <div className="flex items-center justify-center gap-3 mt-2">
        <button
          onClick={() => { setShowMore(false); onFinishEarly(); }}
          className="px-3 py-1.5 text-xs font-mono text-amber border border-amber/30 rounded-full hover:bg-amber/10 transition-colors"
        >
          Finish Early
        </button>
        <button
          onClick={() => { setShowMore(false); onSkip(); }}
          className="px-3 py-1.5 text-xs font-mono text-surface-400 border border-surface-700 rounded-full hover:bg-surface-900 transition-colors"
        >
          Skip
        </button>
      </div>
    )}
    </>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.5 3.5L16 10L6.5 16.5V3.5Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="5" y="3" width="3.5" height="14" rx="1" />
      <rect x="11.5" y="3" width="3.5" height="14" rx="1" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2L10 8L3 14V2Z" />
      <rect x="11" y="2" width="2.5" height="12" rx="0.5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 6C2 6 3.5 2 8 2C12.5 2 14 6 14 8C14 11.3 11.3 14 8 14C5.2 14 3 12 2.5 9.5" />
      <polyline points="2,2 2,6 6,6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <rect x="4" y="4" width="12" height="12" rx="2" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M11 6V4a3 3 0 0 0-6 0v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1zm-4 0V4a1 1 0 0 1 2 0v2H7z" />
    </svg>
  );
}
