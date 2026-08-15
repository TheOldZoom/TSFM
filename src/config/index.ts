import type { Config } from "./types";
import { getEnv } from "@/libs/env";

const defaultConfig: Config = {
  lastfm: {
    apiKey: undefined,
    username: undefined,
  },
};

export function loadConfig(): Config {
  return {
    lastfm: {
      apiKey: getEnv("LASTFM_API_KEY", defaultConfig.lastfm.apiKey),
      username: getEnv("LASTFM_USERNAME", defaultConfig.lastfm.username),
    },
  };
}
