export const themeTokens = {
  colors: {
    paper: "255 250 243",
    sand: "245 239 227",
    fog: "232 223 208",
    clay: "187 124 76",
    moss: "47 93 80",
    dusk: "43 53 64",
    ink: "22 26 29",
    line: "118 112 101"
  },
  fonts: {
    sans: '"Aptos", "Segoe UI Variable", "Trebuchet MS", sans-serif',
    display: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif'
  },
  radii: {
    panel: "1.5rem",
    tile: "1.125rem",
    pill: "999px"
  },
  shadows: {
    panel: "0 24px 80px rgba(18, 24, 27, 0.12)",
    hero: "0 36px 120px rgba(18, 24, 27, 0.16)"
  },
  spacing: {
    section: "clamp(3.5rem, 7vw, 6rem)",
    cluster: "1.5rem",
    frame: "1.25rem"
  },
  tracking: {
    tight: "-0.02em",
    eyebrow: "0.18em",
    brand: "0.32em"
  },
  layout: {
    shell: "80rem"
  },
  zIndex: {
    header: "40"
  },
  motion: {
    fluent: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  }
} as const;

export type ThemeColorName = keyof typeof themeTokens.colors;

export const colorVariable = (token: ThemeColorName, alpha = "<alpha-value>") =>
  `rgb(var(--color-${token}) / ${alpha})`;
