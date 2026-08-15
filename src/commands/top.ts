import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { suggestClosest, didYouMean } from "@/libs/suggest";
import type { TimePeriod } from "@/api/types/top";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import {
  printLines,
  renderTrackLines,
  shouldRenderImages,
  shouldUseNativeImages,
} from "@/ui/render-track";

const TOP_TYPES = ["artists", "tracks", "albums"] as const;
type TopType = (typeof TOP_TYPES)[number];

const VALID_PERIODS = [
  "overall",
  "7day",
  "1month",
  "3month",
  "6month",
  "12month",
] as const;

const PERIOD_LABELS: Record<TimePeriod, string> = {
  overall: "all time",
  "7day": "7 days",
  "1month": "1 month",
  "3month": "3 months",
  "6month": "6 months",
  "12month": "12 months",
};

function isValidPeriod(value: string): value is TimePeriod {
  return (VALID_PERIODS as readonly string[]).includes(value);
}

export const topCommand: Command = {
  name: "top",
  description: "Show top artists, tracks, or albums",
  aliases: ["t"],
  usage:
    "tsfm top <artists|tracks|albums> [--period <period>] [--limit <n>] [--user <name>]",
  flags: [
    {
      flag: "--user <name>",
      description: "Last.fm username (defaults to your configured username)",
    },
    {
      flag: "--limit <n>",
      description: "Number of results to show (default: 10)",
    },
    {
      flag: "--period <period>",
      description:
        "overall, 7day, 1month, 3month, 6month, or 12month (default: overall)",
    },
  ],
  async run(ctx) {
    requireConfig(ctx.config);

    const ui = createUi(ctx.options);

    let [subcommand, ...rest] = ctx.args;

    if (!subcommand) {
      if (ctx.options.output === "pretty" && process.stdout.isTTY) {
        const answer = await p.select({
          message: "Show top...",
          options: [
            { value: "artists", label: "Artists" },
            { value: "tracks", label: "Tracks" },
            { value: "albums", label: "Albums" },
          ],
        });
        if (p.isCancel(answer)) {
          p.cancel("Cancelled.");
          return;
        }
        subcommand = answer;
      } else {
        throw new UsageError(
          "Usage: tsfm top <artists|tracks|albums> [--period <period>] [--limit <n>] [--user <name>]",
        );
      }
    } else if (!(TOP_TYPES as readonly string[]).includes(subcommand)) {
      const hint = didYouMean(suggestClosest(subcommand, TOP_TYPES, 3));
      throw new UsageError(
        `Unknown top type "${subcommand}". ${hint || `Must be one of: ${TOP_TYPES.join(", ")}.`}`,
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

    const periodLabel = PERIOD_LABELS[periodRaw];
    const images = shouldRenderImages(ctx.options);
    const nativeImages = shouldUseNativeImages(ctx.options);
    const imageOptions = ctx.config.appearance;
    const kindLabel =
      subcommand === "artists"
        ? "Artists"
        : subcommand === "tracks"
          ? "Tracks"
          : "Albums";

    if (subcommand === "artists") {
      const artists = await ui.spinner(
        `Fetching top artists for ${username}`,
        () => LastFMClient.user.getTopArtists(username, periodRaw, limit),
      );

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(
          ctx.options.output,
          artists.map((artist, index) => ({
            rank: index + 1,
            name: artist.name,
            playCount: artist.playcount,
            url: artist.url,
          })),
        );
        return;
      }

      ui.page(
        `Top ${kindLabel}`,
        `@${username}  ·  ${periodLabel}  ·  ${artists.length} results`,
      );

      if (images) {
        for (const [index, artist] of artists.entries()) {
          printLines(
            await renderTrackLines(
              {
                name: artist.name,
                artist: "",
                image: artist.image,
                playCount: artist.playcount,
              },
              `#${String(index + 1).padStart(2, "0")}  ${artist.name}`,
              ui.theme,
              { ...imageOptions, images, nativeImages },
            ),
          );
          ui.blank();
        }
        return;
      }

      ui.table(
        [
          { key: "rank", header: "#", align: "right", minWidth: 2 },
          { key: "name", header: "Artist", minWidth: 24 },
          { key: "plays", header: "Plays", align: "right", minWidth: 8 },
        ],
        artists.map((artist, index) => ({
          rank: String(index + 1),
          name: artist.name,
          plays: artist.playcount,
        })),
      );
    } else if (subcommand === "tracks") {
      const tracks = await ui.spinner(
        `Fetching top tracks for ${username}`,
        () => LastFMClient.user.getTopTracks(username, periodRaw, limit),
      );

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(
          ctx.options.output,
          tracks.map((track, index) => ({
            rank: index + 1,
            name: track.name,
            artist: track.artist["#text"],
            playCount: track.playcount,
            url: track.url,
          })),
        );
        return;
      }

      ui.page(
        `Top ${kindLabel}`,
        `@${username}  ·  ${periodLabel}  ·  ${tracks.length} results`,
      );

      if (images) {
        for (const [index, track] of tracks.entries()) {
          printLines(
            await renderTrackLines(
              {
                name: track.name,
                artist: track.artist["#text"],
                image: track.image,
                playCount: track.playcount,
              },
              `#${String(index + 1).padStart(2, "0")}  ${track.name}`,
              ui.theme,
              { ...imageOptions, images, nativeImages },
            ),
          );
          ui.blank();
        }
        return;
      }

      ui.table(
        [
          { key: "rank", header: "#", align: "right", minWidth: 2 },
          { key: "track", header: "Track", minWidth: 20 },
          { key: "artist", header: "Artist", minWidth: 16 },
          { key: "plays", header: "Plays", align: "right", minWidth: 8 },
        ],
        tracks.map((track, index) => ({
          rank: String(index + 1),
          track: track.name,
          artist: track.artist["#text"],
          plays: track.playcount,
        })),
      );
    } else {
      const albums = await ui.spinner(
        `Fetching top albums for ${username}`,
        () => LastFMClient.user.getTopAlbums(username, periodRaw, limit),
      );

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(
          ctx.options.output,
          albums.map((album, index) => ({
            rank: index + 1,
            name: album.name,
            artist: album.artist.name,
            playCount: album.playcount,
            url: album.url,
          })),
        );
        return;
      }

      ui.page(
        `Top ${kindLabel}`,
        `@${username}  ·  ${periodLabel}  ·  ${albums.length} results`,
      );

      if (images) {
        for (const [index, album] of albums.entries()) {
          printLines(
            await renderTrackLines(
              {
                name: album.name,
                artist: album.artist.name,
                image: album.image,
                playCount: album.playcount,
              },
              `#${String(index + 1).padStart(2, "0")}  ${album.name}`,
              ui.theme,
              { ...imageOptions, images, nativeImages },
            ),
          );
          ui.blank();
        }
        return;
      }

      ui.table(
        [
          { key: "rank", header: "#", align: "right", minWidth: 2 },
          { key: "album", header: "Album", minWidth: 20 },
          { key: "artist", header: "Artist", minWidth: 16 },
          { key: "plays", header: "Plays", align: "right", minWidth: 8 },
        ],
        albums.map((album, index) => ({
          rank: String(index + 1),
          album: album.name,
          artist: album.artist.name,
          plays: album.playcount,
        })),
      );
    }

    ui.blank();
  },
};
