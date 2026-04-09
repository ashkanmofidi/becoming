/**
 * Web Audio API sound engine. PRD Section 5.7.
 *
 * Architecture: ALL audio routes through a single masterGain node.
 * Mute sets masterGain.value = 0. Unmute restores it.
 * This is the ONE source of truth for audio on/off — no per-call-site checks.
 */

type SoundTheme = 'warm' | 'minimal' | 'nature' | 'silent';

interface AudioEngineState {
  context: AudioContext | null;
  masterGain: GainNode | null;
  ambientGain: GainNode | null;
  initialized: boolean;
  muted: boolean;
  volume: number; // Stored so unmute can restore
}

const state: AudioEngineState = {
  context: null,
  masterGain: null,
  ambientGain: null,
  initialized: false,
  muted: false,
  volume: 0.6,
};

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

/** Mute: sets master gain to 0. All sounds silenced instantly. */
export function setMuted(muted: boolean): void {
  state.muted = muted;
  if (state.masterGain && state.context) {
    state.masterGain.gain.setTargetAtTime(
      muted ? 0 : state.volume,
      state.context.currentTime,
      0.02, // 20ms smooth transition (no pop)
    );
  }
}

export function isMuted(): boolean {
  return state.muted;
}

export function setMasterVolume(volume: number): void {
  state.volume = volume / 100;
  if (state.masterGain && state.context && !state.muted) {
    state.masterGain.gain.setTargetAtTime(state.volume, state.context.currentTime, 0.05);
  }
}

// ─── Handpan Tick ────────────────────────────────────────────

/**
 * Play a single handpan-style tick — the core focus sound.
 *
 * Design: a meditative handpan strike tuned to D4 (293.66 Hz).
 * - Warm sine/triangle blend with natural exponential decay
 * - Slight detuned overtone at ~440Hz (perfect 5th) for richness
 * - Quick soft attack (5ms), long tail (~400ms)
 * - Feels like a single tongue drum or handpan note
 * - Volume is sub-ambient: you could listen 90 minutes without fatigue
 */
export function playTick(volume = 0.018): void {
  if (!state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;

  // Fundamental: D4 (293.66 Hz) — warm, grounding
  const fundamental = ctx.createOscillator();
  const fundGain = ctx.createGain();
  fundamental.type = 'triangle'; // Warmer than sine, fewer harmonics than square
  fundamental.frequency.value = 293.66;
  fundGain.gain.setValueAtTime(0, now);
  fundGain.gain.linearRampToValueAtTime(volume, now + 0.005); // 5ms attack
  fundGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45); // Natural decay

  fundamental.connect(fundGain);
  fundGain.connect(state.masterGain);
  fundamental.start(now);
  fundamental.stop(now + 0.5);

  // Overtone: A4 (440 Hz) — perfect 5th above, adds shimmer
  const overtone = ctx.createOscillator();
  const overGain = ctx.createGain();
  overtone.type = 'sine';
  overtone.frequency.value = 440;
  overGain.gain.setValueAtTime(0, now);
  overGain.gain.linearRampToValueAtTime(volume * 0.25, now + 0.003); // Faster, quieter
  overGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3); // Shorter tail

  overtone.connect(overGain);
  overGain.connect(state.masterGain);
  overtone.start(now);
  overtone.stop(now + 0.35);
}

/**
 * Last 30s tick — same handpan, slightly more present.
 */
export function playLast30sTick(): void {
  playTick(0.03);
}

// ─── Event Sounds ────────────────────────────────────────────

/**
 * Activation chime — gentle single handpan note, higher register.
 * A4 (440Hz), slightly louder than tick. Signals "session begins."
 */
export function playActivationChime(theme: SoundTheme): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

  osc.connect(gain);
  gain.connect(state.masterGain);
  osc.start(now);
  osc.stop(now + 0.7);
}

/**
 * Completion bell — two-note handpan chord. Warm, satisfying.
 * D4 + A4, staggered onset, long decay.
 */
export function playCompletionBell(theme: SoundTheme, volume = 0.12): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;

  // D4
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'triangle';
  osc1.frequency.value = 293.66;
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  osc1.connect(gain1);
  gain1.connect(state.masterGain);
  osc1.start(now);
  osc1.stop(now + 1.3);

  // A4 — enters slightly after, quieter
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 440;
  gain2.gain.setValueAtTime(0, now + 0.1);
  gain2.gain.linearRampToValueAtTime(volume * 0.5, now + 0.12);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
  osc2.connect(gain2);
  gain2.connect(state.masterGain);
  osc2.start(now);
  osc2.stop(now + 1.1);
}

/** Break complete — single soft G4 marimba-style note. */
export function playBreakComplete(theme: SoundTheme): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 392; // G4
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  osc.connect(gain);
  gain.connect(state.masterGain);
  osc.start(now);
  osc.stop(now + 0.55);
}

/** Pause — gentle descending two-note. */
export function playPauseSound(theme: SoundTheme): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;
  playNoteSequence([293.66, 220], 0.06, 120);
}

/** Resume — gentle ascending two-note. */
export function playResumeSound(theme: SoundTheme): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;
  playNoteSequence([220, 293.66], 0.06, 120);
}

/** Internal: play a sequence of frequencies as triangle waves. */
function playNoteSequence(frequencies: number[], volume: number, durationMs: number): void {
  if (!state.context || !state.masterGain) return;

  const ctx = state.context;
  let startTime = ctx.currentTime;

  for (const freq of frequencies) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(state.masterGain!);
    osc.start(startTime);
    osc.stop(startTime + durationMs / 1000 + 0.05);
    startTime += durationMs / 1000;
  }
}

// ─── Ambient Sound ───────────────────────────────────────────

export function startAmbientSound(type: string, volume: number): void {
  if (!state.context || !state.masterGain || type === 'none') return;
  stopAmbientSound();

  state.ambientGain = state.context.createGain();
  state.ambientGain.gain.value = 0;
  state.ambientGain.connect(state.masterGain);

  // Generate ambient noise via detuned oscillators
  for (let i = 0; i < 6; i++) {
    const osc = state.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80 + Math.random() * 300;
    const oscGain = state.context.createGain();
    oscGain.gain.value = 0.08;
    osc.connect(oscGain);
    oscGain.connect(state.ambientGain!);
    osc.start();
  }

  // 3-second fade in
  const targetVolume = volume / 100;
  state.ambientGain.gain.setTargetAtTime(targetVolume, state.context.currentTime, 1.0);
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
