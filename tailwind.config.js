/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#050810',
          card: 'rgba(12, 18, 32, 0.72)',
          elevated: 'rgba(20, 28, 48, 0.85)',
          border: 'rgba(120, 160, 220, 0.12)',
          glow: 'rgba(0, 229, 168, 0.08)',
        },
        accent: {
          mint: '#00E5A8',
          cyan: '#22D3EE',
          violet: '#A78BFA',
          slate: '#6C8EF5',
          amber: '#FBBF24',
        },
        text: {
          primary: '#F4F7FB',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      borderRadius: {
        card: '16px',
        button: '10px',
        badge: '9999px',
        panel: '14px',
      },
      spacing: {
        shell: '20px',
        card: '24px',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Syne', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(0, 229, 168, 0.25)',
        'glow-sm': '0 0 12px rgba(0, 229, 168, 0.18)',
        panel: '0 4px 24px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'panel-active': '0 0 0 1px rgba(0, 229, 168, 0.35), 0 8px 32px rgba(0, 229, 168, 0.12)',
      },
      backgroundImage: {
        'mesh-gradient':
          'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0, 229, 168, 0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(108, 142, 245, 0.1), transparent 45%), radial-gradient(ellipse 50% 30% at 50% 100%, rgba(167, 139, 250, 0.06), transparent 50%)',
        'grid-pattern':
          'linear-gradient(rgba(120, 160, 220, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 160, 220, 0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out forwards',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.92)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
      },
    },
  },
  plugins: [],
}
