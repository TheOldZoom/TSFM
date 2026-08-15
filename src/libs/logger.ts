import { getEnv } from "@/libs/env";

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const consoleMethod: Record<Level, "log" | "warn" | "error"> = {
  debug: "log",
  info: "log",
  warn: "warn",
  error: "error",
};

function isLevel(value: string): value is Level {
  return value in LEVELS;
}

function getMinLevel(): Level {
  const raw = getEnv("TSFM_LOG_LEVEL", "info")!.toLowerCase();
  if (isLevel(raw)) return raw;
  console.warn(
    `[warn] Invalid TSFM_LOG_LEVEL "${raw}", falling back to "info"`,
  );
  return "info";
}

const minLevel = getMinLevel();

export function log(level: Level, ...msg: unknown[]) {
  if (LEVELS[level] < LEVELS[minLevel]) return;
  console[consoleMethod[level]](`[${level}]`, ...msg);
}

export const logger = {
  debug: (...msg: unknown[]) => log("debug", ...msg),
  info: (...msg: unknown[]) => log("info", ...msg),
  warn: (...msg: unknown[]) => log("warn", ...msg),
  error: (...msg: unknown[]) => log("error", ...msg),
};
