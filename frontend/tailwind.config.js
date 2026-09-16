/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#14181F",
        surface: "#1C232E",
        surfaceAlt: "#232C39",
        border: "#2E3746",
        ink: "#E7EAF0",
        inkMuted: "#8B94A6",
        accent: "#4FA3A8",
        accentMuted: "#3A7A7E",
        status: {
          aberto: "#D9A441",
          andamento: "#4F84A8",
          concluido: "#4CA872",
          cancelado: "#C25B5B",
        },
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
