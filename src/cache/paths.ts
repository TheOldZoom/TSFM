import { homedir } from "node:os";
import { join } from "node:path";
import { getEnv } from "@/libs/env";

export function getCacheDir(): string {
  const xdgCacheHome = getEnv("XDG_CACHE_HOME");
  return xdgCacheHome && xdgCacheHome.length > 0
    ? xdgCacheHome
    : join(homedir(), ".cache");
}

export function getCacheRoot(): string {
  return join(getCacheDir(), "tsfm");
}

export function getCacheStorePath(): string {
  return join(getCacheRoot(), "cache.json");
}
