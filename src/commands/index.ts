import type { Command } from "./types";
import { recentCommand } from "./recent";

export const commands = new Map<string, Command>([
  [recentCommand.name, recentCommand],
]);
