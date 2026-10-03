/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./**/*.{ts,tsx}",
    "!./node_modules/**",
  ],
  theme: { extend: {} },
  plugins: [],
};
