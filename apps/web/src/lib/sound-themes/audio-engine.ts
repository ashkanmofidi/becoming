/**
 * Audio engine v3 — real sound files, proper looping, buffer cache.
 *
 * All sounds are OGG files in /public/sounds/, loaded via fetch + decodeAudioData.
 * Buffers are cached after first load.
 *
 * Buffer cache lifecycle: AudioBuffers are stored in S.buffers (Map) for the
 * lifetime of the engine. They are only cleared when destroyAudioEngine() is
 * called. This is intentional — decoded audio buffers are expensive to create
 * and the total set is small (< 10 files, ~2-5 MB). Individual source nodes
 * are disconnected and released in stopAmbientSound() after fade-out.
 *
 * Ambient sounds use AudioBufferSourceNode.loop = true for gapless looping.
 * Event sounds (chimes) play once and auto-dispose.
 */

type SoundTheme = 'warm' | 'minimal' | 'nature' | 'silent';

interface State {
  ctx: AudioContext | null;
  masterGain: GainNode | null;
  buffers: Map<string, AudioBuffer>;
  ambientSource: AudioBufferSourceNode | null;
  ambientGain: GainNode | null;
  ambientType: string;
  muted: boolean;
  volume: number;
  theme: SoundTheme;
  initialized: boolean;
}

const S: State = {
  ctx: null,
  masterGain: null,
  buffers: new Map(),
  ambientSource: null,
  ambientGain: null,
  ambientType: 'none',
  muted: false,
  volume: 0.6,
  theme: 'warm',
  initialized: false,
};

const AMBIENT_FILES: Record<string, string> = {
  rain: '/sounds/ambient-rain.ogg',
  forest: '/sounds/ambient-forest.ogg',
  white_noise: '/sounds/ambient-whitenoise.ogg',
  brown_noise: '/sounds/ambient-brownnoise.ogg',
  coffee_shop: '/sounds/ambient-brownnoise.ogg',
  lofi_beats: '/sounds/ambient-brownnoise.ogg',
};

function shouldPlay(): boolean {
  return S.initialized && !S.muted && S.theme !== 'silent';
}

// ─── Lifecycle ───────────────────────────────────────────────

export function initAudioEngine(masterVolume: number): void {
  if (S.initialized) return;
  S.ctx = new AudioContext();
  S.masterGain = S.ctx.createGain();
  S.volume = masterVolume / 100;
  S.masterGain.gain.value = S.muted ? 0 : S.volume;
  S.masterGain.connect(S.ctx.destination);
  S.initialized = true;
}

export async function resumeContext(): Promise<void> {
  if (S.ctx?.state === 'suspended') await S.ctx.resume();
}

export function destroyAudioEngine(): void {
  stopAmbientSound();
  S.ctx?.close();
  S.ctx = null;
  S.masterGain = null;
  S.buffers.clear();
  S.initialized = false;
}

// ─── Buffer Loading ──────────────────────────────────────────

async function getBuffer(path: string): Promise<AudioBuffer | null> {
  if (S.buffers.has(path)) return S.buffers.get(path)!;
  if (!S.ctx) return null;
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const buf = await S.ctx.decodeAudioData(await res.arrayBuffer());
    S.buffers.set(path, buf);
    return buf;
  } catch { return null; }
}

function playOnce(buffer: AudioBuffer, vol = 1): void {
  if (!S.ctx || !S.masterGain) return;
  const src = S.ctx.createBufferSource();
  const g = S.ctx.createGain();
  g.gain.value = vol;
  src.buffer = buffer;
  src.connect(g);
  g.connect(S.masterGain);
  src.start();
}

// ─── Master Controls ─────────────────────────────────────────

export function setMuted(muted: boolean): void {
  S.muted = muted;
  if (S.masterGain && S.ctx) {
    S.masterGain.gain.setTargetAtTime(muted ? 0 : S.volume, S.ctx.currentTime, 0.02);
  }
}

