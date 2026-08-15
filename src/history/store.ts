import { existsSync, mkdirSync, readFileSync, appendFileSync } from "node:fs";
import { dirname } from "node:path";
import { getHistoryFilePath } from "./paths";
import { logger } from "@/libs/logger";

export interface HistoryEntry {
  artist: string;
  track: string;
  album: string;
  playedAt: number;
  url: string;
}

function ensureDir(path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readHistory(username: string): HistoryEntry[] {
  const path = getHistoryFilePath(username);
  if (!existsSync(path)) return [];

  const raw = readFileSync(path, "utf-8");
  const entries: HistoryEntry[] = [];

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as HistoryEntry);
    } catch (err) {
      logger.warn("Skipping malformed history line", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return entries;
}

export function appendHistory(
  username: string,
  entries: HistoryEntry[],
): number {
  if (entries.length === 0) return 0;

  const path = getHistoryFilePath(username);
  ensureDir(path);

  const existingKeys = new Set(
    readHistory(username).map(
      (e) => `${e.artist}\u0000${e.track}\u0000${e.playedAt}`,
    ),
  );

  const lines: string[] = [];

  for (const entry of entries) {
    const key = `${entry.artist}\u0000${entry.track}\u0000${entry.playedAt}`;
    if (existingKeys.has(key)) continue;
    existingKeys.add(key);
    lines.push(JSON.stringify(entry));
  }

  if (lines.length > 0) {
    appendFileSync(path, lines.join("\n") + "\n", "utf-8");
  }

  return lines.length;
}

export function historyStats(username: string): {
  entries: number;
  oldest?: number;
  newest?: number;
  path: string;
} {
  const entries = readHistory(username);
  const path = getHistoryFilePath(username);
  if (entries.length === 0) return { entries: 0, path };

  const timestamps = entries.map((e) => e.playedAt);
  return {
    entries: entries.length,
    oldest: Math.min(...timestamps),
    newest: Math.max(...timestamps),
    path,
  };
}
