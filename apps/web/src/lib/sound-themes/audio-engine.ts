/**
 * Web Audio API sound engine. PRD Section 5.7.
 * Uses Web Audio API (not HTML5 <audio>). Preloaded buffers on session start.
 */

type SoundTheme = 'warm' | 'minimal' | 'nature' | 'silent';

interface AudioEngineState {
  context: AudioContext | null;
  masterGain: GainNode | null;
  ambientSource: AudioBufferSourceNode | null;
  ambientGain: GainNode | null;
  initialized: boolean;
}

const state: AudioEngineState = {
  context: null,
  masterGain: null,
  ambientSource: null,
  ambientGain: null,
  initialized: false,
};

/**
 * Initialize the audio context. Must be called from a user gesture.
 * PRD: No autoplay on load (browser policy).
 */
export function initAudioEngine(masterVolume: number): void {
  if (state.initialized) return;

  state.context = new AudioContext();
  state.masterGain = state.context.createGain();
  state.masterGain.gain.value = masterVolume / 100;
  state.masterGain.connect(state.context.destination);
  state.initialized = true;
}

/**
 * Ensure context is running (may be suspended by browser).
 */
export async function resumeContext(): Promise<void> {
  if (state.context?.state === 'suspended') {
    await state.context.resume();
  }
}

/**
 * Set master volume (0-100). PRD Section 6.4.
 */
export function setMasterVolume(volume: number): void {
  if (state.masterGain) {
    state.masterGain.gain.setTargetAtTime(volume / 100, state.context!.currentTime, 0.05);
  }
}

/**
 * Play a tone at a given frequency and duration.
 */
export function playTone(
  frequency: number,
  durationMs: number,
  options?: { volume?: number; type?: string; fadeOut?: number },
): void {
  if (!state.context || !state.masterGain) return;

  const osc = state.context.createOscillator();
  const gain = state.context.createGain();

  osc.type = (options?.type ?? 'sine') as OscillatorType;
  osc.frequency.value = frequency;
  gain.gain.value = options?.volume ?? 0.6;

  osc.connect(gain);
  gain.connect(state.masterGain);

  const now = state.context.currentTime;
  const duration = durationMs / 1000;
  const fadeOut = (options?.fadeOut ?? durationMs * 0.3) / 1000;

  gain.gain.setTargetAtTime(0, now + duration - fadeOut, fadeOut / 3);

  osc.start(now);
  osc.stop(now + duration);
}

/**
 * Play two notes in sequence (e.g., pause D4→A3, resume A3→D4).
 */
export function playNoteSequence(
  notes: { frequency: number; durationMs: number }[],
  options?: { volume?: number; type?: string },
): void {
  if (!state.context || !state.masterGain) return;

  let startTime = state.context.currentTime;
  for (const note of notes) {
    const osc = state.context.createOscillator();
    const gain = state.context.createGain();
    osc.type = (options?.type ?? 'sine') as OscillatorType;
    osc.frequency.value = note.frequency;
    gain.gain.value = options?.volume ?? 0.6;

    osc.connect(gain);
    gain.connect(state.masterGain!);

    const duration = note.durationMs / 1000;
    gain.gain.setTargetAtTime(0, startTime + duration * 0.7, duration * 0.1);

    osc.start(startTime);
    osc.stop(startTime + duration);
    startTime += duration;
  }
}

/**
 * Play activation chime. Gentle single note — not jarring.
 * Soft sine wave, quick fade. Like a gentle "ding."
 */
export function playActivationChime(theme: SoundTheme): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = 440; // A4 — soft, familiar
  gain.gain.value = 0.15; // Very quiet
  gain.gain.setTargetAtTime(0, now + 0.15, 0.08); // Quick gentle fade

  osc.connect(gain);
  gain.connect(state.masterGain);
  osc.start(now);
  osc.stop(now + 0.4);
}

/**
 * Play completion bell. Gentle two-tone chime — warm and satisfying, not jarring.
 * Soft sine waves with long decay.
 */
