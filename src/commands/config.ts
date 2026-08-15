import type { Command } from "./types";
import { loadConfig, getConfigPath } from "@/config";
import { logger } from "@/libs/logger";

export const configCommand: Command = {
  name: "config",
  description: "Show current configuration, or its file path with `path`",
  run(ctx) {
    const [subcommand] = ctx.args;

    if (subcommand === "path") {
      console.log(getConfigPath());
      return;
    }

    const config = loadConfig();
    console.log(JSON.stringify(config, null, 2));

    if (!config.lastfm.apiKey || !config.lastfm.username) {
      logger.warn(
        "TSFM is not fully configured. Run `tsfm setup` to get started.",
      );
    }
  },
};
