/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        subway: {
          yellow: '#FFC600',
          green: '#009B3A',
          dark: '#1E3A1F',
        }
      }
    },
  },
  plugins: [],
}
