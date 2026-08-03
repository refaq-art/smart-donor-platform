import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf6",
          100: "#d3f1e6",
          200: "#a6e3cd",
          300: "#71cdb0",
          400: "#3fb191",
          500: "#0f766e",
          600: "#0c5f59",
          700: "#0a4d48",
          800: "#083d39",
          900: "#062f2c",
          950: "#031816",
        },
        gold: {
          50: "#fdf7ec",
          100: "#faecc9",
          200: "#f4d68e",
          300: "#edbd57",
          400: "#e3a52f",
          500: "#b8892d",
          600: "#946e23",
          700: "#71531a",
          800: "#4d3812",
          900: "#2c1f0a",
        },
        ink: "#0f2622",
        surface: "#faf8f3",
      },
      fontFamily: {
        sans: ["var(--font-app)", "Tahoma", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(10, 40, 36, 0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
