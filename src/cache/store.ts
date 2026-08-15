import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { getCacheStorePath } from "./paths";
import { logger } from "@/libs/logger";

interface CacheEntry {
  value: unknown;
  cachedAt: number;
  expiresAt: number | null;
}

type CacheFile = Record<string, CacheEntry>;

let memo: CacheFile | undefined;

function loadFile(): CacheFile {
  if (memo) return memo;

  const path = getCacheStorePath();
  if (!existsSync(path)) {
    memo = {};
    return memo;
  }

  try {
    memo = JSON.parse(readFileSync(path, "utf-8")) as CacheFile;
  } catch (err) {
    logger.warn("Failed to read cache file; starting fresh", {
      path,
      error: err instanceof Error ? err.message : String(err),
    });
    memo = {};
  }

  return memo;
}

function persist(file: CacheFile): void {
  const path = getCacheStorePath();
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, JSON.stringify(file), "utf-8");
}

export function cacheGet<T>(key: string): T | undefined {
  const file = loadFile();
  const entry = file[key];
  if (!entry) return undefined;

  if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
    delete file[key];
    persist(file);
    return undefined;
  }

  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number | null): void {
  const file = loadFile();
  file[key] = {
    value,
    cachedAt: Date.now(),
    expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
  };

  const now = Date.now();
  for (const [existingKey, entry] of Object.entries(file)) {
    if (entry.expiresAt !== null && entry.expiresAt < now) {
      delete file[existingKey];
    }
  }

  persist(file);
}

export function cacheClear(): number {
  const file = loadFile();
  const count = Object.keys(file).length;
  memo = {};
  persist(memo);
  return count;
}

export function cachePrune(): number {
  const file = loadFile();
  const now = Date.now();
  let pruned = 0;

  for (const [key, entry] of Object.entries(file)) {
    if (entry.expiresAt !== null && entry.expiresAt < now) {
      delete file[key];
      pruned++;
    }
  }

  if (pruned > 0) persist(file);
  return pruned;
}

export function cacheStats(): {
  entries: number;
  expired: number;
  sizeBytes: number;
  path: string;
} {
  const path = getCacheStorePath();
  const file = loadFile();
  const now = Date.now();
  const expired = Object.values(file).filter(
    (entry) => entry.expiresAt !== null && entry.expiresAt < now,
  ).length;

  const sizeBytes = existsSync(path)
    ? Buffer.byteLength(JSON.stringify(file), "utf-8")
    : 0;

  return { entries: Object.keys(file).length, expired, sizeBytes, path };
}
