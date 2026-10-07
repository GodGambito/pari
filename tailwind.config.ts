import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Paleta Corporativa Pari: Emerald #047857 & Gold #D4AF37
        emerald: {
          DEFAULT: "#047857",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857", // Color Oficial Primario
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        gold: {
          DEFAULT: "#D4AF37",
          50: "#fdfbf4",
          100: "#f9f4de",
          200: "#f3e7bd",
          300: "#edd492",
          400: "#e3bf63",
          500: "#D4AF37", // Color Oficial Oro
          600: "#be9729",
          700: "#997321",
          800: "#7f5c20",
          900: "#6a4c1f",
          950: "#3d290d",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
