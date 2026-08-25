import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#1F4D3D",
          50: "#EAF2EE",
          100: "#D4E5DC",
          200: "#A9CBB9",
          300: "#7EB196",
          400: "#539773",
          500: "#2E7D57",
          600: "#256447",
          700: "#1F4D3D",
          800: "#163629",
          900: "#0D1F17",
        },
        sage: {
          DEFAULT: "#4E7A64",
          light: "#7EA98E",
        },
        gold: {
          DEFAULT: "#C8A24A",
          light: "#D9C79E",
          dark: "#A9822F",
        },
        beige: {
          DEFAULT: "#F7F3EA",
          light: "#FBF9F4",
        },
      },
      fontFamily: {
        tajawal: ["var(--font-tajawal)", "Tajawal", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(31, 77, 61, 0.18)",
        card: "0 4px 20px -6px rgba(31, 77, 61, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
