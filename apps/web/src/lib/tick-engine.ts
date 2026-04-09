/**
 * Tick Engine v3 — real audio files, Web Audio scheduled timing.
 *
 * Uses AudioBufferSourceNode for each tick, scheduled ahead on the
 * audio clock (Chris Wilson pattern). No setInterval drift.
 *
 * The buffer is loaded ONCE on first startTick() and cached.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let tickBuffer: AudioBuffer | null = null;
let loudTickBuffer: AudioBuffer | null = null;
let isRunning = false;
let isMuted = false;
let volumeLevel = 1;
let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let nextTickTime = 0;
let bufferLoading = false;

const TICK_INTERVAL = 1.0; // 1 second
const SCHEDULE_AHEAD = 0.15; // schedule 150ms ahead
const SCHEDULER_INTERVAL = 25; // check every 25ms

async function ensureContext(): Promise<boolean> {
  if (!ctx || ctx.state === 'closed') {
    try {
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = isMuted ? 0 : volumeLevel;
      masterGain.connect(ctx.destination);
    } catch { return false; }
  }
  if (ctx.state === 'suspended') await ctx.resume();
  return true;
}

async function loadBuffers(): Promise<void> {
  if (tickBuffer || bufferLoading || !ctx) return;
  bufferLoading = true;
  try {
    const [softRes, sharpRes] = await Promise.all([
      fetch('/sounds/tick-soft.ogg'),
      fetch('/sounds/tick-sharp.ogg'),
    ]);
    if (softRes.ok) {
      tickBuffer = await ctx.decodeAudioData(await softRes.arrayBuffer());
    }
    if (sharpRes.ok) {
      loudTickBuffer = await ctx.decodeAudioData(await sharpRes.arrayBuffer());
    }
  } catch { /* silent — ticks won't play but app won't crash */ }
  bufferLoading = false;
}

function scheduleTick(time: number, loud = false): void {
  if (!ctx || !masterGain) return;
  const buffer = loud && loudTickBuffer ? loudTickBuffer : tickBuffer;
  if (!buffer) return;

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = loud ? 0.8 : 0.5;
  source.connect(gain);
  gain.connect(masterGain);
  source.start(time);
}

function runScheduler(): void {
  if (!ctx || !isRunning) return;
  const currentTime = ctx.currentTime;
  while (nextTickTime < currentTime + SCHEDULE_AHEAD) {
    scheduleTick(nextTickTime);
    nextTickTime += TICK_INTERVAL;
  }
}

// ─── Public API ──────────────────────────────────────────────

export async function startTick(): Promise<void> {
  if (isRunning) return;
  if (!(await ensureContext())) return;
  await loadBuffers();
  if (!tickBuffer) return; // File failed to load — silently skip

  isRunning = true;
  nextTickTime = ctx!.currentTime + 0.3; // First tick 300ms from now (no burst)
  schedulerTimer = setInterval(runScheduler, SCHEDULER_INTERVAL);
}

export function stopTick(): void {
  isRunning = false;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
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
