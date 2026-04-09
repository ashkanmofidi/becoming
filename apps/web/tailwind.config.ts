import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        amber: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          lighter: '#FBBF24',
          lightest: '#FCD34D',
          dark: '#B45309',
        },
        teal: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
        },
        bg: {
          primary: '#0A0A0A',
          card: '#111111',
        },
        surface: {
          900: '#1A1A1A',
          700: '#3A3A3A',
          500: '#6B7280',
          300: '#9CA3AF',
          100: '#EDECE8',
        },
      },
      fontFamily: {
        serif: ['DM Serif Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        timer: ['4.5rem', { lineHeight: '1' }],
      },
      animation: {
        'breathing-glow': 'breathingGlow 4s ease-in-out infinite',
        'breathing-glow-break': 'breathingGlow 6s ease-in-out infinite',
        'fade-cycle': 'fadeCycle 8s ease-in-out infinite',
        'pulse-play': 'pulsePlay 5s ease-in-out infinite',
      },
      keyframes: {
        breathingGlow: {
          '0%, 100%': { opacity: '0.8', boxShadow: '0 0 0px currentColor' },
          '50%': { opacity: '1', boxShadow: '0 0 8px currentColor' },
        },
        fadeCycle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        pulsePlay: {
          '0%, 80%, 100%': { transform: 'scale(1)' },
          '90%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
