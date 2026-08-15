import type { Config } from "@/config/schema";
import type { UiOptions } from "@/ui/options";

export interface CommandContext {
  args: string[];
  config: Config;
  options: UiOptions;
}

export interface FlagSpec {
  flag: string;
  description: string;
}

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  usage?: string;
  flags?: FlagSpec[];
  run(ctx: CommandContext): Promise<void> | void;
}
