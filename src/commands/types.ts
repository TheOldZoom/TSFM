import type { Config } from "@/config/schema";
import type { UiOptions } from "@/ui/options";

export interface CommandContext {
  args: string[];
  config: Config;
  options: UiOptions;
}

export interface Command {
  name: string;
  description: string;
  run(ctx: CommandContext): Promise<void> | void;
}
