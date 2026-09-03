/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepVoid: '#030712',
        oceanicDark: '#0B132B',
        marineCard: '#09162E',
        turquoiseAccent: '#0EA5E9',
        cyanBiolum: '#38BDF8',
        sonarGold: {
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FDE047',
          600: '#D97706',
          700: '#B45309',
        }
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px -5px rgba(56, 189, 248, 0.4)',
        'cyan-sm': '0 0 12px rgba(56, 189, 248, 0.25)',
        'premium-lift': '0 20px 40px -15px rgba(14, 165, 233, 0.18)',
      }
    },
  },
  plugins: [],
}
