import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          light: "#a78bfa",
          soft: "#eef2ff",
        },
        ink: {
          DEFAULT: "#0f0f10",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#fafafa",
          wash: "#f8f7ff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)",
        "gradient-soft": "linear-gradient(180deg, #f8f7ff 0%, #ffffff 100%)",
        "gradient-radial": "radial-gradient(ellipse at top, #f8f7ff, #ffffff 60%)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 15, 16, 0.05), 0 1px 2px rgba(15, 15, 16, 0.03)",
        "card-hover": "0 4px 20px rgba(99, 102, 241, 0.08), 0 2px 6px rgba(15, 15, 16, 0.04)",
        hero: "0 10px 40px rgba(99, 102, 241, 0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out",
        "wave": "wave 2.2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        wave: {
          "0%, 60%, 100%": { transform: "rotate(0deg)" },
          "10%, 30%": { transform: "rotate(14deg)" },
          "20%": { transform: "rotate(-8deg)" },
          "40%": { transform: "rotate(-4deg)" },
          "50%": { transform: "rotate(10deg)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
