/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f8f9fc',
          100: '#e8ecf4',
          200: '#d0d6e6',
          300: '#a8b3cf',
          400: '#7a8ab0',
          500: '#5a6a92',
          600: '#445279',
          700: '#374262',
          800: '#2a334d',
          900: '#1e2438',
          950: '#121620',
        },
        accent: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#53b0ff',
          500: '#2b8cff',
          600: '#146cff',
          700: '#0d56eb',
          800: '#1145be',
          900: '#143e95',
          950: '#11275a',
        },
        cyber: {
          green: '#00ff88',
          blue: '#00b4ff',
          purple: '#a855f7',
          orange: '#ff6b35',
          red: '#ff3355',
          yellow: '#ffd700',
        },
      },
      fontFamily: {
        mono: ['Consolas', '"Courier New"', 'monospace'],
        sans: ['system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-in-left': 'slideInLeft 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'terminal-blink': 'terminalBlink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 180, 255, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 180, 255, 0.6)' },
        },
        terminalBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
