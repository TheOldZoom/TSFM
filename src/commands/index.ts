import type { Command } from "./types";
import { recentCommand } from "./recent";
import { setupCommand } from "./setup";
import { configCommand } from "./config";
import { userCommand } from "./user";
import { topCommand } from "./top";

export const commands = new Map<string, Command>([
  [recentCommand.name, recentCommand],
  [setupCommand.name, setupCommand],
  [configCommand.name, configCommand],
  [userCommand.name, userCommand],
  [topCommand.name, topCommand],
]);
