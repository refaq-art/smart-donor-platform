import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Sampled directly from the platform logo's gradient bars/wordmark
        // so the UI's navy matches the mark exactly, not an approximation.
        navy: {
          50: "#eef1f7",
          100: "#dbe2ee",
          200: "#b7c5dd",
          300: "#8fa4c7",
          400: "#6483ad",
          500: "#4b6598",
          600: "#395386",
          700: "#273d6c",
          800: "#14264c",
          900: "#0b1730",
          950: "#050b1d",
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
