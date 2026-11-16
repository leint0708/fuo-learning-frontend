import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "color-1": "rgb(var(--color-1-rgb) / <alpha-value>)",
        "color-2": "rgb(var(--color-2-rgb) / <alpha-value>)",
        "color-3": "rgb(var(--color-3-rgb) / <alpha-value>)",
        "color-4": "rgb(var(--color-4-rgb) / <alpha-value>)",
        "color-5": "rgb(var(--color-5-rgb) / <alpha-value>)",
        "color-6": "rgb(var(--color-6-rgb) / <alpha-value>)",
        "color-7": "rgb(var(--color-7-rgb) / <alpha-value>)",
      },
      spacing: {
        "space-1": "var(--space-1)",
        "space-2": "var(--space-2)",
        "space-3": "var(--space-3)",
        "space-4": "var(--space-4)",
        "space-5": "var(--space-5)",
        "space-6": "var(--space-6)",
        "space-7": "var(--space-7)",
        "space-8": "var(--space-8)",
        "space-9": "var(--space-9)",
        "space-10": "var(--space-10)",
      },
      borderRadius: {
        full: "var(--radius-full)",
      },
      boxShadow: {
        md: "var(--shadow-md)",
        sm: "var(--shadow-sm)",
        xs: "var(--shadow-xs)",
        "2xs": "var(--shadow-2xs)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        "text-2xs": ["12px", { lineHeight: "16px" }],
        "text-xs": ["14px", { lineHeight: "20px" }],
        "text-sm": ["16px", { lineHeight: "24px" }],
        "text-base": ["17px", { lineHeight: "26px" }],
        "text-lg": ["20px", { lineHeight: "28px" }],
        "text-xl": ["26px", { lineHeight: "34px" }],
        "text-2xl": ["36px", { lineHeight: "42px" }],
        "text-3xl": ["48px", { lineHeight: "54px" }],
      },
      transitionDuration: {
        fast: "150ms",
      },
      transitionTimingFunction: {
        fast: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
