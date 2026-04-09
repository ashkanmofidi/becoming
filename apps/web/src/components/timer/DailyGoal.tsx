'use client';

interface DailyGoalProps {
  completed: number;
  target: number;
}

/**
 * Daily goal progress. PRD Section 5.4.
 * "X / Y" with progress bar. Green when met. Overflow indicator.
 */
export function DailyGoal({ completed, target }: DailyGoalProps) {
  const met = completed >= target;
  const exceeded = completed > target;
  const progress = Math.min(1, completed / target);

  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-baseline gap-1">
          <span className={`font-mono text-lg font-semibold ${met ? 'text-green-500' : 'text-amber'}`}>
            {completed}
          </span>
          <span className="text-surface-500 font-mono text-sm">/ {target}</span>
          {met && <span className="text-green-500 text-sm ml-1">&#10003;</span>}
        </div>
        <span className="text-surface-500 text-[10px] font-mono uppercase tracking-wider">
          Daily Goal
        </span>
      </div>

      {/* Progress bar (PRD: 6px, rounded, amber fill on dark gray) */}
      <div className="h-1.5 bg-surface-900 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-400 ease-out ${
            met ? 'bg-green-500' : 'bg-amber'
          } ${exceeded ? 'relative' : ''}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {completed === 0 && (
        <p className="text-surface-500 text-[10px] font-mono uppercase mt-1.5 tracking-wider">
          NO SESSIONS YET
        </p>
      )}
    </div>
  );
}
