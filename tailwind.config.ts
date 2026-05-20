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
        // InternetKeeda brand palette — warm electric orange
        brand: {
          50: "#FFF5F0",
          100: "#FFE4D6",
          200: "#FFCBA8",
          300: "#FFAF7A",
          400: "#FF8F4C",
          500: "#FF5A1F",
          600: "#E64A0E",
          700: "#BF3D0B",
          800: "#993009",
          900: "#7A2607",
        },
        // The original theme uses green/emerald everywhere as brand color.
        // Remap both palettes to brand orange so existing components re-skin
        // without touching every file. Add a true success color via "success".
        green: {
          50: "#FFF5F0",
          100: "#FFE4D6",
          200: "#FFCBA8",
          300: "#FFAF7A",
          400: "#FF8F4C",
          500: "#FF5A1F",
          600: "#E64A0E",
          700: "#BF3D0B",
          800: "#993009",
          900: "#7A2607",
        },
        emerald: {
          50: "#FFF5F0",
          100: "#FFE4D6",
          200: "#FFCBA8",
          300: "#FFAF7A",
          400: "#FF8F4C",
          500: "#FF5A1F",
          600: "#E64A0E",
          700: "#BF3D0B",
          800: "#993009",
          900: "#7A2607",
        },
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
        // Gradient-mesh blob drift. Three blobs offset on different axes
        // create a slow, organic mesh effect. Pair with mix-blend-mode
        // and heavy blur on the elements themselves.
        "blob-a": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "33%":      { transform: "translate(8%, -6%) scale(1.08)" },
          "66%":      { transform: "translate(-6%, 4%) scale(0.95)" },
        },
        "blob-b": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(1)" },
          "50%":      { transform: "translate(-10%, 8%) scale(1.12)" },
        },
        "blob-c": {
          "0%, 100%": { transform: "translate(0%, 0%) scale(0.95)" },
          "40%":      { transform: "translate(6%, 6%) scale(1.05)" },
          "80%":      { transform: "translate(-4%, -8%) scale(1.1)" },
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
        "blob-a": "blob-a 24s ease-in-out infinite",
        "blob-b": "blob-b 28s ease-in-out infinite",
        "blob-c": "blob-c 32s ease-in-out infinite",
        "border-sweep": "border-sweep 4s ease infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;