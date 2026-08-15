import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import type { TimePeriod } from "@/api/types/top";

const VALID_PERIODS = [
  "overall",
  "7day",
  "1month",
  "3month",
  "6month",
  "12month",
] as const;

function isValidPeriod(value: string): value is TimePeriod {
  return (VALID_PERIODS as readonly string[]).includes(value);
}

export const topCommand: Command = {
  name: "top",
  description: "Show top artists, tracks, or albums",
  async run(ctx) {
    requireConfig(ctx.config);

    const [subcommand, ...rest] = ctx.args;

    if (!subcommand || !["artists", "tracks", "albums"].includes(subcommand)) {
      throw new UsageError(
        "Usage: tsfm top <artists|tracks|albums> [--period <period>] [--limit <n>] [--user <name>]",
      );
    }

    const { values } = parseArgs({
      args: rest,
      options: {
        user: { type: "string" },
        limit: { type: "string" },
        period: { type: "string" },
      },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;
    const limit = Number((values.limit as string) ?? "10");
    const periodRaw = (values.period as string) ?? "overall";

    if (!Number.isInteger(limit) || limit <= 0) {
      throw new UsageError(
        `--limit must be a positive integer, got "${values.limit}"`,
      );
    }

    if (!isValidPeriod(periodRaw)) {
      throw new UsageError(
        `--period must be one of: ${VALID_PERIODS.join(", ")} (got "${periodRaw}")`,
      );
    }

    if (subcommand === "artists") {
      const artists = await LastFMClient.user.getTopArtists(
        username,
        periodRaw,
        limit,
      );
      artists.forEach((a, i) =>
        console.log(`${i + 1}. ${a.name} — ${a.playcount} plays`),
      );
    } else if (subcommand === "tracks") {
      const tracks = await LastFMClient.user.getTopTracks(
        username,
        periodRaw,
        limit,
      );
      tracks.forEach((t, i) =>
        console.log(
          `${i + 1}. ${t.name} — ${t.artist["#text"]} (${t.playcount} plays)`,
        ),
      );
    } else {
      const albums = await LastFMClient.user.getTopAlbums(
        username,
        periodRaw,
        limit,
      );
      albums.forEach((al, i) =>
        console.log(
          `${i + 1}. ${al.name} — ${al.artist.name} (${al.playcount} plays)`,
        ),
      );
    }
  },
};
