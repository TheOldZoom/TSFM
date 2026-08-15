import { homedir } from "node:os";
import { join } from "node:path";
import { getEnv } from "@/libs/env";

export function getDataDir(): string {
  const xdgDataHome = getEnv("XDG_DATA_HOME");
  return xdgDataHome && xdgDataHome.length > 0
    ? xdgDataHome
    : join(homedir(), ".local", "share");
}

export function getHistoryFilePath(username: string): string {
  return join(
    getDataDir(),
    "tsfm",
    "history",
    `${username.toLowerCase()}.jsonl`,
  );
}
