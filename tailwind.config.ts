import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/config/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-jakarta)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        neofaro: {
          bg: {
            light: '#F8FAFC',
            dark: '#090D16',
          },
          surface: {
            light: '#FFFFFF',
            dark: '#111827',
          },
          elevated: {
            light: '#F1F5F9',
            dark: '#1E293B',
          },
          academico: {
            primary: '#4F46E5', // Indigo vibrante UNGS
            secondary: '#06B6D4',
            soft: '#EEF2FF',
          },
          scout: {
            primary: '#10B981', // Esmeralda / Naturaleza vibrante Scout
            secondary: '#F59E0B',
            soft: '#ECFDF5',
          },
          trabajo: {
            primary: '#0284C7', // Azul corporativo sobrio
            secondary: '#64748B',
            soft: '#F0F9FF',
          },
        },
      },
      boxShadow: {
        'neofaro-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'neofaro-md': '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'neofaro-glow-indigo': '0 0 20px -4px rgba(79, 70, 229, 0.35)',
        'neofaro-glow-emerald': '0 0 20px -4px rgba(16, 185, 129, 0.35)',
        'neofaro-glow-sky': '0 0 20px -4px rgba(2, 132, 199, 0.35)',
      },
      keyframes: {
        'slide-fade': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-fade': 'slide-fade 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;

