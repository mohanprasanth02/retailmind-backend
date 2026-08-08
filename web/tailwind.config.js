/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#000000",
          card: "rgba(18, 18, 18, 0.65)",
          border: "rgba(255, 255, 255, 0.1)",
          accent: "#ffffff",
          accentDark: "#e5e5e5",
          green: "#d4d4d4",
          red: "#525252",
          yellow: "#737373",
          textPrimary: "#f5f5f5",
          textSecondary: "#a3a3a3"
        }
      },
      fontFamily: {
        cyber: ["Rajdhani", "Inter", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 15px rgba(255, 255, 255, 0.12)",
        neonGreen: "0 0 15px rgba(255, 255, 255, 0.08)",
        neonRed: "0 0 15px rgba(255, 255, 255, 0.05)"
      }
    },
  },
  plugins: [],
}
