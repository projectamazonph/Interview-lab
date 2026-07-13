import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        pa: {
          navy: "#050505",
          deep: "#0A0A0F",
          surface: "#111115",
          elevated: "#1A1A20",
          blue: "#007EFF",
          "blue-dark": "#0070E0",
          "blue-soft": "rgba(0, 126, 255, 0.12)",
          green: "#34D399",
          amber: "#FBBF24",
          red: "#FB7185",
          charcoal: "#111827",
          slate: "#334155",
          muted: "rgba(255, 255, 255, 0.45)",
          border: "rgba(255, 255, 255, 0.08)",
        },
      },
      fontFamily: {
        heading: ["var(--font-clash)", "system-ui", "sans-serif"],
        body: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
        pill: "9999px",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
        "3xl": "64px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.12)",
        "glass-lg": "0 20px 60px rgba(0, 0, 0, 0.20)",
        "glass-glow": "0 0 40px rgba(0, 126, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.12)",
        "glass-glow-lg": "0 0 60px rgba(0, 126, 255, 0.15), 0 20px 60px rgba(0, 0, 0, 0.20)",
        "inner-highlight": "inset 0 1px 1px rgba(255, 255, 255, 0.12)",
        "inner-highlight-sm": "inset 0 1px 1px rgba(255, 255, 255, 0.06)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.32, 0.72, 0, 1) both",
        "scale-in": "scale-in 0.6s cubic-bezier(0.32, 0.72, 0, 1) both",
        shimmer: "shimmer 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.32, 0.72, 0, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-heavy": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
