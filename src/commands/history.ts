import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import { formatWithCommas } from "@/libs/numbers";
import {
  appendHistory,
  historyStats,
  type HistoryEntry,
} from "@/history/store";
import { getHistoryFilePath } from "@/history/paths";
import { requireOnline } from "@/cache/context";

const PAGE_SIZE = 200;
const DEFAULT_MAX_PAGES = 50;
const PAGE_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const historyCommand: Command = {
  name: "history",
  description: "Sync and inspect your locally stored listening history",
  aliases: ["hist"],
  usage: "tsfm history <sync|stats> [--user <name>] [--all] [--pages <n>]",
  flags: [
    {
      flag: "--user <name>",
      description: "Last.fm username (defaults to your configured username)",
    },
    {
      flag: "--all",
      description:
        "sync: fetch your entire history instead of the default 50 pages",
    },
    {
      flag: "--pages <n>",
      description: "sync: fetch a specific number of pages",
    },
  ],
  async run(ctx) {
    requireConfig(ctx.config);

    const [subcommand, ...rest] = ctx.args;
    const ui = createUi(ctx.options);

    if (!subcommand || subcommand === "stats") {
      const { values } = parseArgs({
        args: rest,
        options: { user: { type: "string" } },
        strict: false,
      });
      const username = (values.user as string) ?? ctx.config.lastfm.username;
      const stats = historyStats(username);

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, stats);
        return;
      }

      ui.page("Local history", `@${username}`);
      if (stats.entries === 0) {
        ui.hint("No local history yet. Run `tsfm history sync --all` first.");
        return;
      }
      ui.section("Summary", [
        `  ${ui.theme.label("Entries  ")}${formatWithCommas(stats.entries)}`,
        `  ${ui.theme.label("Oldest   ")}${new Date(stats.oldest! * 1000).toISOString().slice(0, 10)}`,
        `  ${ui.theme.label("Newest   ")}${new Date(stats.newest! * 1000).toISOString().slice(0, 10)}`,
        `  ${ui.theme.label("File     ")}${stats.path}`,
      ]);
      return;
    }

    if (subcommand === "sync") {
      requireOnline("Syncing history");

      const { values } = parseArgs({
        args: rest,
        options: {
          user: { type: "string" },
          all: { type: "boolean" },
          pages: { type: "string" },
        },
        strict: false,
      });

      const username = (values.user as string) ?? ctx.config.lastfm.username;
      const fetchAll = Boolean(values.all);

      let maxPages = fetchAll ? Number.POSITIVE_INFINITY : DEFAULT_MAX_PAGES;
      if (values.pages) {
        const parsed = Number(values.pages);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          throw new UsageError("--pages must be a positive integer.");
        }
        maxPages = parsed;
      }

      const showProgress =
        ctx.options.output === "pretty" && !ctx.options.quiet;

      if (showProgress) {
        console.log();
        console.log(
          `${ui.theme.accent("◆")} ${ui.theme.bold("TSFM")} ${ui.theme.dim("/ ")}${ui.theme.heading("HISTORY SYNC")}`,
        );
        console.log(
          ui.theme.dim(
            fetchAll
              ? `Fetching your entire Last.fm history for @${username}. This can take a while for large libraries.`
              : `Syncing recent plays for @${username}.`,
          ),
        );
        console.log();
      }

      let page = 1;
      let totalPages = 1;
      let totalFetched = 0;
      let totalStored = 0;
      let caughtUp = false;

      while (page <= maxPages && page <= totalPages && !caughtUp) {
        const recent = await LastFMClient.user.getRecentTracks(
          username,
          PAGE_SIZE,
          { page },
        );

        const attr = (recent as { "@attr"?: { totalPages?: string } })["@attr"];
        totalPages = Number(attr?.totalPages ?? 1) || 1;

        if (recent.track.length === 0) break;

        const entries: HistoryEntry[] = [];
        for (const t of recent.track) {
          if (t["@attr"]?.nowplaying === "true") continue;

          const playedAt = Number(
            (t.date as { uts?: string } | undefined)?.uts,
          );
          if (!playedAt) continue;

          entries.push({
            artist: t.artist["#text"],
            track: t.name,
            album: t.album?.["#text"] ?? "",
            playedAt,
            url: t.url,
          });
        }

        totalFetched += entries.length;
        const stored = appendHistory(username, entries);
        totalStored += stored;

        if (!fetchAll && stored === 0 && page > 1) {
          caughtUp = true;
        }

        if (
          showProgress &&
          (page === 1 || page % 10 === 0 || page === totalPages)
        ) {
          console.log(
            ui.theme.dim(
              `  page ${formatWithCommas(page)}/${formatWithCommas(totalPages)}  ·  ${formatWithCommas(totalStored)} new plays stored`,
            ),
          );
        }

        page++;

        if (page <= maxPages && page <= totalPages && !caughtUp) {
          await sleep(PAGE_DELAY_MS);
        }
      }

      const result = {
        pagesFetched: page - 1,
        totalPages,
        totalFetched,
        totalStored,
        complete: page > totalPages,
      };

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, result);
        return;
      }

      if (showProgress) console.log();
      console.log(
        `${ui.theme.success("✔")} Synced ${formatWithCommas(result.totalStored)} new plays (checked ${formatWithCommas(result.totalFetched)} across ${formatWithCommas(result.pagesFetched)} pages).`,
      );
      if (!result.complete) {
        console.log(
          ui.theme.dim(
            `Stopped at page ${formatWithCommas(result.pagesFetched)} of ${formatWithCommas(result.totalPages)}. Run again with --all to keep going, or --pages <n> for a specific number.`,
          ),
        );
      }
      console.log(ui.theme.dim(`Stored at ${getHistoryFilePath(username)}`));
      return;
    }

    throw new UsageError(
      "Usage: tsfm history <sync|stats> [--user <name>] [--all] [--pages <n>]",
    );
  },
};
