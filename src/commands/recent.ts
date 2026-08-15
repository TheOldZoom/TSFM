import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { formatRelativeTime } from "@/libs/time";
import { logger } from "@/libs/logger";

export const recentCommand: Command = {
  name: "recent",
  description: "Show recently played tracks",
  async run(ctx) {
    requireConfig(ctx.config);

    const { values } = parseArgs({
      args: ctx.args,
      options: {
        user: { type: "string" },
        limit: { type: "string" },
      },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;
    const limit = Number((values.limit as string) ?? "10");

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new UsageError(
        `--limit must be a positive integer, got "${values.limit}"`,
      );
    }

    const recent = await LastFMClient.user.getRecentTracks(username, limit);

    if (recent.track.length === 0) {
      logger.info(`No recent tracks found for ${username}.`);
      return;
    }

    for (const track of recent.track) {
      const isNowPlaying = track["@attr"]?.nowplaying === "true";
      const artist = track.artist["#text"];
      const when = isNowPlaying
        ? "now playing"
        : track.date
          ? formatRelativeTime(Number(track.date.uts) * 1000)
          : "unknown time";

      console.log(`- ${track.name} — ${artist} (${when})`);
    }
  },
};
