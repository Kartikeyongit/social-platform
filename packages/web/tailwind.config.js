/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        surface: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8',
        },
        dark: {
          0: '#0f172a', 50: '#1e293b', 100: '#334155', 200: '#475569', 300: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xxs': '0.6875rem',
        'xs': '0.75rem',
        'sm': '0.8125rem',
        'base': '0.875rem',
        'lg': '0.9375rem',
        'xl': '1.0625rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '1.875rem',
      },
      borderRadius: {
        '2xl': '0.75rem',
        '3xl': '1rem',
        '4xl': '1.25rem',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
        'glow': '0 0 24px rgba(37,99,235,0.25)',
        'glass': '0 8px 32px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
