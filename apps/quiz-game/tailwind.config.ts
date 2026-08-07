import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-tajawal)', 'Tajawal', 'sans-serif'],
        display: ['var(--font-baloo)', 'Baloo Bhaijaan 2', 'sans-serif'],
      },
      colors: {
        arena: {
          bg: '#0b0a1f',
          bg2: '#151233',
          surface: '#1c1840',
          surface2: '#241f52',
          border: '#332c6e',
          primary: '#7c5cff',
          primary2: '#a78bfa',
          accent: '#ffb020',
          accent2: '#ffd166',
          success: '#22c55e',
          danger: '#f43f5e',
          info: '#38bdf8',
          teamA: '#3b82f6',
          teamB: '#f43f5e',
          gold: '#ffd700',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        },
      },
      backgroundImage: {
        'arena-radial':
          'radial-gradient(circle at 50% -20%, #2c2470 0%, #0b0a1f 60%)',
        'primary-gradient': 'linear-gradient(135deg, #7c5cff 0%, #ff5ca8 100%)',
        'accent-gradient': 'linear-gradient(135deg, #ffb020 0%, #ff5c5c 100%)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(124,92,255,0.55)',
        'glow-accent': '0 0 40px -8px rgba(255,176,32,0.55)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '70%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'shake-x': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        'progress-shrink': {
          from: { width: '100%' },
          to: { width: '0%' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-40px)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        'shake-x': 'shake-x 0.5s ease-in-out',
        'progress-shrink': 'progress-shrink linear forwards',
        'float-up': 'float-up 1s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
