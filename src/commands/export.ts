import { parseArgs } from "node:util";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import * as p from "@clack/prompts";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { suggestClosest, didYouMean } from "@/libs/suggest";
import { createUi } from "@/ui";
import { toCsv } from "@/output";
import { readHistory } from "@/history/store";
import { buildStats } from "@/libs/build-stats";
import type { TimePeriod } from "@/api/types/top";

type ExportFormat = "json" | "csv" | "m3u";
type ExportKind =
  | "history"
  | "stats"
  | "top-artists"
  | "top-tracks"
  | "top-albums";

const EXPORT_KINDS: readonly ExportKind[] = [
  "history",
  "stats",
  "top-artists",
  "top-tracks",
  "top-albums",
];

function isExportFormat(v: string): v is ExportFormat {
  return v === "json" || v === "csv" || v === "m3u";
}
function isExportKind(v: string): v is ExportKind {
  return [
    "history",
    "stats",
    "top-artists",
    "top-tracks",
    "top-albums",
  ].includes(v);
}

function toM3u(tracks: { artist: string; name: string }[]): string {
  const lines = ["#EXTM3U"];
  for (const t of tracks) {
    lines.push(`#EXTINF:-1,${t.artist} - ${t.name}`);
    lines.push(`${t.artist} - ${t.name}`);
  }
  return lines.join("\n") + "\n";
}

function writeToFile(path: string, content: string): void {
  const dir = dirname(path);
  if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, content, "utf-8");
}

export const exportCommand: Command = {
  name: "export",
  description: "Export history, stats, or top lists to JSON, CSV, or M3U",
  aliases: ["exp"],
  usage:
    "tsfm export <history|stats|top-artists|top-tracks|top-albums> --format <json|csv|m3u> --output <path>",
  flags: [
    {
      flag: "--format <json|csv|m3u>",
      description:
        "Output format; m3u only applies to track-based exports (default: json)",
    },
    {
      flag: "--output <path>",
      description: "File path to write to (required)",
    },
    {
      flag: "--user <name>",
      description: "Last.fm username (defaults to your configured username)",
    },
    {
      flag: "--period <period>",
      description:
        "overall, 7day, 1month, 3month, 6month, or 12month (default: overall)",
    },
    {
      flag: "--limit <n>",
      description: "Number of items to export (default: 50)",
    },
  ],
  async run(ctx) {
    requireConfig(ctx.config);

    let [kindRaw, ...rest] = ctx.args;

    if (!kindRaw) {
      if (ctx.options.output === "pretty" && process.stdout.isTTY) {
        const answer = await p.select({
          message: "What would you like to export?",
          options: [
            {
              value: "history",
              label: "History",
              hint: "your locally synced plays",
            },
            { value: "stats", label: "Stats" },
            { value: "top-artists", label: "Top artists" },
            { value: "top-tracks", label: "Top tracks" },
            { value: "top-albums", label: "Top albums" },
          ],
        });
        if (p.isCancel(answer)) {
          p.cancel("Cancelled.");
          return;
        }
        kindRaw = answer as ExportKind;
      } else {
        throw new UsageError(
          "Usage: tsfm export <history|stats|top-artists|top-tracks|top-albums> --format <json|csv|m3u> --output <path>",
        );
      }
    } else if (!isExportKind(kindRaw)) {
      const hint = didYouMean(suggestClosest(kindRaw, EXPORT_KINDS, 4));
      throw new UsageError(
        `Unknown export type "${kindRaw}". ${hint || `Must be one of: ${EXPORT_KINDS.join(", ")}.`}`,
      );
    }

    const { values } = parseArgs({
      args: rest,
      options: {
        format: { type: "string" },
        output: { type: "string" },
        user: { type: "string" },
        period: { type: "string" },
        limit: { type: "string" },
      },
      strict: false,
    });

    const formatRaw = (values.format as string) ?? "json";
    if (!isExportFormat(formatRaw)) {
      throw new UsageError("--format must be one of: json, csv, m3u");
    }

    let output = values.output as string | undefined;
    if (!output) {
      if (ctx.options.output === "pretty" && process.stdout.isTTY) {
        const defaultPath = `./tsfm-${kindRaw}.${formatRaw}`;
        const answer = await p.text({
          message: "Save the export to which file?",
          placeholder: defaultPath,
          defaultValue: defaultPath,
        });
        if (p.isCancel(answer)) {
          p.cancel("Cancelled.");
          return;
        }
        output = answer;
      } else {
        throw new UsageError("--output <path> is required.");
      }
    }

    const username = (values.user as string) ?? ctx.config.lastfm.username;
    const period = ((values.period as string) ?? "overall") as TimePeriod;
    const limit = Number((values.limit as string) ?? "50");

    const ui = createUi(ctx.options);

    const content = await ui.spinner(
      `Preparing ${kindRaw} export`,
      async () => {
        if (kindRaw === "history") {
          const entries = readHistory(username);
          if (formatRaw === "m3u")
            return toM3u(
              entries.map((e) => ({ artist: e.artist, name: e.track })),
            );
          if (formatRaw === "csv") return toCsv(entries);
          return JSON.stringify(entries, null, 2);
        }

        if (kindRaw === "stats") {
          if (formatRaw === "m3u") {
            throw new UsageError(
              "M3U export isn't available for stats — use json or csv.",
            );
          }
          const stats = await buildStats(username, period, limit);
          return formatRaw === "csv"
            ? toCsv(stats.topTracks)
            : JSON.stringify(stats, null, 2);
        }

        if (kindRaw === "top-artists") {
          const artists = await LastFMClient.user.getTopArtists(
            username,
            period,
            limit,
          );
          const rows = artists.map((a, i) => ({
            rank: i + 1,
            name: a.name,
            playCount: a.playcount,
            url: a.url,
          }));
          if (formatRaw === "m3u")
            throw new UsageError(
              "M3U export needs tracks — use top-tracks instead.",
            );
          return formatRaw === "csv"
            ? toCsv(rows)
            : JSON.stringify(rows, null, 2);
        }

        if (kindRaw === "top-tracks") {
          const tracks = await LastFMClient.user.getTopTracks(
            username,
            period,
            limit,
          );
          const rows = tracks.map((t, i) => ({
            rank: i + 1,
            name: t.name,
            artist: t.artist.name ?? t.artist["#text"],
            playCount: t.playcount,
            url: t.url,
          }));
          if (formatRaw === "m3u")
            return toM3u(rows.map((r) => ({ artist: r.artist, name: r.name })));
          return formatRaw === "csv"
            ? toCsv(rows)
            : JSON.stringify(rows, null, 2);
        }

        const albums = await LastFMClient.user.getTopAlbums(
          username,
          period,
          limit,
        );
        const rows = albums.map((a, i) => ({
          rank: i + 1,
          name: a.name,
          artist: a.artist.name,
          playCount: a.playcount,
          url: a.url,
        }));
        if (formatRaw === "m3u")
          throw new UsageError(
            "M3U export needs tracks — use top-tracks instead.",
          );
        return formatRaw === "csv"
          ? toCsv(rows)
          : JSON.stringify(rows, null, 2);
      },
    );

    writeToFile(output, content);
    console.log(`${ui.theme.success("✔")} Exported ${kindRaw} to ${output}`);
  },
};
