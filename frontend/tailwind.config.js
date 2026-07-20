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
        // High-end tailored colors for rich dark/light mode aesthetics
        brand: {
          50: '#f4f7fb',
          100: '#e8eff7',
          200: '#cbddec',
          300: '#9ec0dd',
          400: '#6b9cc9',
          500: '#467cb2',
          600: '#346193',
          700: '#2b4e77',
          800: '#264363',
          900: '#233953',
          950: '#172537',
        }
      }
    },
  },
  plugins: [],
}
