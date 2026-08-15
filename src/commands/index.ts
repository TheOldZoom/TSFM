import type { Command } from "./types";
import { recentCommand } from "./recent";
import { nowCommand } from "./now";
import { setupCommand } from "./setup";
import { configCommand } from "./config";
import { userCommand } from "./user";
import { topCommand } from "./top";
import { statsCommand } from "./stats";

export const commands = new Map<string, Command>([
  [recentCommand.name, recentCommand],
  [nowCommand.name, nowCommand],
  [setupCommand.name, setupCommand],
  [configCommand.name, configCommand],
  [userCommand.name, userCommand],
  [topCommand.name, topCommand],
  [statsCommand.name, statsCommand],
]);
