import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#eef1f8",
          100: "#d7ddef",
          200: "#b0bbdf",
          300: "#8494c8",
          400: "#5769ac",
          500: "#3b4d8f",
          600: "#2c3c72",
          700: "#212d59",
          800: "#161d3e",
          900: "#0e1329",
          950: "#080b1a",
        },
        gold: {
          400: "#e2b04a",
          500: "#c99a34",
          600: "#a97e24",
        },
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans-arabic)", "Tahoma", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
