import type { Command } from "./types";
import { recentCommand } from "./recent";
import { nowCommand } from "./now";
import { setupCommand } from "./setup";
import { configCommand } from "./config";
import { userCommand } from "./user";
import { topCommand } from "./top";
import { statsCommand } from "./stats";
import { compareCommand } from "./compare";
import { loginCommand } from "./login";
import { logoutCommand } from "./logout";
import { loveCommand } from "./love";
import { unloveCommand } from "./unlove";
import { scrobbleCommand } from "./scrobble";
import { tagCommand } from "./tag";
import { cacheCommand } from "./cache";
import { historyCommand } from "./history";
import { exportCommand } from "./export";
import { helpCommand } from "./help";

export const commands = new Map<string, Command>([
  [recentCommand.name, recentCommand],
  [nowCommand.name, nowCommand],
  [setupCommand.name, setupCommand],
  [configCommand.name, configCommand],
  [userCommand.name, userCommand],
  [topCommand.name, topCommand],
  [statsCommand.name, statsCommand],
  [compareCommand.name, compareCommand],
  [loginCommand.name, loginCommand],
  [logoutCommand.name, logoutCommand],
  [loveCommand.name, loveCommand],
  [unloveCommand.name, unloveCommand],
  [scrobbleCommand.name, scrobbleCommand],
  [tagCommand.name, tagCommand],
  [cacheCommand.name, cacheCommand],
  [historyCommand.name, historyCommand],
  [exportCommand.name, exportCommand],
  [helpCommand.name, helpCommand],
]);

const aliasMap = new Map<string, string>();

for (const command of commands.values()) {
  for (const alias of command.aliases ?? []) {
    if (commands.has(alias)) {
      throw new Error(
        `Alias "${alias}" for "${command.name}" collides with an existing command name.`,
      );
    }
    const existing = aliasMap.get(alias);
    if (existing) {
      throw new Error(
        `Alias "${alias}" is registered for both "${existing}" and "${command.name}".`,
      );
    }
    aliasMap.set(alias, command.name);
  }
}

export function resolveCommand(name: string): Command | undefined {
  const direct = commands.get(name);
  if (direct) return direct;

  const canonical = aliasMap.get(name);
  return canonical ? commands.get(canonical) : undefined;
}
