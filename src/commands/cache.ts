import type { Command } from "./types";
import { UsageError } from "@/libs/errors";
import { createUi, icons } from "@/ui";
import { cacheClear, cacheStats, cachePrune } from "@/cache/store";
import { getCacheStorePath } from "@/cache/paths";
import { isMachineOutput, writeOutput } from "@/output";
import { formatWithCommas } from "@/libs/numbers";

export const cacheCommand: Command = {
  name: "cache",
  description: "Inspect or clear the local response cache",
  usage: "tsfm cache <stats|clear|prune|path>",
  run(ctx) {
    const [subcommand] = ctx.args;
    const ui = createUi(ctx.options);

    if (!subcommand || subcommand === "stats") {
      const stats = cacheStats();
      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, stats);
        return;
      }
      ui.page("Cache", getCacheStorePath());
      ui.section("Summary", [
        `  ${ui.theme.label("Entries  ")}${formatWithCommas(stats.entries)}`,
        `  ${ui.theme.label("Expired  ")}${formatWithCommas(stats.expired)}`,
        `  ${ui.theme.label("Size     ")}${(stats.sizeBytes / 1024).toFixed(1)} KB`,
      ]);
      return;
    }

    if (subcommand === "clear") {
      const count = cacheClear();
      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, { cleared: count });
        return;
      }
      console.log(
        `${ui.theme.success(icons.success)} Cleared ${formatWithCommas(count)} cache entries.`,
      );
      return;
    }

    if (subcommand === "prune") {
      const count = cachePrune();
      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, { pruned: count });
        return;
      }
      console.log(
        `${ui.theme.success(icons.success)} Pruned ${formatWithCommas(count)} expired entries.`,
      );
      return;
    }

    if (subcommand === "path") {
      console.log(getCacheStorePath());
      return;
    }

    throw new UsageError("Usage: tsfm cache <stats|clear|prune|path>");
  },
};
