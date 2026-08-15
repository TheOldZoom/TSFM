type Level = "debug" | "info" | "warn" | "error";

const consoleMethod: Record<Level, "log" | "warn" | "error"> = {
  debug: "log",
  info: "log",
  warn: "warn",
  error: "error",
};

export function log(level: Level, ...msg: unknown[]) {
  console[consoleMethod[level]](`[${level}]`, ...msg);
}

export const logger = {
  debug: (...msg: unknown[]) => log("debug", ...msg),
  info: (...msg: unknown[]) => log("info", ...msg),
  warn: (...msg: unknown[]) => log("warn", ...msg),
  error: (...msg: unknown[]) => log("error", ...msg),
};
