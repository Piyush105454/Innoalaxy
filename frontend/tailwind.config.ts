import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",
        panel: "#101827",
        line: "#D7DCE5",
        primary: "#185FA5",
        success: "#3B6D11",
        warning: "#854F0B"
      },
      fontFamily: {
        sans: ["Inter", "DM Sans", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;

