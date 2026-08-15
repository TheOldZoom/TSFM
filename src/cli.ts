#!/usr/bin/env bun
import * as p from "@clack/prompts";
import { commands, resolveCommand } from "./commands";
import { loadConfig } from "./config";
import { configureLogger } from "@/libs/logger";
import { TsfmError, CommandNotFoundError } from "@/libs/errors";
import { LastFMApiError } from "@/api/errors";
import { createUi, parseCommandArgv } from "@/ui";
import type { UiOptions } from "@/ui/options";
import { isMachineOutput, writeMachineError, writeOutput } from "@/output";
import { configureCache } from "@/cache/context";
import { suggestClosest, didYouMean } from "@/libs/suggest";

const HELP_FLAGS = new Set(["--help", "-h"]);

function allCommandNames(): string[] {
  const names: string[] = [];
  for (const command of commands.values()) {
    names.push(command.name, ...(command.aliases ?? []));
  }
  return names;
}

async function pickCommandInteractively(): Promise<string | undefined> {
  console.log();
  p.intro("◆ TSFM");

  const choice = await p.select({
    message: "What would you like to do?",
    options: [...commands.values()]
      .filter((command) => command.name !== "help")
      .map((command) => ({
        value: command.name,
        label: command.name,
        hint: command.description,
      })),
  });

  if (p.isCancel(choice)) {
    p.cancel("Cancelled.");
    return undefined;
  }

  return choice;
}

function printCommandList(options: UiOptions): void {
  if (isMachineOutput(options.output)) {
    writeOutput(
      options.output,
      [...commands.values()].map((command) => ({
        name: command.name,
        description: command.description,
        aliases: command.aliases ?? [],
      })),
    );
    return;
  }
  const ui = createUi(options);
  ui.page("Your Last.fm, in the terminal", "Usage: tsfm <command> [options]");
  ui.table(
    [
      { key: "command", header: "Command", minWidth: 8 },
      { key: "aliases", header: "Aliases", minWidth: 10 },
      { key: "description", header: "Description", minWidth: 28 },
    ],
    [...commands.values()].map((cmd) => ({
      command: cmd.name,
      aliases: cmd.aliases?.join(", ") ?? "",
      description: cmd.description,
    })),
  );
  ui.blank();
  ui.hint(
    "Global: --no-color  --quiet  --verbose  --images  --no-images  --json  --csv  --no-cache  --offline  --help/-h",
  );
  ui.hint(
    "Run `tsfm help <command>` or `tsfm <command> --help` for details on a specific command.",
  );
}

async function main() {
  const { commandName, commandArgs, options, imagesOverride, outputOverride } =
    parseCommandArgv(process.argv.slice(2));

  options.output = outputOverride ?? "pretty";
  configureLogger(options);

  if (commandName && HELP_FLAGS.has(commandName)) {
    printCommandList(options);
    process.exit(0);
  }

  let resolvedName = commandName;

  if (!resolvedName) {
    if (options.output === "pretty" && process.stdout.isTTY) {
      resolvedName = await pickCommandInteractively();
      if (!resolvedName) {
        process.exit(0);
      }
    } else {
      printCommandList(options);
      process.exit(0);
    }
  }

  const command = resolveCommand(resolvedName);
  if (!command) {
    throw new CommandNotFoundError(resolvedName);
  }

  const config = loadConfig();
  options.images = imagesOverride ?? config.appearance.images;
  options.imageMode = config.appearance.imageMode;

  if (commandArgs.some((arg) => HELP_FLAGS.has(arg))) {
    const help = resolveCommand("help")!;
    await help.run({ args: [command.name], config, options });
    return;
  }

  configureCache({
    enabled: options.cache && config.cache.enabled,
    offline: options.offline,
  });

  await command.run({ args: commandArgs, config, options });
}

main().catch((err) => {
  const { commandName, options, outputOverride } = parseCommandArgv(
    process.argv.slice(2),
  );
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
      const suggestions = commandName
        ? suggestClosest(commandName, allCommandNames(), 3)
        : [];
      const hint = didYouMean(suggestions);
      if (hint) ui.hint(hint);
      ui.hint(
        "Run `tsfm help` (or `tsfm` with no arguments) to see available commands.",
      );
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
