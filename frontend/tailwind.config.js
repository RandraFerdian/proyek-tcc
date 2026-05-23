/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          25: "#fbfef8",
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          leaf: "#2f6f4e",
          citrus: "#d9f99d",
          cream: "#fffdf4",
        },
      },
      boxShadow: {
        floating: "0 10px 40px -10px rgba(22,101,52,0.12)",
      },
    },
  },
  plugins: [],
};
