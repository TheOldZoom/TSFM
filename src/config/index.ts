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
    },
  };
}

export function requireConfig(
  config: Config,
): asserts config is { lastfm: { apiKey: string; username: string } } {
  if (!config.lastfm.apiKey || !config.lastfm.username) {
    throw new ConfigError(
      "TSFM is not configured yet. Run `tsfm setup` to get started.",
    );
  }
}

export { getConfigPath, getConfigDir } from "./paths";
export type { Config } from "./schema";
