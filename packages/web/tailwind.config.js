/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca',
          800: '#3730a3', 900: '#312e81', 950: '#1e1b4b',
        },
        'app-bg': 'var(--app-bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        row: '0.625rem',
        widget: '0.75rem',
        '3xl': '1rem',
        '4xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.04), 0 6px 24px rgba(16,24,40,0.05)',
        card: '0 1px 2px rgba(16,24,40,0.05), 0 8px 28px rgba(16,24,40,0.06)',
        float: '0 12px 40px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)',
        glow: '0 0 24px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.35)',
        glass: '0 8px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
