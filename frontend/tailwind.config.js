/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          500: "#22c55e", // Warna hijau aksen (bisa kamu ganti sesuai tema Stich)
          600: "#16a34a",
        },
      },
      boxShadow: {
        floating: "0 10px 40px -10px rgba(0,0,0,0.08)", // Shadow super halus untuk floating card
      },
    },
  },
  plugins: [],
};
