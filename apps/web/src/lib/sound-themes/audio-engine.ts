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
 * Play activation chime. PRD Section 5.2.2: 528Hz, 200ms, Warm theme.
 */
export function playActivationChime(theme: SoundTheme): void {
  if (theme === 'silent') return;
  const freq = theme === 'minimal' ? 440 : 528;
  playTone(freq, 200, { volume: 0.5, type: theme === 'minimal' ? 'sine' : 'triangle' });
}

/**
 * Play completion bell. PRD Section 5.2.4: C5+E5, 600ms, reverb 400ms.
 */
export function playCompletionBell(theme: SoundTheme, volume = 0.6): void {
  if (theme === 'silent') return;

  if (!state.context || !state.masterGain) return;

  const now = state.context.currentTime;

  // C5 (523Hz)
  const osc1 = state.context.createOscillator();
  const gain1 = state.context.createGain();
  osc1.frequency.value = 523;
  osc1.type = theme === 'minimal' ? 'sine' : 'triangle';
  gain1.gain.value = volume;
  gain1.gain.setTargetAtTime(0, now + 0.6, 0.15);
  osc1.connect(gain1);
  gain1.connect(state.masterGain);
  osc1.start(now);
  osc1.stop(now + 1.0);

  // E5 (659Hz)
  const osc2 = state.context.createOscillator();
  const gain2 = state.context.createGain();
  osc2.frequency.value = 659;
  osc2.type = theme === 'minimal' ? 'sine' : 'triangle';
  gain2.gain.value = volume * 0.8;
  gain2.gain.setTargetAtTime(0, now + 0.6, 0.15);
  osc2.connect(gain2);
  gain2.connect(state.masterGain);
  osc2.start(now);
  osc2.stop(now + 1.0);
}

/**
 * Play break complete marimba. PRD Section 5.2.6: G4, 400ms.
 */
export function playBreakComplete(theme: SoundTheme): void {
  if (theme === 'silent') return;
  playTone(392, 400, { volume: 0.5, type: 'triangle' });
}

/**
 * Play pause sound. PRD Section 5.2.5: D4→A3, 300ms.
 */
export function playPauseSound(theme: SoundTheme): void {
  if (theme === 'silent') return;
  playNoteSequence([
    { frequency: 294, durationMs: 150 }, // D4
    { frequency: 220, durationMs: 150 }, // A3
  ], { volume: 0.4 });
}

/**
 * Play resume sound. PRD Section 5.2.5: A3→D4, 300ms.
 */
export function playResumeSound(theme: SoundTheme): void {
  if (theme === 'silent') return;
  playNoteSequence([
    { frequency: 220, durationMs: 150 }, // A3
    { frequency: 294, durationMs: 150 }, // D4
  ], { volume: 0.4 });
}

/**
 * Play tick sound. PRD Section 5.2.2: 50ms click, 20% volume.
 */
export function playTick(volume = 0.2): void {
  playTone(800, 50, { volume, type: 'square' });
}

/**
 * Play last-30s tick. PRD Section 5.2.3: 1Hz.
 */
export function playLast30sTick(): void {
  playTone(1000, 50, { volume: 0.3, type: 'square' });
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
