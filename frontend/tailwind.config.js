/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'osrs-gold': '#d4a843',
        'osrs-brown': '#3d3024',
        'osrs-beige': '#f5e6c8',
        'osrs-dark': '#1a1510',
        'osrs-border': '#8b7355',
        'osrs-light': '#e8dcc8',
      },
      fontFamily: {
        'runescape': ['Runescape', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
