import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  content: ["./index.html", "./app/index.html", "./src/**/*.{ts,tsx}"],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        "primary-soft": "hsl(var(--primary-soft))",
        "primary-strong": "hsl(var(--primary-strong))",
        surface: { DEFAULT: "hsl(var(--card))", sunken: "hsl(var(--muted))" },
        meal: { DEFAULT: "hsl(var(--meal))", soft: "hsl(var(--meal-soft))" },
        sleep: { DEFAULT: "hsl(var(--sleep))", soft: "hsl(var(--sleep-soft))" },
        feeling: { DEFAULT: "hsl(var(--feeling))", soft: "hsl(var(--feeling-soft))" },
        move: { DEFAULT: "hsl(var(--move))", soft: "hsl(var(--move-soft))" },
        water: { DEFAULT: "hsl(var(--water))", soft: "hsl(var(--water-soft))" },
        range: {
          below: "hsl(var(--range-below))",
          in: "hsl(var(--range-in))",
          above: "hsl(var(--range-above))",
        },
        safety: { DEFAULT: "hsl(var(--safety))", foreground: "hsl(var(--safety-foreground))" },
      },
      fontFamily: {
        serif: ['"Fraunces Variable"', "Fraunces", "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        tile: "22px",
        card: "24px",
        "card-lg": "28px",
        sheet: "32px",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
      },
      maxWidth: {
        app: "430px",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
