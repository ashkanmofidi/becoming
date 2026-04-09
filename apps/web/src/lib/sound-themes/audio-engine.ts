/**
 * Web Audio API sound engine. PRD Section 5.7.
 *
 * Architecture: ALL audio routes through a single masterGain node.
 * Mute sets masterGain.value = 0. Unmute restores it.
 * Silent theme check + mute check happen ONCE at the top of each play function.
 */

type SoundTheme = 'warm' | 'minimal' | 'nature' | 'silent';

interface AudioEngineState {
  context: AudioContext | null;
  masterGain: GainNode | null;
  ambientGain: GainNode | null;
  initialized: boolean;
  muted: boolean;
  volume: number;
  theme: SoundTheme;
}

const state: AudioEngineState = {
  context: null,
  masterGain: null,
  ambientGain: null,
  initialized: false,
  muted: false,
  volume: 0.6,
  theme: 'warm',
};

/** Check if any sound should play — single gate for everything. */
function shouldPlay(): boolean {
  return state.initialized && !state.muted && state.theme !== 'silent' &&
    state.context !== null && state.masterGain !== null;
}

// ─── Lifecycle ───────────────────────────────────────────────

export function initAudioEngine(masterVolume: number): void {
  if (state.initialized) return;
  state.context = new AudioContext();
  state.masterGain = state.context.createGain();
  state.volume = masterVolume / 100;
  state.masterGain.gain.value = state.muted ? 0 : state.volume;
  state.masterGain.connect(state.context.destination);
  state.initialized = true;
}

export async function resumeContext(): Promise<void> {
  if (state.context?.state === 'suspended') {
    await state.context.resume();
  }
}

export function destroyAudioEngine(): void {
  stopAmbientSound();
  state.context?.close();
  state.context = null;
  state.masterGain = null;
  state.initialized = false;
}

// ─── Master Controls ─────────────────────────────────────────

export function setMuted(muted: boolean): void {
  state.muted = muted;
  if (state.masterGain && state.context) {
    state.masterGain.gain.setTargetAtTime(
      muted ? 0 : state.volume,
      state.context.currentTime,
      0.02,
    );
  }
}

export function setMasterVolume(volume: number): void {
  state.volume = volume / 100;
  if (state.masterGain && state.context && !state.muted) {
    state.masterGain.gain.setTargetAtTime(state.volume, state.context.currentTime, 0.05);
  }
}

export function setTheme(theme: SoundTheme): void {
  state.theme = theme;
}

// ─── Handpan Tick ────────────────────────────────────────────

/**
 * Single handpan strike — D4 (293.66Hz) triangle + A4 (440Hz) overtone.
 * 5ms attack, 450ms natural decay. Meditative, fatigue-free.
 */
export function playTick(volume = 0.018): void {
  if (!shouldPlay()) return;
  const ctx = state.context!;
  const now = ctx.currentTime;

  // Fundamental: D4 — warm, grounding
  const fund = ctx.createOscillator();
  const fundG = ctx.createGain();
  fund.type = 'triangle';
  fund.frequency.value = 293.66;
  fundG.gain.setValueAtTime(0, now);
  fundG.gain.linearRampToValueAtTime(volume, now + 0.005);
  fundG.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  fund.connect(fundG);
  fundG.connect(state.masterGain!);
  fund.start(now);
  fund.stop(now + 0.5);

  // Overtone: A4 — shimmer
  const over = ctx.createOscillator();
  const overG = ctx.createGain();
  over.type = 'sine';
  over.frequency.value = 440;
  overG.gain.setValueAtTime(0, now);
  overG.gain.linearRampToValueAtTime(volume * 0.25, now + 0.003);
  overG.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  over.connect(overG);
  overG.connect(state.masterGain!);
  over.start(now);
  over.stop(now + 0.35);
}

/** Last 30s — same handpan, slightly louder. */
export function playLast30sTick(): void {
  playTick(0.03);
}

// ─── Event Sounds ────────────────────────────────────────────

/** Activation chime — A4 handpan, signals session start. */
export function playActivationChime(): void {
  if (!shouldPlay()) return;
  const ctx = state.context!;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  osc.connect(gain);
  gain.connect(state.masterGain!);
  osc.start(now);
  osc.stop(now + 0.7);
}

/** Completion bell — D4+A4 handpan chord, warm, satisfying. */
export function playCompletionBell(volume = 0.12): void {
  if (!shouldPlay()) return;
  const ctx = state.context!;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const g1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.value = 293.66;
  g1.gain.setValueAtTime(0, now);
  g1.gain.linearRampToValueAtTime(volume, now + 0.01);
  g1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  osc1.connect(g1);
  g1.connect(state.masterGain!);
  osc1.start(now);
  osc1.stop(now + 1.3);

  const osc2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 440;
  g2.gain.setValueAtTime(0, now + 0.1);
  g2.gain.linearRampToValueAtTime(volume * 0.5, now + 0.12);
  g2.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
  osc2.connect(g2);
  g2.connect(state.masterGain!);
  osc2.start(now);
  osc2.stop(now + 1.1);
}

/** Break complete — soft G4. */
export function playBreakComplete(): void {
  if (!shouldPlay()) return;
  const ctx = state.context!;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 392;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(gain);
  gain.connect(state.masterGain!);
  osc.start(now);
  osc.stop(now + 0.55);
}

/** Pause — gentle descending D4→A3. */
export function playPauseSound(): void {
  if (!shouldPlay()) return;
  playSequence([293.66, 220], 0.06, 120);
}

/** Resume — gentle ascending A3→D4. */
export function playResumeSound(): void {
  if (!shouldPlay()) return;
  playSequence([220, 293.66], 0.06, 120);
}

function playSequence(freqs: number[], volume: number, durationMs: number): void {
  const ctx = state.context!;
  let t = ctx.currentTime;

  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
    osc.connect(gain);
    gain.connect(state.masterGain!);
    osc.start(t);
    osc.stop(t + durationMs / 1000 + 0.05);
    t += durationMs / 1000;
  }
}

// ─── Ambient Sound ───────────────────────────────────────────

export function startAmbientSound(type: string, volume: number): void {
  if (!state.context || !state.masterGain || type === 'none') return;
  stopAmbientSound();

  state.ambientGain = state.context.createGain();
  state.ambientGain.gain.value = 0;
  state.ambientGain.connect(state.masterGain);

  for (let i = 0; i < 6; i++) {
    const osc = state.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80 + Math.random() * 300;
    const g = state.context.createGain();
    g.gain.value = 0.08;
    osc.connect(g);
    g.connect(state.ambientGain!);
    osc.start();
  }

  state.ambientGain.gain.setTargetAtTime(volume / 100, state.context.currentTime, 1.0);
}

export function stopAmbientSound(): void {
  if (state.ambientGain && state.context) {
    state.ambientGain.gain.setTargetAtTime(0, state.context.currentTime, 0.5);
  }
}

// ─── Haptic ──────────────────────────────────────────────────

export function triggerHaptic(durationMs: number): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(durationMs);
  }
}
