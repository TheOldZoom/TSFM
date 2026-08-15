#!/usr/bin/env bun
import { commands } from "./commands";
import { loadConfig } from "./config";
import { logger, configureLogger } from "@/libs/logger";
import { TsfmError, CommandNotFoundError } from "@/libs/errors";
import { LastFMApiError } from "@/api/errors";
import { createUi, parseCommandArgv } from "@/ui";
import { isMachineOutput, writeMachineError, writeOutput } from "@/output";

async function main() {
  const { commandName, commandArgs, options, imagesOverride, outputOverride } = parseCommandArgv(
    process.argv.slice(2),
  );

  options.output = outputOverride ?? "pretty";
  configureLogger(options);

  if (!commandName) {
    if (isMachineOutput(options.output)) {
      writeOutput(
        options.output,
        [...commands.values()].map((command) => ({
          name: command.name,
          description: command.description,
        })),
      );
      return;
    }
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
    ui.hint("Global: --no-color  --quiet  --verbose  --images  --no-images  --json  --csv");
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
  const { options, outputOverride } = parseCommandArgv(process.argv.slice(2));
  options.output = outputOverride ?? "pretty";
  configureLogger(options);
  const ui = createUi(options);

  if (err instanceof TsfmError) {
    if (options.output !== "pretty") {
      writeMachineError(options.output, err.message, err.exitCode);
      process.exit(err.exitCode);
    }
    ui.error(err.message);

    if (err instanceof CommandNotFoundError) {
      ui.hint("Run `tsfm` with no arguments to see available commands.");
    }

    process.exit(err.exitCode);
  }

  if (err instanceof LastFMApiError) {
    if (options.output !== "pretty") {
      writeMachineError(options.output, err.message, 1);
      process.exit(1);
    }
    ui.error(`Last.fm API error: ${err.message}`);
    process.exit(1);
  }

  if (options.output !== "pretty") {
    writeMachineError(options.output, "Unexpected error", 1);
    process.exit(1);
  }
  ui.error("Unexpected error");
  if (options.verbose) {
    console.error(err);
  }
  process.exit(1);
});