export function setMasterVolume(volume: number): void {
  S.volume = volume / 100;
  if (S.masterGain && S.ctx && !S.muted) {
    S.masterGain.gain.setTargetAtTime(S.volume, S.ctx.currentTime, 0.05);
  }
}

export function setTheme(theme: SoundTheme): void {
  S.theme = theme;
}

// ─── Event Sounds ────────────────────────────────────────────

export async function playActivationChime(): Promise<void> {
  if (!shouldPlay()) return;
  const buf = await getBuffer('/sounds/chime-start.ogg');
  if (buf) playOnce(buf, 0.6);
}

export async function playCompletionBell(vol = 0.7): Promise<void> {
  if (!shouldPlay()) return;
  const buf = await getBuffer('/sounds/chime-completion.ogg');
  if (buf) playOnce(buf, vol);
}

export async function playBreakComplete(): Promise<void> {
  if (!shouldPlay()) return;
  const buf = await getBuffer('/sounds/chime-break.ogg');
  if (buf) playOnce(buf, 0.6);
}

export async function playPauseSound(): Promise<void> {
  if (!shouldPlay()) return;
  const buf = await getBuffer('/sounds/chime-pause.ogg');
  if (buf) playOnce(buf, 0.4);
}

export async function playResumeSound(): Promise<void> {
  if (!shouldPlay()) return;
  const buf = await getBuffer('/sounds/chime-resume.ogg');
  if (buf) playOnce(buf, 0.4);
}

// ─── Ambient Sound (looping) ─────────────────────────────────

export async function startAmbientSound(type: string, volume: number): Promise<void> {
  if (!S.ctx || !S.masterGain || type === 'none') return;

  // If same type is already playing, just update volume
  if (S.ambientSource && S.ambientType === type && S.ambientGain) {
    S.ambientGain.gain.setTargetAtTime(volume / 100, S.ctx.currentTime, 0.3);
    return;
  }

  // Stop current ambient (with quick fade)
  stopAmbientSound();

  const filePath = AMBIENT_FILES[type];
  if (!filePath) return;

  const buf = await getBuffer(filePath);
  if (!buf || !S.ctx || !S.masterGain) return;

  // Create looping source
  S.ambientGain = S.ctx.createGain();
  S.ambientGain.gain.value = 0; // Start silent
  S.ambientGain.connect(S.masterGain);

  S.ambientSource = S.ctx.createBufferSource();
  S.ambientSource.buffer = buf;
  S.ambientSource.loop = true; // CRITICAL: seamless looping
  S.ambientSource.connect(S.ambientGain);
  S.ambientSource.start();
  S.ambientType = type;

  // Fade in over 1.5 seconds
  S.ambientGain.gain.setTargetAtTime(volume / 100, S.ctx.currentTime, 0.5);
}

export function stopAmbientSound(): void {
  if (S.ambientGain && S.ctx) {
    // Fade out over 500ms
    S.ambientGain.gain.setTargetAtTime(0, S.ctx.currentTime, 0.15);
  }
  const src = S.ambientSource;
  const gain = S.ambientGain;
  setTimeout(() => {
    try { src?.stop(); } catch { /* already stopped */ }
    // P2-8: Disconnect and release nodes to free audio buffers.
    // Without this, stopped source nodes remain connected to the audio graph
    // and hold references to their underlying AudioBuffer, preventing GC.
    try { src?.disconnect(); } catch { /* already disconnected */ }
    try { gain?.disconnect(); } catch { /* already disconnected */ }
  }, 800);
  S.ambientSource = null;
  S.ambientGain = null;
  S.ambientType = 'none';
}

export function setAmbientVolume(volume: number): void {
  if (S.ambientGain && S.ctx) {
    S.ambientGain.gain.setTargetAtTime(volume / 100, S.ctx.currentTime, 0.05);
  }
}

// ─── Haptic ──────────────────────────────────────────────────

export function triggerHaptic(durationMs: number): void {
  if ('vibrate' in navigator) navigator.vibrate(durationMs);
}
