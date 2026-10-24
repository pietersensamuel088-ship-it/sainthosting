/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#000000',
        charcoal: {
          950: '#050505',
          900: '#0a0a0a',
          850: '#0e0e0e',
          800: '#141414',
          700: '#1e1e1e',
        },
        crimson: {
          glow: '#FF0000',
          bright: '#ff1a1a',
          DEFAULT: '#e60000',
          dark: '#990000',
          blood: '#590000',
          dim: '#260000',
        },
        silver: {
          light: '#F4F4F5',
          DEFAULT: '#D4D4D8',
          dark: '#A1A1AA',
        },
      },
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'crimson-glow': '0 0 15px rgba(255, 0, 0, 0.35)',
        'crimson-glow-strong': '0 0 25px rgba(255, 0, 0, 0.65)',
        'crimson-inner': 'inset 0 0 12px rgba(255, 0, 0, 0.25)',
      },
      animation: {
        'pulse-crimson': 'pulseCrimson 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        pulseCrimson: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(255, 0, 0, 0.8))' },
          '50%': { opacity: '0.4', filter: 'none' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
};
