import type { Config } from "tailwindcss";
import { colorVariable } from "./design-tokens";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/domain/src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: colorVariable("paper"),
        sand: colorVariable("sand"),
        fog: colorVariable("fog"),
        clay: colorVariable("clay"),
        moss: colorVariable("moss"),
        dusk: colorVariable("dusk"),
        ink: colorVariable("ink"),
        line: colorVariable("line")
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        hero: "var(--shadow-hero)"
      },
      borderRadius: {
        panel: "var(--radius-panel)",
        tile: "var(--radius-tile)",
        pill: "var(--radius-pill)"
      },
      spacing: {
        cluster: "var(--space-cluster)",
        frame: "var(--space-frame)",
        section: "var(--space-section)"
      },
      letterSpacing: {
        tight: "var(--tracking-tight)",
        eyebrow: "var(--tracking-eyebrow)",
        brand: "var(--tracking-brand)"
      },
      maxWidth: {
        shell: "var(--max-width-shell)"
      },
      zIndex: {
        header: "var(--z-header)"
      },
      transitionTimingFunction: {
        fluent: "var(--ease-fluent)"
      }
    }
  },
  plugins: []
};

export default config;
