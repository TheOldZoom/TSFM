import type { UiOptions } from "./options";

const codes = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

type Style = keyof typeof codes;

function apply(styles: Style[], text: string, enabled: boolean): string {
  if (!enabled || styles.length === 0) return text;
  return `${styles.map((s) => codes[s]).join("")}${text}${codes.reset}`;
}

export function createTheme(options: UiOptions) {
  const enabled = options.color;

  const paint =
    (...styles: Style[]) =>
    (text: string) =>
      apply(styles, text, enabled);

  return {
    enabled,
    bold: paint("bold"),
    dim: paint("dim"),
    red: paint("red"),
    green: paint("green"),
    yellow: paint("yellow"),
    blue: paint("blue"),
    magenta: paint("magenta"),
    cyan: paint("cyan"),
    gray: paint("gray"),
    heading: paint("bold", "cyan"),
    label: paint("dim"),
    error: paint("red"),
    success: paint("green"),
    warn: paint("yellow"),
    accent: paint("magenta"),
  };
}

export type Theme = ReturnType<typeof createTheme>;

export const icons = {
  error: "✖",
  success: "✔",
  warn: "⚠",
  play: "▶",
  track: "♪",
  user: "◉",
  chart: "★",
  bullet: "•",
  arrow: "→",
} as const;