export function playCompletionBell(theme: SoundTheme, volume = 0.25): void {
  if (theme === 'silent' || !state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;

  // First note: C5 (523Hz) — soft sine
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 523;
  gain1.gain.setValueAtTime(volume, now);
  gain1.gain.setTargetAtTime(0, now + 0.8, 0.3); // Long gentle fade
  osc1.connect(gain1);
  gain1.connect(state.masterGain);
  osc1.start(now);
  osc1.stop(now + 1.5);

  // Second note: E5 (659Hz) — slightly delayed, quieter
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 659;
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(volume * 0.6, now + 0.15); // Starts after first note
  gain2.gain.setTargetAtTime(0, now + 0.9, 0.3);
  osc2.connect(gain2);
  gain2.connect(state.masterGain);
  osc2.start(now);
  osc2.stop(now + 1.5);
}

/**
 * Play break complete marimba. PRD Section 5.2.6: G4, 400ms.
 */
export function playBreakComplete(theme: SoundTheme): void {
  if (theme === 'silent') return;
  playTone(392, 400, { volume: 0.5, type: 'triangle' });
}

/**
 * Play pause sound. Gentle descending tone.
 */
export function playPauseSound(theme: SoundTheme): void {
  if (theme === 'silent') return;
  playNoteSequence([
    { frequency: 294, durationMs: 120 },
    { frequency: 220, durationMs: 120 },
  ], { volume: 0.15, type: 'sine' });
}

/**
 * Play resume sound. Gentle ascending tone.
 */
export function playResumeSound(theme: SoundTheme): void {
  if (theme === 'silent') return;
  playNoteSequence([
    { frequency: 220, durationMs: 120 },
    { frequency: 294, durationMs: 120 },
  ], { volume: 0.15, type: 'sine' });
}

/**
 * Play tick sound — ultra-soft water drop tuned for focus.
 *
 * Sound psychology principles applied:
 * - 396Hz base: one of the Solfeggio frequencies, associated with
 *   releasing tension and grounding (used in meditation soundscapes)
 * - Pure sine wave: no harmonics, no harshness, minimal cognitive load
 * - Sub-threshold volume (1.5%): perceived as ambient texture, not an event.
 *   The brain registers rhythm without conscious attention (entrainment)
 * - 300ms decay: matches natural water drop resonance in a ceramic bowl
 * - Gentle pitch bend (396→220Hz): mimics the physics of a real water
 *   drop — pitch falls as the ripple spreads. Feels organic, not digital
 * - 1-second interval: aligns with resting heart rate, promotes calm focus
 *   through auditory-cardiac coupling (research: Thaut, 2005)
 */
export function playTick(volume = 0.015): void {
  if (!state.context || !state.masterGain) return;

  const ctx = state.context;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(396, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

  // Soft attack, long natural decay — like a drop rippling outward
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.008); // 8ms soft attack
  gain.gain.setTargetAtTime(0, now + 0.04, 0.12); // Long exponential tail

  osc.connect(gain);
  gain.connect(state.masterGain);
  osc.start(now);
  osc.stop(now + 0.5);
}

/**
 * Play last-30s tick — same drop, gently more present.
 * Still relaxing, just enough to notice the shift in urgency.
 */
export function playLast30sTick(): void {
  playTick(0.03);
}

/**
 * Start ambient sound. PRD Section 5.7.
 * Fades in over 3 seconds. Focus-only (stops during breaks).
 */
export function startAmbientSound(type: string, volume: number): void {
  if (!state.context || !state.masterGain || type === 'none') return;

  stopAmbientSound();

  // Generate ambient noise using oscillators
  state.ambientGain = state.context.createGain();
  state.ambientGain.gain.value = 0;
  state.ambientGain.connect(state.masterGain);

  // Create noise-like sound using detuned oscillators
  const oscCount = type === 'white_noise' || type === 'brown_noise' ? 8 : 4;
  for (let i = 0; i < oscCount; i++) {
    const osc = state.context.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 100 + Math.random() * 400;
    const oscGain = state.context.createGain();
    oscGain.gain.value = 0.1;
    osc.connect(oscGain);
    oscGain.connect(state.ambientGain);
    osc.start();
  }

  // Fade in over 3 seconds (PRD 5.7)
  const targetVolume = volume / 100;
  state.ambientGain.gain.setTargetAtTime(targetVolume, state.context.currentTime, 1.0);
}

/**
 * Stop ambient sound. PRD: 3-second fade out.
 */
export function stopAmbientSound(): void {
  if (state.ambientGain && state.context) {
    state.ambientGain.gain.setTargetAtTime(0, state.context.currentTime, 1.0);
    setTimeout(() => {
      state.ambientSource?.stop();
      state.ambientSource = null;
    }, 3000);
  }
}

/**
 * Trigger haptic feedback (mobile only). PRD Section 5.7.
 */
export function triggerHaptic(durationMs: number): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(durationMs);
  }
}

/**
 * Clean up audio context.
 */
export function destroyAudioEngine(): void {
  stopAmbientSound();
  state.context?.close();
  state.context = null;
  state.masterGain = null;
  state.initialized = false;
}
