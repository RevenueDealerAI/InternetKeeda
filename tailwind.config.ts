import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // InternetKeeda brand palette — KEEDA red (matches the
        // Transparent/Transparent red.png logo, ~#DC2626 saturated).
        brand: {
          50:  "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#DC2626",
          600: "#B91C1C",
          700: "#991B1B",
          800: "#7F1D1D",
          900: "#671414",
        },
        // Three palette names — green, emerald, orange — are all remapped
        // to the brand red so every existing class (`bg-orange-500`,
        // `text-green-700`, `from-emerald-600 to-orange-700`, etc.) paints
        // the right brand color without touching every file. The earlier
        // theme bootstrap put the codebase through this same pattern for
        // green → orange. Now: orange/green/emerald all → red.
        green:    { 50:"#FEF2F2",100:"#FEE2E2",200:"#FECACA",300:"#FCA5A5",400:"#F87171",500:"#DC2626",600:"#B91C1C",700:"#991B1B",800:"#7F1D1D",900:"#671414" },
        emerald:  { 50:"#FEF2F2",100:"#FEE2E2",200:"#FECACA",300:"#FCA5A5",400:"#F87171",500:"#DC2626",600:"#B91C1C",700:"#991B1B",800:"#7F1D1D",900:"#671414" },
        orange:   { 50:"#FEF2F2",100:"#FEE2E2",200:"#FECACA",300:"#FCA5A5",400:"#F87171",500:"#DC2626",600:"#B91C1C",700:"#991B1B",800:"#7F1D1D",900:"#671414" },
        amber:    { 50:"#FEF2F2",100:"#FEE2E2",200:"#FECACA",300:"#FCA5A5",400:"#F87171",500:"#DC2626",600:"#B91C1C",700:"#991B1B",800:"#7F1D1D",900:"#671414" },
        success: {
          50: "#ECFDF5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        coral: {
          50: "#FFF1F1",
          100: "#FFE2E2",
          200: "#FFC5C5",
          300: "#FF9B9B",
          400: "#FF6B6B",
          500: "#FF4154",
          600: "#FF1F1F",
          700: "#DB0000",
          800: "#AF0000",
          900: "#8B0000"
        },
        // Phase D Tier 3 — bright SaaS rebuild. Violet/indigo as secondary
        // accent for the gradient mesh hero, gradient-border CTAs, and
        // category-tinted bento tiles. Kept distinct from `purple` so the
        // existing purple uses don't accidentally shift.
        accentViolet: {
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
        },
        accentIndigo: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        "shimmer": {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" },
        },
        "dot-drift": {
          "0%":   { "background-position": "0px 0px, 0px 0px" },
          "100%": { "background-position": "40px 40px, 40px 40px" },
        },
        // Gradient border sweep — for the gradient-glow card hover.
        "border-sweep": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%":      { "background-position": "100% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "shimmer": "shimmer 1.5s linear infinite",
        "dot-drift": "dot-drift 30s linear infinite",
        "border-sweep": "border-sweep 4s ease infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;