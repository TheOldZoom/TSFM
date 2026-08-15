import { icons, type Theme } from "./theme";

function divider(): string {
  const width = process.stdout.columns ?? 72;
  return "─".repeat(Math.max(24, Math.min(width, 72)));
}

export function formatPage(theme: Theme, title: string, meta?: string): string[] {
  const lines = [
    "",
    `${theme.accent("◆")} ${theme.bold("TSFM")} ${theme.dim("/ ")}${theme.heading(title.toUpperCase())}`,
    theme.dim(divider()),
  ];

  if (meta) {
    lines.push(theme.dim(meta));
  }

  lines.push("");
  return lines;
}

export function formatHeading(theme: Theme, text: string): string {
  return theme.bold(text);
}

export function formatSection(theme: Theme, title: string, body: string[]): string[] {
  return [theme.label(`┌─ ${title}`), ...body, theme.label("└─"), ""];
}

export function formatKeyValue(
  theme: Theme,
  label: string,
  value: string,
): string {
  return `${theme.label(`${label.padEnd(11)} `)}${value}`;
}

export function formatError(theme: Theme, message: string): string {
  return `${theme.error(`${icons.error} `)}${theme.bold(message)}`;
}

export function formatHint(theme: Theme, message: string): string {
  return theme.dim(`  ${icons.arrow} ${message}`);
}

export function formatNowPlaying(theme: Theme, artist: string, track: string): string[] {
  return [
    "",
    `${theme.accent("◆")} ${theme.bold("TSFM")} ${theme.dim("/ ")}${theme.heading("NOW PLAYING")}`,
    theme.dim(divider()),
    "",
    theme.bold(track),
    theme.dim(artist),
    "",
  ];
}
