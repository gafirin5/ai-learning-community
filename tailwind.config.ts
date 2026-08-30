import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    // Future monorepo (Fase 2): "./apps/web/src/**/*", "../../packages/ui/src/**/*"
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — triplet RGB + <alpha-value> agar modifier
        // opasitas (mis. bg-brand/40) bekerja pada seluruh app.
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised-rgb) / <alpha-value>)",
        "surface-hover": "rgb(var(--surface-hover-rgb) / <alpha-value>)",
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        content: "rgb(var(--content-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        subtle: "rgb(var(--subtle-rgb) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          hover: "rgb(var(--brand-hover-rgb) / <alpha-value>)",
          soft: "rgb(var(--brand-soft-rgb) / <alpha-value>)",
          ring: "var(--brand-ring)",
        },
        success: {
          DEFAULT: "rgb(var(--success-rgb) / <alpha-value>)",
          soft: "rgb(var(--success-soft-rgb) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--warning-rgb) / <alpha-value>)",
          soft: "rgb(var(--warning-soft-rgb) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger-rgb) / <alpha-value>)",
          soft: "rgb(var(--danger-soft-rgb) / <alpha-value>)",
        },
        "code-bg": "rgb(var(--code-bg-rgb) / <alpha-value>)",
        "code-fg": "rgb(var(--code-fg-rgb) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          "Arial",
          "sans-serif",
        ],
        serif: ['Georgia', '"Times New Roman"', "serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          '"SF Mono"',
          '"Cascadia Code"',
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        lg: "0.3125rem",
        xl: "0.375rem",
        "2xl": "0.5rem",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        sm: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        md: "0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.04)",
        lg: "0 12px 32px -8px rgb(15 23 42 / 0.14)",
        xl: "0 24px 56px -12px rgb(15 23 42 / 0.2)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-5px)" },
          "40%": { transform: "translateX(5px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(80vh) rotate(720deg)", opacity: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 var(--brand-ring)" },
          "50%": { boxShadow: "0 0 0 6px transparent" },
        },
        "message-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop": {
          from: { opacity: "0", transform: "scale(0.7)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "stamp-in": {
          "0%": { opacity: "0", transform: "scale(1.6) rotate(-10deg)" },
          "60%": { opacity: "1", transform: "scale(0.96) rotate(-2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-2deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        shimmer: "shimmer 1.6s linear infinite",
        "toast-in": "toast-in 0.2s ease-out",
        "pop-in": "pop-in 0.15s ease-out",
        "pop": "pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        shake: "shake 0.4s ease-in-out",
        "confetti-fall": "confetti-fall 1.6s ease-out forwards",
        "pulse-glow": "pulse-glow 2.2s ease-in-out infinite",
        "message-in": "message-in 0.25s ease-out",
        "stamp-in": "stamp-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
