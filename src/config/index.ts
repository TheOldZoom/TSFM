import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { parse, stringify } from "yaml";
import { getConfigPath } from "./paths";
import { configSchema, defaultConfig, type Config } from "./schema";
import { getEnv } from "@/libs/env";
import { logger } from "@/libs/logger";
import { TsfmError } from "@/libs/errors";

export class ConfigError extends TsfmError {}

export function readConfigFile(): Partial<Config> {
  const path = getConfigPath();

  if (!existsSync(path)) {
    return {};
  }

  const raw = readFileSync(path, "utf-8");
  let parsed: unknown;

  try {
    parsed = parse(raw);
  } catch (err) {
    throw new ConfigError(
      `Failed to parse config file at ${path}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  const result = configSchema.partial().safeParse(parsed ?? {});

  if (!result.success) {
    throw new ConfigError(
      `Invalid config file at ${path}: ${result.error.issues
        .map((i) => i.message)
        .join(", ")}`,
    );
  }

  return result.data;
}

export function writeConfigFile(config: Config): void {
  const path = getConfigPath();
  const dir = dirname(path);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(path, stringify(config), "utf-8");
  logger.debug("Wrote config file", { path });
}

export function loadConfig(): Config {
  const fileConfig = readConfigFile();

  return {
    lastfm: {
      apiKey:
        getEnv("LASTFM_API_KEY") ??
        fileConfig.lastfm?.apiKey ??
        defaultConfig.lastfm.apiKey,
      username:
        getEnv("LASTFM_USERNAME") ??
        fileConfig.lastfm?.username ??
        defaultConfig.lastfm.username,
      secret:
        getEnv("LASTFM_API_SECRET") ??
        fileConfig.lastfm?.secret ??
        defaultConfig.lastfm.secret,
      session: fileConfig.lastfm?.session ?? defaultConfig.lastfm.session,
    },
    appearance: {
      images: fileConfig.appearance?.images ?? defaultConfig.appearance.images,
      imageMode:
        fileConfig.appearance?.imageMode ?? defaultConfig.appearance.imageMode,
      imageSize:
        fileConfig.appearance?.imageSize ?? defaultConfig.appearance.imageSize,
      imageWidth: fileConfig.appearance?.imageWidth,
      imageMaxWidth:
        fileConfig.appearance?.imageMaxWidth ??
        defaultConfig.appearance.imageMaxWidth,
      imageSpacing:
        fileConfig.appearance?.imageSpacing ??
        defaultConfig.appearance.imageSpacing,
    },
    cache: {
      enabled: fileConfig.cache?.enabled ?? defaultConfig.cache.enabled,
    },
  };
}

export function requireConfig(config: Config): asserts config is Config & {
  lastfm: { apiKey: string; username: string };
} {
  if (!config.lastfm.apiKey || !config.lastfm.username) {
    throw new ConfigError(
      "TSFM is not configured yet. Run `tsfm setup` to get started.",
    );
  }
}

export function requireSession(config: Config): asserts config is Config & {
  lastfm: { apiKey: string; session: { key: string; username: string } };
} {
  if (!config.lastfm.apiKey) {
    throw new ConfigError(
      "TSFM is not configured yet. Run `tsfm setup` to get started.",
    );
  }
  if (!config.lastfm.session?.key) {
    throw new ConfigError("You're not logged in. Run `tsfm login` first.");
  }
}

export { getConfigPath, getConfigDir } from "./paths";
export type { Config } from "./schema";
