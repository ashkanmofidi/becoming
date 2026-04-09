'use client';

import { useState, useRef, useCallback } from 'react';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  subtitle?: string;
  suffix?: string;
  disabled?: boolean;
}

/**
 * Numeric stepper. PRD Section 6.1.
 * +/- buttons, hold 500ms for rapid increment, tap number for inline edit.
 */
export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  subtitle,
  suffix,
  disabled,
}: StepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  const startHold = useCallback((direction: 1 | -1) => {
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onChange(clamp(value + step * direction));
      }, 100);
    }, 500);
  }, [value, step, min, max, onChange]);

  const stopHold = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const handleEditSubmit = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
    setIsEditing(false);
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-surface-100">{label}</span>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(clamp(value - step))}
          onMouseDown={() => startHold(-1)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          disabled={disabled || value <= min}
          className="w-8 h-8 rounded-lg bg-surface-900 text-surface-300 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-lg"
        >
          −
        </button>

        {isEditing ? (
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
            className="w-14 h-8 bg-surface-900 border border-amber rounded text-center text-sm font-mono text-white outline-none"
            autoFocus
            min={min}
            max={max}
          />
        ) : (
          <button
            onClick={() => {
              if (!disabled) {
                setEditValue(String(value));
                setIsEditing(true);
              }
            }}
            className="w-14 h-8 bg-surface-900 rounded text-center text-sm font-mono text-white hover:bg-surface-700 transition-colors"
          >
            {value}{suffix ?? ''}
          </button>
        )}

        <button
          onClick={() => onChange(clamp(value + step))}
          onMouseDown={() => startHold(1)}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          disabled={disabled || value >= max}
          className="w-8 h-8 rounded-lg bg-surface-900 text-surface-300 hover:text-white hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors text-lg"
        >
          +
        </button>
      </div>
    </div>
  );
}
