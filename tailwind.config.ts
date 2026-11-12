import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "color-1": "var(--color-1)",
        "color-2": "var(--color-2)",
        "color-3": "var(--color-3)",
        "color-4": "var(--color-4)",
        "color-5": "var(--color-5)",
        "color-6": "var(--color-6)",
        "color-7": "var(--color-7)",
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
        sm: "var(--shadow-sm)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
      },
      fontSize: {
        "text-xs": ["16px", { lineHeight: "24px" }],
        "text-sm": ["18px", { lineHeight: "28px" }],
        "text-base": ["20px", { lineHeight: "32px" }],
        "text-lg": ["24px", { lineHeight: "32px" }],
        "text-xl": ["30px", { lineHeight: "36px" }],
        "text-2xl": ["60px", { lineHeight: "60px" }],
        "text-3xl": ["72px", { lineHeight: "72px" }],
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
