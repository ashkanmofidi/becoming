/** Sound configuration. PRD Section 5.7 */

export const SOUND_FREQUENCIES = {
  ACTIVATION_CHIME: { frequency: 528, duration: 200 },
  PAUSE: { notes: ['D4', 'A3'], duration: 300 },
  RESUME: { notes: ['A3', 'D4'], duration: 300 },
  COMPLETION_BELL: { notes: ['C5', 'E5'], duration: 600, reverb: 400, volume: 0.6 },
  COMPLETION_OVERTIME: { notes: ['C5', 'E5'], duration: 600, reverb: 400, volume: 0.4 },
  BREAK_COMPLETE_MARIMBA: { note: 'G4', duration: 400 },
  MINUTE_TICK: { duration: 50, volume: 0.2 },
  LAST_30S_TICK: { frequency: 1000, duration: 50 },
} as const;

export const SOUND_THEMES = {
  warm: { label: 'Warm', description: 'Bells and marimba' },
  minimal: { label: 'Minimal', description: 'Sine waves' },
  nature: { label: 'Nature', description: 'Rain and bird sounds' },
  silent: { label: 'Silent', description: 'Visual only' },
} as const;

export const AMBIENT_SOUNDS = {
  none: { label: 'None' },
  white_noise: { label: 'White Noise' },
  brown_noise: { label: 'Brown Noise' },
  rain: { label: 'Rain' },
  coffee_shop: { label: 'Coffee Shop' },
  lofi_beats: { label: 'Lo-Fi Beats' },
  forest: { label: 'Forest' },
} as const;

/** Animation timing constants. PRD Section 5.2 */
export const ANIMATION_TIMING = {
  BREATHING_GLOW_CYCLE_MS: 4000,
  BREATHING_BREAK_CYCLE_MS: 6000,
  READY_TEXT_FADE_CYCLE_MS: 8000,
  PLAY_PULSE_INTERVAL_MS: 5000,
  FLIP_CLOCK_DURATION_MS: 120,
  LABEL_CROSSFADE_MS: 300,
  PAUSED_PULSE_CYCLE_MS: 3000,
  MODE_TRANSITION_MS: 150,
  THEME_CROSSFADE_MS: 300,
  AUTO_START_COUNTDOWN_SECONDS: 5,
  COMPLETION_PHASE1_MS: 500,
  COMPLETION_PHASE2_MS: 1500,
  COMPLETION_PHASE3_MS: 3000,
  PARTICLE_COUNT_MIN: 12,
  PARTICLE_COUNT_MAX: 16,
  PARTICLE_TRAVEL_MIN_PX: 40,
  PARTICLE_TRAVEL_MAX_PX: 80,
  PARTICLE_FADE_MS: 800,
} as const;
