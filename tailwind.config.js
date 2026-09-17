/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfline-style deep charcoal palette linked to CSS variables
        brand: {
          deep: 'var(--bg-deep)',
          card: 'var(--bg-card)',
          surface: 'var(--bg-surface)',
          rail: 'var(--bg-rail)',
          border: 'var(--border-subtle)',
        },
        // Teal/cyan accent system
        accent: {
          DEFAULT: 'var(--accent)',
          light: '#5EEAD4',
          dim: 'var(--accent-dim)',
          glow: 'var(--accent-glow)',
          muted: 'var(--border-accent)',
        },
      },
      fontFamily: {
        display: ['Outfit', 'Heebo', 'Inter', 'sans-serif'],
        body: ['Inter', 'Heebo', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        hebrew: ['Heebo', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 4s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-teal': 'pulseTeal 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUpFade: {
          from: { opacity: 0, transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        pulseTeal: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(45,212,191,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(45,212,191,0)' },
        },
      },
      backdropBlur: {
        '3xl': '64px',
      },
    },
  },
  plugins: [],
}
