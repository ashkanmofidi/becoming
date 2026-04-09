/**
 * Audio engine — uses REAL sound files, not oscillators.
 *
 * All sounds sourced from CC0/royalty-free libraries:
 * - Notification chimes: github.com/akx/Notifications (CC0/CC-BY)
 * - Rain ambient: opengameart.org (CC0)
 * - Forest ambient: opengameart.org by TinyWorlds (CC0)
 * - Ocean waves: opengameart.org by jasinski (CC0)
 * - White/brown noise: generated via ffmpeg (no copyright)
 *
 * Architecture: single AudioContext + masterGain node.
 * Mute sets masterGain = 0. All sounds route through it.
 */

type SoundTheme = 'warm' | 'minimal' | 'nature' | 'silent';

interface EngineState {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  bufferCache: Map<string, AudioBuffer>;
  ambientSource: AudioBufferSourceNode | null;
  ambientGain: GainNode | null;
  initialized: boolean;
  muted: boolean;
  volume: number;
  theme: SoundTheme;
}

const state: EngineState = {
  ctx: null,
  masterGain: null,
  bufferCache: new Map(),
  ambientSource: null,
  ambientGain: null,
  initialized: false,
  muted: false,
  volume: 0.6,
  theme: 'warm',
};

// Sound file paths
const SOUNDS = {
  // Tick variants
  'tick-soft': '/sounds/tick-soft.ogg',
  'tick-classic': '/sounds/tick-classic.ogg',
  'tick-sharp': '/sounds/tick-sharp.ogg',
  // Chimes
  'chime-start': '/sounds/chime-start.ogg',
  'chime-completion': '/sounds/chime-completion.ogg',
  'chime-break': '/sounds/chime-break.ogg',
  'chime-pause': '/sounds/chime-pause.ogg',
  'chime-resume': '/sounds/chime-resume.ogg',
  'chime-achievement': '/sounds/chime-achievement.ogg',
  // Ambient
  'ambient-rain': '/sounds/ambient-rain.ogg',
  'ambient-forest': '/sounds/ambient-forest.ogg',
  'ambient-ocean': '/sounds/ambient-ocean.ogg',
  'ambient-whitenoise': '/sounds/ambient-whitenoise.ogg',
  'ambient-brownnoise': '/sounds/ambient-brownnoise.ogg',
} as const;

type SoundKey = keyof typeof SOUNDS;

function shouldPlay(): boolean {
  return state.initialized && !state.muted && state.theme !== 'silent' &&
    state.ctx !== null && state.masterGain !== null;
}

// ─── Lifecycle ───────────────────────────────────────────────

export function initAudioEngine(masterVolume: number): void {
  if (state.initialized) return;
  state.ctx = new AudioContext();
  state.masterGain = state.ctx.createGain();
  state.volume = masterVolume / 100;
  state.masterGain.gain.value = state.muted ? 0 : state.volume;
  state.masterGain.connect(state.ctx.destination);
  state.initialized = true;
}

export async function resumeContext(): Promise<void> {
  if (state.ctx?.state === 'suspended') await state.ctx.resume();
}

export function destroyAudioEngine(): void {
  stopAmbientSound();
  state.ctx?.close();
  state.ctx = null;
  state.masterGain = null;
  state.bufferCache.clear();
  state.initialized = false;
}

// ─── Buffer Loading ──────────────────────────────────────────

async function loadBuffer(key: SoundKey): Promise<AudioBuffer | null> {
  if (state.bufferCache.has(key)) return state.bufferCache.get(key)!;
  if (!state.ctx) return null;

  try {
    const response = await fetch(SOUNDS[key]);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await state.ctx.decodeAudioData(arrayBuffer);
    state.bufferCache.set(key, audioBuffer);
    return audioBuffer;
  } catch {
    return null;
  }
}

/** Play a loaded buffer once through the master gain. */
function playBuffer(buffer: AudioBuffer, volume = 1): void {
  if (!state.ctx || !state.masterGain) return;
  const source = state.ctx.createBufferSource();
  const gain = state.ctx.createGain();
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(state.masterGain);
  source.start();
}

// ─── Master Controls ─────────────────────────────────────────

export function setMuted(muted: boolean): void {
  state.muted = muted;
  if (state.masterGain && state.ctx) {
    state.masterGain.gain.setTargetAtTime(muted ? 0 : state.volume, state.ctx.currentTime, 0.02);
  }
}

export function setMasterVolume(volume: number): void {
  state.volume = volume / 100;
  if (state.masterGain && state.ctx && !state.muted) {
    state.masterGain.gain.setTargetAtTime(state.volume, state.ctx.currentTime, 0.05);
  }
}

export function setTheme(theme: SoundTheme): void {
  state.theme = theme;
}

// ─── Event Sounds ────────────────────────────────────────────

export async function playActivationChime(): Promise<void> {
  if (!shouldPlay()) return;
  const buffer = await loadBuffer('chime-start');
  if (buffer) playBuffer(buffer, 0.6);
}

export async function playCompletionBell(volume = 0.7): Promise<void> {
  if (!shouldPlay()) return;
  const buffer = await loadBuffer('chime-completion');
  if (buffer) playBuffer(buffer, volume);
}

export async function playBreakComplete(): Promise<void> {
  if (!shouldPlay()) return;
  const buffer = await loadBuffer('chime-break');
  if (buffer) playBuffer(buffer, 0.6);
}

export async function playPauseSound(): Promise<void> {
  if (!shouldPlay()) return;
  const buffer = await loadBuffer('chime-pause');
  if (buffer) playBuffer(buffer, 0.4);
}

export async function playResumeSound(): Promise<void> {
  if (!shouldPlay()) return;
  const buffer = await loadBuffer('chime-resume');
  if (buffer) playBuffer(buffer, 0.4);
}

// ─── Ambient Sound ───────────────────────────────────────────

const AMBIENT_MAP: Record<string, SoundKey | null> = {
  'none': null,
  'white_noise': 'ambient-whitenoise',
  'brown_noise': 'ambient-brownnoise',
  'rain': 'ambient-rain',
  'coffee_shop': 'ambient-brownnoise', // Reuse brown noise as cafe ambience
  'lofi_beats': 'ambient-brownnoise',
  'forest': 'ambient-forest',
};

export async function startAmbientSound(type: string, volume: number): Promise<void> {
  if (!state.ctx || !state.masterGain) return;
  stopAmbientSound();

  const key = AMBIENT_MAP[type];
  if (!key) return;

  const buffer = await loadBuffer(key);
  if (!buffer) return;

  state.ambientGain = state.ctx.createGain();
  state.ambientGain.gain.value = 0;
  state.ambientGain.connect(state.masterGain);

  state.ambientSource = state.ctx.createBufferSource();
  state.ambientSource.buffer = buffer;
  state.ambientSource.loop = true;
  state.ambientSource.connect(state.ambientGain);
  state.ambientSource.start();

  // Fade in over 2 seconds
  state.ambientGain.gain.setTargetAtTime(volume / 100, state.ctx.currentTime, 0.7);
}

export function stopAmbientSound(): void {
  if (state.ambientGain && state.ctx) {
    state.ambientGain.gain.setTargetAtTime(0, state.ctx.currentTime, 0.3);
  }
  setTimeout(() => {
    try { state.ambientSource?.stop(); } catch { /* already stopped */ }
    state.ambientSource = null;
  }, 1500);
}

// ─── Haptic ──────────────────────────────────────────────────

export function triggerHaptic(durationMs: number): void {
  if ('vibrate' in navigator) navigator.vibrate(durationMs);
}
