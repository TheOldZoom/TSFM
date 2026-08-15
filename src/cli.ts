#!/usr/bin/env bun
import { commands } from "./commands";
import { loadConfig } from "./config";
import { logger } from "@/libs/logger";
import { TsfmError, CommandNotFoundError } from "@/libs/errors";

async function main() {
  const [, , commandName, ...rest] = process.argv;

  if (!commandName) {
    logger.info("Usage: tsfm <command> [options]");
    logger.info("Available commands:");
    for (const cmd of commands.values()) {
      logger.info(`  ${cmd.name} - ${cmd.description}`);
    }
    process.exit(0);
  }

  const command = commands.get(commandName);
  if (!command) {
    throw new CommandNotFoundError(commandName);
  }

  const config = loadConfig();
  await command.run({ args: rest, config });
}

main().catch((err) => {
  if (err instanceof TsfmError) {
    logger.error(err.message);
    process.exit(err.exitCode);
  }
  logger.error("Unexpected error:", err);
  process.exit(1);
});
