import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { formatWithCommas } from "@/libs/numbers";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import type { TimePeriod } from "@/api/types/top";
import { buildStats } from "@/libs/build-stats";

const PERIODS = ["7day", "1month", "12month", "overall"] as const;
type StatsPeriod = (typeof PERIODS)[number];

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  "7day": "last 7 days",
  "1month": "last month",
  "12month": "last year",
  overall: "all time",
};

const PERIOD_ALIASES: Record<string, StatsPeriod> = {
  week: "7day",
  "7days": "7day",
  month: "1month",
  "1months": "1month",
  year: "12month",
  "12months": "12month",
  all: "overall",
  alltime: "overall",
  "all-time": "overall",
};

export const statsCommand: Command = {
  name: "stats",
  description: "Show top artists, tracks, and albums",
  aliases: ["s"],
  usage: "tsfm stats [--user <name>] [--period <period>] [--limit <n>]",
  flags: [
    {
      flag: "--user <name>",
      description: "Last.fm username (defaults to your configured username)",
    },
    {
      flag: "--period <period>",
      description:
        "7day, 1month, 12month, or overall (aliases: week, month, year, all) (default: 7day)",
    },
    { flag: "--limit <n>", description: "Items per list, 1-50 (default: 10)" },
  ],
  async run(ctx) {
    requireConfig(ctx.config);

    const { values } = parseArgs({
      args: ctx.args,
      options: {
        user: { type: "string" },
        period: { type: "string" },
        limit: { type: "string" },
      },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;
    const rawPeriod = ((values.period as string) ?? "7day").toLowerCase();
    const period = (PERIOD_ALIASES[rawPeriod] ?? rawPeriod) as StatsPeriod;
    const limit = Number((values.limit as string) ?? "10");

    if (!(PERIODS as readonly string[]).includes(period)) {
      throw new UsageError(`--period must be one of: ${PERIODS.join(", ")}`);
    }
    if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
      throw new UsageError("--limit must be a whole number from 1 to 50");
    }

    const ui = createUi(ctx.options);
    const result = await ui.spinner(`Building statistics for ${username}`, () =>
      buildStats(username, period as TimePeriod, limit),
    );

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, result);
      return;
    }

    ui.page("Listening statistics", `@${username}  ·  ${result.periodLabel}`);
    ui.section("Overview", [
      `  ${ui.theme.label("All-time plays ")}${formatWithCommas(String(result.overallPlayCount))}`,
      `  ${ui.theme.label("Unique artists ")}${formatWithCommas(String(result.library.uniqueArtists))}`,
      `  ${ui.theme.label("Unique tracks  ")}${formatWithCommas(String(result.library.uniqueTracks))}`,
      `  ${ui.theme.label("Unique albums  ")}${formatWithCommas(String(result.library.uniqueAlbums))}`,
      ...(result.library.memberSince
        ? [
            `  ${ui.theme.label("Scrobbling since")}${result.library.memberSince}`,
          ]
        : []),
      `  ${ui.theme.label("Top artist share")}${(result.topArtistShare * 100).toFixed(1)}% of all-time plays`,
      `  ${ui.theme.label(`Top ${result.topTracks.length} tracks`)}${formatWithCommas(String(result.topTrackPlayCount))} plays`,
    ]);
    ui.tables([
      {
        columns: [
          { key: "rank", header: "#", align: "right", minWidth: 2 },
          { key: "name", header: "Top artists", minWidth: 24 },
          { key: "playCount", header: "Plays", align: "right", minWidth: 8 },
        ],
        rows: result.topArtists.map((artist) => ({
          ...artist,
          rank: String(artist.rank),
        })),
      },
      {
        columns: [
          { key: "rank", header: "#", align: "right", minWidth: 2 },
          { key: "name", header: "Top tracks", minWidth: 20 },
          { key: "artist", header: "Artist", minWidth: 16 },
          { key: "playCount", header: "Plays", align: "right", minWidth: 8 },
        ],
        rows: result.topTracks.map((track) => ({
          ...track,
          rank: String(track.rank),
        })),
      },
      {
        columns: [
          { key: "rank", header: "#", align: "right", minWidth: 2 },
          { key: "name", header: "Top albums", minWidth: 20 },
          { key: "artist", header: "Artist", minWidth: 16 },
          { key: "playCount", header: "Plays", align: "right", minWidth: 8 },
        ],
        rows: result.topAlbums.map((album) => ({
          ...album,
          rank: String(album.rank),
        })),
      },
    ]);
    ui.blank();
  },
};
