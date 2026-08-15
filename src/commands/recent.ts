import type { Command } from "./types";

export const recentCommand: Command = {
  name: "recent",
  description: "Show recently played tracks",
  run(ctx) {
    console.log(ctx.args);
    console.log(ctx.config);
  },
};
