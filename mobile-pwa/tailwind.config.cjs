/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
      },
    },
  },
  plugins: [],
}
