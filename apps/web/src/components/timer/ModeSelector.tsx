'use client';

import type { TimerMode, TimerStatus } from '@becoming/shared';

interface ModeSelectorProps {
  activeMode: TimerMode;
  timerStatus: TimerStatus;
  onModeChange: (mode: TimerMode) => void;
  onConfirmSwitch: (mode: TimerMode) => void;
}

const MODES: { key: TimerMode; label: string }[] = [
  { key: 'focus', label: 'FOCUS' },
  { key: 'break', label: 'BREAK' },
  { key: 'long_break', label: 'LONG BREAK' },
];

/**
 * Timer mode selector. PRD Section 5.1.
 * Three-segment pill: FOCUS | BREAK | LONG BREAK.
 * IDLE: instant switch. RUNNING/PAUSED: requires confirmation.
 */
export function ModeSelector({ activeMode, timerStatus, onModeChange, onConfirmSwitch }: ModeSelectorProps) {
  const handleClick = (mode: TimerMode) => {
    if (mode === activeMode) return;

    if (timerStatus === 'idle' || timerStatus === 'completed') {
      onModeChange(mode);
    } else {
      // Running/paused: requires confirmation (PRD 5.1.2)
      onConfirmSwitch(mode);
    }
  };

  return (
    <div className="flex bg-surface-900/50 rounded-full p-1 gap-0.5">
      {MODES.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => handleClick(key)}
          className={`
            px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider
            transition-all duration-150
            ${activeMode === key
              ? key === 'focus'
                ? 'bg-amber text-white'
                : key === 'break'
                  ? 'bg-teal text-white'
                  : 'bg-purple-600 text-white'
              : 'text-surface-500 hover:text-surface-300'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
