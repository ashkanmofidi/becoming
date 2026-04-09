/**
 * Tick Engine — uses REAL sound files, not oscillators.
 *
 * Plays actual recorded tick sounds (CC0 from github.com/akx/Notifications).
 * Uses Web Audio API buffer scheduling for precise timing.
 * Singleton module — zero React dependency.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let tickBuffer: AudioBuffer | null = null;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;
let nextTickTime = 0;
let isRunning = false;
let isMuted = false;
let volumeLevel = 1;

const TICK_INTERVAL = 1.0;
const SCHEDULE_AHEAD = 0.1;
const LOOKAHEAD = 25;

// Default tick sound — soft, pleasant
const TICK_URL = '/sounds/tick-soft.ogg';

function ensureContext(): boolean {
  if (ctx && ctx.state !== 'closed') {
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  try {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : volumeLevel;
    masterGain.connect(ctx.destination);
    return true;
  } catch { return false; }
}

async function loadTickBuffer(): Promise<void> {
  if (tickBuffer || !ctx) return;
  try {
    const response = await fetch(TICK_URL);
    if (!response.ok) return;
    const arrayBuffer = await response.arrayBuffer();
    tickBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch { /* silent — fall back to no tick */ }
}

function scheduleTick(time: number): void {
  if (!ctx || !masterGain || !tickBuffer) return;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.5; // Scale the recorded tick volume
  source.buffer = tickBuffer;
  source.connect(gain);
  gain.connect(masterGain);
  source.start(time);
}

function scheduler(): void {
  if (!ctx || !isRunning) return;
  while (nextTickTime < ctx.currentTime + SCHEDULE_AHEAD) {
    scheduleTick(nextTickTime);
    nextTickTime += TICK_INTERVAL;
  }
}

// ─── Public API ──────────────────────────────────────────────

export async function startTick(): Promise<void> {
  if (isRunning) return;
  if (!ensureContext()) return;
  await loadTickBuffer();
  isRunning = true;
  nextTickTime = ctx!.currentTime + 0.5;
  schedulerInterval = setInterval(scheduler, LOOKAHEAD);
}

export function stopTick(): void {
  isRunning = false;
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

export function setTickMuted(muted: boolean): void {
  isMuted = muted;
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : volumeLevel, ctx.currentTime, 0.02);
  }
}

export function setTickVolume(volume: number): void {
  volumeLevel = volume / 100;
  if (masterGain && ctx && !isMuted) {
    masterGain.gain.setTargetAtTime(volumeLevel, ctx.currentTime, 0.02);
  }
}

export function isTickRunning(): boolean {
  return isRunning;
}
