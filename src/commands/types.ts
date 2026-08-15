import type { Config } from "../config/types";

export interface CommandContext {
  args: string[];
  config: Config;
}

export interface Command {
  name: string;
  description: string;
  run(ctx: CommandContext): Promise<void> | void;
}
