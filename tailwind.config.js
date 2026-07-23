/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/**/*.{html,js}",
    "./frontend/*.{html,js}",
    "./frontend/project.html", // Add specific file
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
