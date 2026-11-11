/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#F4F6F9",
        surface: "#FFFFFF",
        surfaceAlt: "#F1F5F9",
        border: "#CBD5E1",
        ink: "#0F172A",
        inkMuted: "#64748B",
        accent: "#0284C7",
        accentMuted: "#0369A1",
        cold: "#0EA5E9",
        warm: "#D97706",
        mist: "#E2E8F0",
        status: {
          aberto: "#D97706",
          andamento: "#0284C7",
          concluido: "#059669",
          cancelado: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03)",
        panel: "0 4px 16px -2px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.03)",
      },
    },
  },
  plugins: [],
};
