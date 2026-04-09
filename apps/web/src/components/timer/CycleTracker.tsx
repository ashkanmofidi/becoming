'use client';

import type { CycleDot } from '@becoming/shared';

interface CycleTrackerProps {
  cycleNumber: number;
  dots: CycleDot[];
  hasAnySessions: boolean;
}

/**
 * Pomodoro cycle tracker. PRD Section 5.5.
 * Visual dots: filled/unfilled. Focus = amber, Break = teal.
 */
export function CycleTracker({ cycleNumber, dots, hasAnySessions }: CycleTrackerProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {dots.map((dot) => (
          <div
            key={dot.position}
            className={`
              w-2.5 h-2.5 rounded-full transition-colors duration-200
              ${dot.filled
                ? dot.type === 'focus'
                  ? 'bg-amber'
                  : 'bg-teal'
                : 'bg-surface-700'
              }
            `}
          />
        ))}
      </div>
      <span className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">
        {hasAnySessions ? `CYCLE ${cycleNumber}` : 'NO SESSIONS YET'} &middot; CYCLE
      </span>
    </div>
  );
}
