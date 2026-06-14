/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0A0E14',
          card: '#131820',
          elevated: '#1A2030',
          border: '#2A3344',
        },
        accent: {
          mint: '#2DD4A0',
          slate: '#6C8EF5',
        },
        text: {
          primary: '#F0F4F8',
          secondary: '#8B9BB4',
          muted: '#5C6B82',
        },
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        badge: '6px',
      },
      spacing: {
        shell: '16px',
        card: '20px',
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Roboto',
          'sans-serif',
        ],
      },
      borderWidth: {
        DEFAULT: '1px',
      },
      boxShadow: {
        card: 'none',
      },
    },
  },
  plugins: [],
}
