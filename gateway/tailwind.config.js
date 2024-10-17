/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "selector",
  content: ["./src/views/*.ejs"],
  theme: {
    extend: {},
  },
  plugins: [
    {
      tailwindcss: {},
      autoprefixer: {},
    },
  ],
};
