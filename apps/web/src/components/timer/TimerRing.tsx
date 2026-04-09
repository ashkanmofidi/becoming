'use client';

import { useMemo } from 'react';
import type { TimerStatus, TimerMode } from '@becoming/shared';
import { COLORS } from '@becoming/shared';

interface TimerRingProps {
  progress: number; // 0 to 1 (how much has elapsed)
  status: TimerStatus;
  mode: TimerMode;
  displayTime: string;
  remainingSeconds: number;
  accentColor: string;
  breakAccentColor: string;
  reducedMotion: boolean;
  showSeconds: boolean;
}

const RING_SIZE = 280;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE * 2) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/**
 * Circular timer display. PRD Section 5.2.
 * SVG ring with stroke-dashoffset tied to progress.
 * Visual states: idle, running, paused, completed, overtime, break.
 */
export function TimerRing({
  progress,
  status,
  mode,
  displayTime,
  _remainingSeconds,
  accentColor,
  breakAccentColor,
  reducedMotion,
  _showSeconds,
}: TimerRingProps) {
  // Ring color based on mode and progress (PRD 5.2.2)
  const ringColor = useMemo(() => {
    if (mode === 'break' || mode === 'long_break') return breakAccentColor;
    if (status === 'paused') return COLORS.PAUSED_RING;
    if (status === 'overtime') return accentColor;

    // Color warming during focus (PRD 5.2.2)
    const remaining = 1 - progress;
    if (remaining <= 0.25) return COLORS.RING_25_PERCENT;
    if (remaining <= 0.5) return COLORS.RING_50_PERCENT;
    return accentColor;
  }, [mode, status, progress, accentColor, breakAccentColor]);

  // Dash offset for ring depletion
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  // Status label
  const statusLabel = useMemo(() => {
    switch (status) {
      case 'idle':
        return mode === 'focus' ? 'READY TO FOCUS' : mode === 'break' ? 'TIME TO REST' : 'LONG BREAK';
      case 'running':
        return mode === 'focus' ? 'FOCUSING...' : 'RESTING...';
      case 'paused':
        return 'PAUSED';
      case 'completed':
        return 'SESSION COMPLETE';
      case 'overtime':
        return `OVERTIME: ${displayTime}`;
      default:
        return '';
    }
  }, [status, mode, displayTime]);

  // Animation classes
  const glowClass = useMemo(() => {
    if (reducedMotion) return '';
    if (status === 'idle') {
      return mode === 'break' || mode === 'long_break'
        ? 'animate-breathing-glow-break'
        : 'animate-breathing-glow';
    }
    if (status === 'paused') return 'animate-breathing-glow';
    return '';
  }, [status, mode, reducedMotion]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
      {/* Background radial gradient (PRD 5.2.1) */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 60%, ${ringColor}08 100%)`,
        }}
      />

      {/* SVG Ring */}
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        className={`absolute inset-0 -rotate-90 ${glowClass}`}
        style={{ color: ringColor }}
      >
        {/* Track ring */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          opacity={0.15}
        />
        {/* Progress ring */}
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={status === 'idle' ? 0 : dashOffset}
          className={reducedMotion ? '' : 'transition-[stroke-dashoffset] duration-200 ease-linear'}
        />
      </svg>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Timer display (PRD 5.2.1: ~72px desktop monospaced flip-clock) */}
        <div
          className="font-mono text-white font-semibold tracking-tight"
          style={{ fontSize: 'clamp(3rem, 8vw, 4.5rem)' }}
        >
          {displayTime.split('').map((char, i) => (
            <span
              key={`${i}-${char}`}
              className={`inline-block ${
                !reducedMotion && status === 'running' ? 'flip-digit' : ''
              }`}
              style={{
                opacity: status === 'paused' ? 0.7 : 1,
              }}
            >
              {char}
            </span>
          ))}
        </div>

        {/* Status label */}
        <p
          className={`
            mt-2 text-xs font-mono uppercase tracking-[0.2em]
            ${status === 'completed' ? 'text-amber' : 'text-surface-500'}
            ${!reducedMotion && status === 'idle' ? 'animate-fade-cycle' : ''}
          `}
        >
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
