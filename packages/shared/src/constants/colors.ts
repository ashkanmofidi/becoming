/** All color values. PRD various sections. */

export const COLORS = {
  // Primary palette
  AMBER: '#D97706',
  AMBER_LIGHT: '#F59E0B',
  AMBER_LIGHTER: '#FBBF24',
  AMBER_LIGHTEST: '#FCD34D',
  AMBER_DARK: '#B45309',

  // Break palette
  TEAL: '#0D9488',
  TEAL_DARK: '#0F766E',

  // Long break
  PURPLE: '#7C3AED',

  // Semantic
  SUCCESS: '#16A34A',
  ERROR: '#DC2626',
  WARNING: '#F59E0B',

  // Neutrals
  BLACK: '#08080A',
  BG_PRIMARY: '#0A0A0A',
  BG_CARD: '#111111',
  GRAY_900: '#1A1A1A',
  GRAY_700: '#3A3A3A',
  GRAY_500: '#6B7280',
  GRAY_300: '#9CA3AF',
  GRAY_100: '#EDECE8',
  WHITE: '#FFFFFF',

  // Timer ring color stops (PRD 5.2.2)
  RING_100_PERCENT: '#D97706',
  RING_50_PERCENT: '#F59E0B',
  RING_25_PERCENT: '#FBBF24',

  // Paused ring
  PAUSED_RING: '#B45309',

  // Role badges (PRD 3.2)
  BADGE_ADMIN: '#D97706',
  BADGE_SUPER_ADMIN: '#DC2626',

  // Accent presets for settings
  ACCENT_PRESETS: [
    '#D97706', '#DC2626', '#2563EB', '#7C3AED',
    '#EC4899', '#16A34A', '#0D9488', '#F97316',
  ],
} as const;
