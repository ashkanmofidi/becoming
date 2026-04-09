'use client';

import { useEffect, useRef } from 'react';
import type { TimerStatus, TimerMode } from '@becoming/shared';

interface UseDynamicFaviconOptions {
  status: TimerStatus;
  mode: TimerMode;
  progress: number; // 0 to 1 (how much has elapsed)
  enabled: boolean;
}

const SIZE = 32;
const CENTER = SIZE / 2;
const RING_RADIUS = 12;
const RING_WIDTH = 3;

// Colors
const AMBER = '#D97706';
const AMBER_GLOW = '#F59E0B';
const GOLD = '#FCD34D';
const TEAL = '#0D9488';
const TEAL_GLOW = '#14B8A6';
const CHARCOAL = '#1A1A1A';
const CHARCOAL_LIGHT = '#2A2A2A';
const WHITE = '#FFFFFF';

/**
 * Dynamic animated favicon. PRD Section 5.2.8.
 * Canvas-based 32x32 favicon that reacts to timer state.
 * Updates every frame when running, static when idle.
 */
export function useDynamicFavicon({ status, mode, progress, enabled }: UseDynamicFaviconOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const linkRef = useRef<HTMLLinkElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef(0);
  const prevStatusRef = useRef<TimerStatus>('idle');

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    // Create canvas once
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = SIZE;
      canvasRef.current.height = SIZE;
    }

    // Find or create favicon link
    if (!linkRef.current) {
      let existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!existing) {
        existing = document.createElement('link');
        existing.rel = 'icon';
        existing.type = 'image/png';
        document.head.appendChild(existing);
      }
      linkRef.current = existing;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Completion flash state
    let flashPhase = 0;
    if (status === 'completed' && prevStatusRef.current !== 'completed') {
      flashPhase = 1; // Start flash
    }
    prevStatusRef.current = status;

    function render() {
      if (!ctx) return;
      tickRef.current++;

      ctx.clearRect(0, 0, SIZE, SIZE);

      if (status === 'running' || status === 'overtime') {
        renderRunning(ctx, mode, progress, tickRef.current);
      } else if (status === 'paused') {
        renderPaused(ctx, mode, progress, tickRef.current);
      } else if (status === 'completed') {
        if (flashPhase > 0) {
          renderCompletionFlash(ctx, flashPhase);
          flashPhase -= 0.02;
        } else {
          renderCompleted(ctx, tickRef.current);
        }
      } else {
        renderIdle(ctx, tickRef.current);
      }

      // Apply to favicon
      if (linkRef.current) {
        linkRef.current.href = canvas.toDataURL('image/png');
      }

      // Continue animation for active states
      if (status === 'running' || status === 'overtime' || status === 'paused' ||
          (status === 'completed' && flashPhase > 0)) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    }

    // Start rendering
    render();

    // For idle/completed-settled, re-render on state change only (not every frame)
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [status, mode, progress, enabled]);
}

/** Focusing: vibrant pulsing amber with draining arc progress ring */
function renderRunning(ctx: CanvasRenderingContext2D, mode: TimerMode, progress: number, tick: number) {
  const isBreak = mode === 'break' || mode === 'long_break';
  const baseColor = isBreak ? TEAL : AMBER;
  const glowColor = isBreak ? TEAL_GLOW : AMBER_GLOW;

  // Breathing pulse (subtle glow)
  const breathe = Math.sin(tick * 0.05) * 0.15 + 0.85;

  // Background circle with radial gradient
  const grad = ctx.createRadialGradient(CENTER, CENTER, 2, CENTER, CENTER, CENTER);
  grad.addColorStop(0, glowColor);
  grad.addColorStop(0.6, baseColor);
  grad.addColorStop(1, isBreak ? '#064E3B' : '#78350F');

  ctx.globalAlpha = breathe;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 1, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Progress ring (drains clockwise from 12 o'clock)
  ctx.globalAlpha = 1;
  const remaining = 1 - progress;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * remaining);

  // Ring track (dark)
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RING_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = RING_WIDTH;
  ctx.stroke();

  // Ring progress (bright)
  if (remaining > 0.005) {
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RING_RADIUS, startAngle, endAngle);
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = RING_WIDTH;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

/** Paused: desaturated, gentle pulse */
function renderPaused(ctx: CanvasRenderingContext2D, mode: TimerMode, progress: number, tick: number) {
  const breathe = Math.sin(tick * 0.03) * 0.1 + 0.5; // Slower, dimmer

  // Muted background
  ctx.globalAlpha = breathe;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 1, 0, Math.PI * 2);
  ctx.fillStyle = mode === 'break' || mode === 'long_break' ? '#134E4A' : '#78350F';
  ctx.fill();

  // Frozen progress ring
  ctx.globalAlpha = 0.6;
  const remaining = 1 - progress;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * remaining);

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RING_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = RING_WIDTH;
  ctx.stroke();

  if (remaining > 0.005) {
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RING_RADIUS, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = RING_WIDTH;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Pause bars
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = WHITE;
  ctx.fillRect(CENTER - 4, CENTER - 4, 2.5, 8);
  ctx.fillRect(CENTER + 1.5, CENTER - 4, 2.5, 8);
}

/** Idle: cool charcoal with a minimal amber spark */
function renderIdle(ctx: CanvasRenderingContext2D, tick: number) {
  const sparkle = Math.sin(tick * 0.02) * 0.15 + 0.85;

  // Dark circle
  const grad = ctx.createRadialGradient(CENTER, CENTER, 2, CENTER, CENTER, CENTER);
  grad.addColorStop(0, CHARCOAL_LIGHT);
  grad.addColorStop(1, CHARCOAL);

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 1, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle amber dot in center — a resting spark
  ctx.globalAlpha = sparkle;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 3, 0, Math.PI * 2);
  ctx.fillStyle = AMBER;
  ctx.fill();
}

/** Completion flash: white → gold burst, then settle */
function renderCompletionFlash(ctx: CanvasRenderingContext2D, phase: number) {
  // Flash white → gold transition
  const flashColor = phase > 0.5 ? WHITE : GOLD;

  ctx.globalAlpha = Math.min(1, phase * 2);
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 1 + phase * 3, 0, Math.PI * 2);
  ctx.fillStyle = flashColor;
  ctx.fill();
}

/** Completed (settled): glowing full-circle gold */
function renderCompleted(ctx: CanvasRenderingContext2D, tick: number) {
  const glow = Math.sin(tick * 0.04) * 0.1 + 0.9;

  const grad = ctx.createRadialGradient(CENTER, CENTER, 2, CENTER, CENTER, CENTER);
  grad.addColorStop(0, GOLD);
  grad.addColorStop(0.7, AMBER_GLOW);
  grad.addColorStop(1, AMBER);

  ctx.globalAlpha = glow;
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, CENTER - 1, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Checkmark
  ctx.globalAlpha = 1;
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(CENTER - 5, CENTER);
  ctx.lineTo(CENTER - 1, CENTER + 4);
  ctx.lineTo(CENTER + 6, CENTER - 4);
  ctx.stroke();
}
