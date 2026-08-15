#!/usr/bin/env bun
import { commands } from "./commands";
import { loadConfig } from "./config";
import { logger, configureLogger } from "@/libs/logger";
import { TsfmError, CommandNotFoundError } from "@/libs/errors";
import { LastFMApiError } from "@/api/errors";
import { createUi, parseCommandArgv } from "@/ui";

async function main() {
  const { commandName, commandArgs, options, imagesOverride } = parseCommandArgv(
    process.argv.slice(2),
  );

  configureLogger(options);

  if (!commandName) {
    const ui = createUi(options);
    ui.page("Your Last.fm, in the terminal", "Usage: tsfm <command> [options]");
    ui.table(
      [
        { key: "command", header: "Command", minWidth: 8 },
        { key: "description", header: "Description", minWidth: 28 },
      ],
      [...commands.values()].map((cmd) => ({
        command: cmd.name,
        description: cmd.description,
      })),
    );
    ui.blank();
    ui.hint("Global: --no-color  --quiet  --verbose  --images  --no-images");
    process.exit(0);
  }

  const command = commands.get(commandName);
  if (!command) {
    throw new CommandNotFoundError(commandName);
  }

  const config = loadConfig();
  options.images = imagesOverride ?? config.appearance.images;
  options.imageMode = config.appearance.imageMode;
  await command.run({ args: commandArgs, config, options });
}

main().catch((err) => {
  const { options } = parseCommandArgv(process.argv.slice(2));
  configureLogger(options);
  const ui = createUi(options);

  if (err instanceof TsfmError) {
    ui.error(err.message);

    if (err instanceof CommandNotFoundError) {
      ui.hint("Run `tsfm` with no arguments to see available commands.");
    }

    process.exit(err.exitCode);
  }

  if (err instanceof LastFMApiError) {
    ui.error(`Last.fm API error: ${err.message}`);
    process.exit(1);
  }

  ui.error("Unexpected error");
  if (options.verbose) {
    console.error(err);
  }
  process.exit(1);
});
