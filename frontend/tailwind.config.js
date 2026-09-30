/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#F6F1E8",
        surface: "#FFFDF9",
        surfaceAlt: "#E9E0D2",
        border: "#D9CBB4",
        ink: "#1F2A2A",
        inkMuted: "#5F6A62",
        accent: "#2F4F48",
        accentMuted: "#486A62",
        warm: "#D58E5D",
        mist: "#C9D7CC",
        status: {
          aberto: "#C8892E",
          andamento: "#5A7D9E",
          concluido: "#3C7A5B",
          cancelado: "#B85A4C",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Iowan Old Style", "Georgia", "Times New Roman", "serif"],
      },
      boxShadow: {
        panel: "0 18px 40px rgba(31, 42, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
