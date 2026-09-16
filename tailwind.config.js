/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfline-style deep charcoal palette
        brand: {
          deep: '#1c1c21',
          card: '#222228',
          surface: '#2a2a31',
          rail: '#18181c',
          border: 'rgba(255,255,255,0.06)',
        },
        // Teal/cyan accent system
        accent: {
          DEFAULT: '#2DD4BF',
          light: '#5EEAD4',
          dim: '#14B8A6',
          glow: 'rgba(45, 212, 191, 0.15)',
          muted: 'rgba(45, 212, 191, 0.08)',
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
