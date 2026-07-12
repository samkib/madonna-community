/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-ink-soft) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-soft': 'rgb(var(--color-primary-soft) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--color-accent-soft) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        pending: 'rgb(var(--color-pending) / <alpha-value>)',
        progress: 'rgb(var(--color-progress) / <alpha-value>)',
        solved: 'rgb(var(--color-solved) / <alpha-value>)',
        urgent: 'rgb(var(--color-urgent) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Public Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '1.1rem',
        plaque: '0.65rem',
      },
      boxShadow: {
        plaque: '0 1px 0 rgba(255,255,255,0.4) inset, 0 1px 2px rgba(0,0,0,0.15), 0 8px 20px -12px rgba(0,0,0,0.25)',
        card: '0 1px 2px rgba(20,20,15,0.04), 0 10px 30px -14px rgba(20,20,15,0.18)',
        'card-dark': '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -14px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        engraved: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.05))',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
