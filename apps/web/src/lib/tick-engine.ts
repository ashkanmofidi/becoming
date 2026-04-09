/**
 * Tick Engine — standalone singleton. ZERO React dependency.
 *
 * Architecture: a single module that owns a Web Audio oscillator loop.
 * Two methods: startTick() and stopTick(). Nothing else.
 *
 * Uses Web Audio API scheduled timing (audioContext.currentTime)
 * instead of setInterval, which drifts and gets throttled by browsers
 * when tabs are backgrounded.
 *
 * The tick is a handpan-style D4 (293.66Hz) triangle + A4 (440Hz)
 * overtone, scheduled 1 second apart using audioContext scheduling.
 *
 * This module does NOT know about React, components, navigation,
 * visibility, or mount/unmount. The caller (timer state manager)
 * simply calls startTick() when a session is running and stopTick()
 * when it's not. That's the entire contract.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let nextTickTime = 0;
let isRunning = false;
let isMuted = false;

const TICK_INTERVAL = 1.0; // seconds
const SCHEDULE_AHEAD = 0.1; // schedule ticks 100ms ahead for precision
const LOOKAHEAD = 25; // ms between scheduler checks

/** Initialize audio context on first user gesture. */
function ensureContext(): boolean {
  if (ctx && ctx.state !== 'closed') {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    return true;
  }
  try {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : 1;
    masterGain.connect(ctx.destination);
    return true;
  } catch {
    return false;
  }
}

/** Schedule a single handpan tick at the given audioContext time. */
function scheduleTick(time: number): void {
  if (!ctx || !masterGain) return;

  // Fundamental: D4 (293.66 Hz) — warm triangle wave
  const fund = ctx.createOscillator();
  const fundGain = ctx.createGain();
  fund.type = 'triangle';
  fund.frequency.value = 293.66;
  fundGain.gain.setValueAtTime(0, time);
  fundGain.gain.linearRampToValueAtTime(0.018, time + 0.005);
  fundGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);
  fund.connect(fundGain);
  fundGain.connect(masterGain);
  fund.start(time);
  fund.stop(time + 0.5);

  // Overtone: A4 (440 Hz) — shimmer
  const over = ctx.createOscillator();
  const overGain = ctx.createGain();
  over.type = 'sine';
  over.frequency.value = 440;
  overGain.gain.setValueAtTime(0, time);
  overGain.gain.linearRampToValueAtTime(0.004, time + 0.003);
  overGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
  over.connect(overGain);
  overGain.connect(masterGain);
  over.start(time);
  over.stop(time + 0.35);
}

/**
 * The scheduler: runs every 25ms via setInterval, but schedules ticks
 * using audioContext.currentTime for sample-accurate timing.
 * This is the standard Web Audio scheduling pattern (Chris Wilson's article).
 */
function scheduler(): void {
  if (!ctx || !isRunning) return;

  while (nextTickTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleTick(nextTickTime);
    nextTickTime += TICK_INTERVAL;
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Start the tick loop. Call when a focus session begins or resumes.
 * Safe to call multiple times — idempotent.
 */
export function startTick(): void {
  if (isRunning) return;
  if (!ensureContext()) return;

  isRunning = true;
  // Start scheduling from slightly in the future to avoid an instant burst
  nextTickTime = ctx!.currentTime + 0.5;
  schedulerInterval = setInterval(scheduler, LOOKAHEAD);
}

/**
 * Stop the tick loop. Call when session pauses, completes, or user is on break.
 * Safe to call multiple times — idempotent.
 */
export function stopTick(): void {
  isRunning = false;
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

/**
 * Set mute state. When muted, ticks still "schedule" (timing stays accurate)
 * but masterGain is 0 so nothing is audible.
 */
export function setTickMuted(muted: boolean): void {
  isMuted = muted;
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  }
}

/** Check if tick is currently running. */
export function isTickRunning(): boolean {
  return isRunning;
}
