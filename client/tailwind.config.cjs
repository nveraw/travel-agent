/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Scan all source files for Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}