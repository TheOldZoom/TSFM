import type { Command } from "./types";
import { recentCommand } from "./recent";
import { setupCommand } from "./setup";
import { configCommand } from "./config";

export const commands = new Map<string, Command>([
  [recentCommand.name, recentCommand],
  [setupCommand.name, setupCommand],
  [configCommand.name, configCommand],
]);
