/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#015df0", // Nexota Blue — main CTA color
        primaryHover: "#0148c0", // Darker blue on hover
        accent: "#FEEE00", // Yellow accent
        accentHover: "#f5e200",
        nexotaBg: "#F7F8FC", // Light page background
        nexotaCard: "#FFFFFF",
        nexotaDark: "#0D1B3E", // Deep navy for text/logo
        nexotaMid: "#4B6090", // Medium blue-gray
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
