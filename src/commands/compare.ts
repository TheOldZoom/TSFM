import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import type { TimePeriod } from "@/api/types/top";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";

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

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let shared = 0;
  for (const item of a) if (b.has(item)) shared++;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

function trackArtistName(t: {
  artist: { name?: string; ["#text"]?: string };
}): string {
  return t.artist.name ?? t.artist["#text"] ?? "";
}

export const compareCommand: Command = {
  name: "compare",
  description: "Compare listening habits with another Last.fm user",
  aliases: ["cmp", "vs"],
  usage: "tsfm compare <username> [--period <period>] [--limit <n>]",
  flags: [
    {
      flag: "--period <period>",
      description:
        "overall, 7day, 1month, 3month, 6month, or 12month (default: overall)",
    },
    {
      flag: "--limit <n>",
      description: "Top items considered per category, 1-200 (default: 50)",
    },
  ],
  async run(ctx) {
    requireConfig(ctx.config);

    let [otherUser, ...rest] = ctx.args;

    if (!otherUser) {
      if (ctx.options.output === "pretty" && process.stdout.isTTY) {
        const answer = await p.text({
          message: "Compare with which Last.fm username?",
          validate(value) {
            if (!value) return "A username is required.";
          },
        });
        if (p.isCancel(answer)) {
          p.cancel("Cancelled.");
          return;
        }
        otherUser = answer;
      } else {
        throw new UsageError(
          "Usage: tsfm compare <username> [--period <period>] [--limit <n>]",
        );
      }
    }

    const { values } = parseArgs({
      args: rest,
      options: {
        period: { type: "string" },
        limit: { type: "string" },
      },
      strict: false,
    });

    const periodRaw = (values.period as string) ?? "overall";
    const limit = Number((values.limit as string) ?? "50");

    if (!isValidPeriod(periodRaw)) {
      throw new UsageError(
        `--period must be one of: ${VALID_PERIODS.join(", ")}`,
      );
    }
    if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
      throw new UsageError("--limit must be a whole number from 1 to 200");
    }

    const me = ctx.config.lastfm.username!;
    const ui = createUi(ctx.options);

    const result = await ui.spinner(
      `Comparing @${me} with @${otherUser}`,
      async () => {
        const [
          myArtists,
          theirArtists,
          myTracks,
          theirTracks,
          myAlbums,
          theirAlbums,
        ] = await Promise.all([
          LastFMClient.user.getTopArtists(me, periodRaw, limit),
          LastFMClient.user.getTopArtists(otherUser, periodRaw, limit),
          LastFMClient.user.getTopTracks(me, periodRaw, limit),
          LastFMClient.user.getTopTracks(otherUser, periodRaw, limit),
          LastFMClient.user.getTopAlbums(me, periodRaw, limit),
          LastFMClient.user.getTopAlbums(otherUser, periodRaw, limit),
        ]);

        const myArtistNames = new Map(
          myArtists.map((a) => [a.name.toLowerCase(), a.name]),
        );
        const theirArtistKeys = new Set(
          theirArtists.map((a) => a.name.toLowerCase()),
        );
        const sharedArtists = [...myArtistNames.entries()]
          .filter(([key]) => theirArtistKeys.has(key))
          .map(([, name]) => name);

        const trackKey = (
          t: Parameters<typeof trackArtistName>[0] & { name: string },
        ) => `${trackArtistName(t).toLowerCase()}\u0000${t.name.toLowerCase()}`;

        const myTrackKeys = new Set(myTracks.map(trackKey));
        const theirTrackKeys = new Set(theirTracks.map(trackKey));
        const sharedTracks = myTracks
          .filter((t) => theirTrackKeys.has(trackKey(t)))
          .map((t) => ({ name: t.name, artist: trackArtistName(t) }));

        const albumKey = (a: { name: string; artist: { name: string } }) =>
          `${a.artist.name.toLowerCase()}\u0000${a.name.toLowerCase()}`;
        const myAlbumKeys = new Set(myAlbums.map(albumKey));
        const theirAlbumKeys = new Set(theirAlbums.map(albumKey));
        const sharedAlbums = myAlbums
          .filter((a) => theirAlbumKeys.has(albumKey(a)))
          .map((a) => ({ name: a.name, artist: a.artist.name }));

        const artistSimilarity = jaccard(
          new Set(myArtistNames.keys()),
          theirArtistKeys,
        );
        const trackSimilarity = jaccard(myTrackKeys, theirTrackKeys);
        const albumSimilarity = jaccard(myAlbumKeys, theirAlbumKeys);
        const overallSimilarity =
          (artistSimilarity + trackSimilarity + albumSimilarity) / 3;

        return {
          users: { me, other: otherUser },
          period: periodRaw,
          similarity: {
            artists: artistSimilarity,
            tracks: trackSimilarity,
            albums: albumSimilarity,
            overall: overallSimilarity,
          },
          sharedArtists,
          sharedTracks,
          sharedAlbums,
        };
      },
    );

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, result);
      return;
    }

    ui.page("Compare", `@${me}  vs  @${otherUser}  ·  ${periodRaw}`);
    ui.section("Similarity", [
      `  ${ui.theme.label("Overall     ")}${(result.similarity.overall * 100).toFixed(1)}%`,
      `  ${ui.theme.label("Artists     ")}${(result.similarity.artists * 100).toFixed(1)}%`,
      `  ${ui.theme.label("Tracks      ")}${(result.similarity.tracks * 100).toFixed(1)}%`,
      `  ${ui.theme.label("Albums      ")}${(result.similarity.albums * 100).toFixed(1)}%`,
    ]);

    if (result.sharedArtists.length === 0) {
      ui.hint("No shared top artists in this period.");
    } else {
      ui.section(
        `Shared artists (${result.sharedArtists.length})`,
        result.sharedArtists.slice(0, 25).map((name) => `  ${name}`),
      );
    }

    if (result.sharedTracks.length > 0) {
      ui.section(
        `Shared tracks (${result.sharedTracks.length})`,
        result.sharedTracks
          .slice(0, 25)
          .map((t) => `  ${t.name} — ${t.artist}`),
      );
    }

    if (result.sharedAlbums.length > 0) {
      ui.section(
        `Shared albums (${result.sharedAlbums.length})`,
        result.sharedAlbums
          .slice(0, 25)
          .map((a) => `  ${a.name} — ${a.artist}`),
      );
    }

    ui.blank();
  },
};
