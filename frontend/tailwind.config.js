/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        // Adds a custom 16-column grid system tracking half-hour increments
        '16': 'repeat(16, minmax(0, 1fr))',
      }
    },
  },
  plugins: [],
}