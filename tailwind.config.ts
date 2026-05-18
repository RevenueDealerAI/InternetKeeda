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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "shimmer": "shimmer 1.5s linear infinite",
        "dot-drift": "dot-drift 30s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;