import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { formatWithCommas } from "@/libs/numbers";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import type { TimePeriod } from "@/api/types/top";
import type { LastFMTrack } from "@/api/types/track";

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

const SPARK_BLOCKS = "▁▂▃▄▅▆▇█";
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function hourlySparkline(hours: { hour: number; plays: number }[]): string {
  const max = Math.max(1, ...hours.map((entry) => entry.plays));
  return hours
    .map((entry) => {
      const level = Math.round((entry.plays / max) * (SPARK_BLOCKS.length - 1));
      return SPARK_BLOCKS[level];
    })
    .join("");
}

function peakHour(hours: { hour: number; plays: number }[]): {
  hour: number;
  plays: number;
} {
  return hours.reduce(
    (max, entry) => (entry.plays > max.plays ? entry : max),
    hours[0]!,
  );
}

function periodStart(period: StatsPeriod): number | undefined {
  const now = new Date();
  if (period === "overall") return undefined;
  const days = period === "7day" ? 7 : period === "1month" ? 30 : 365;
  return Math.floor((now.getTime() - days * 86_400_000) / 1_000);
}

function activityBuckets(tracks: { date?: { uts: string } }[]) {
  const days = new Map<string, number>();
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, plays: 0 }));
  const weekdays = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    plays: 0,
  }));

  for (const track of tracks) {
    if (!track.date?.uts) continue;
    const date = new Date(Number(track.date.uts) * 1_000);
    const day = date.toISOString().slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + 1);
    hours[date.getHours()]!.plays++;
    weekdays[date.getDay()]!.plays++;
  }

  return {
    byDay: [...days.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([day, plays]) => ({ day, plays })),
    byHour: hours,
    byWeekday: weekdays,
    trend: listeningTrend(days),
  };
}

function listeningTrend(days: Map<string, number>) {
  const values = [...days.entries()].sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const midpoint = Math.ceil(values.length / 2);
  const first = values
    .slice(0, midpoint)
    .reduce((total, [, plays]) => total + plays, 0);
  const second = values
    .slice(midpoint)
    .reduce((total, [, plays]) => total + plays, 0);
  const direction = second > first ? "up" : second < first ? "down" : "steady";
  return { direction, firstHalfPlays: first, secondHalfPlays: second };
}

function formatDuration(milliseconds: number): string {
  const minutes = Math.round(milliseconds / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

async function getActivitySample(
  username: string,
  sample: number,
  from: number | undefined,
): Promise<LastFMTrack[]> {
  const tracks: LastFMTrack[] = [];
  const pageSize = 200;

  for (let page = 1; tracks.length < sample; page++) {
    const count = Math.min(pageSize, sample - tracks.length);
    const recent = await LastFMClient.user.getRecentTracks(username, count, {
      from,
      page,
    });
    tracks.push(...recent.track.filter((track) => track.date));

    // Compare against what we actually asked for on this page, not the
    // fixed page size — once `sample` is nearly filled, `count` drops
    // below `pageSize` and the API legitimately returns fewer than
    // `pageSize` results even when more history is available.
    if (
      recent.track.length < count ||
      page >= Number(recent["@attr"].totalPages)
    ) {
      break;
    }
  }

  return tracks.slice(0, sample);
}

export const statsCommand: Command = {
  name: "stats",
  description: "Show listening statistics and activity",
  async run(ctx) {
    requireConfig(ctx.config);

    const { values } = parseArgs({
      args: ctx.args,
      options: {
        user: { type: "string" },
        period: { type: "string" },
        limit: { type: "string" },
        sample: { type: "string" },
      },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;
    const rawPeriod = ((values.period as string) ?? "7day").toLowerCase();
    const period = (PERIOD_ALIASES[rawPeriod] ?? rawPeriod) as StatsPeriod;
    const limit = Number((values.limit as string) ?? "10");
    const sample = Number((values.sample as string) ?? "200");

    if (!(PERIODS as readonly string[]).includes(period)) {
      throw new UsageError(`--period must be one of: ${PERIODS.join(", ")}`);
    }
    if (!Number.isInteger(limit) || limit <= 0 || limit > 50) {
      throw new UsageError("--limit must be a whole number from 1 to 50");
    }
    if (!Number.isInteger(sample) || sample <= 0 || sample > 1_000) {
      throw new UsageError("--sample must be a whole number from 1 to 1000");
    }

    const ui = createUi(ctx.options);
    const result = await ui.spinner(
      `Building statistics for ${username}`,
      async () => {
        const from = periodStart(period);
        const [profile, artists, tracks, albums, recent] = await Promise.all([
          LastFMClient.user.getInfo(username),
          LastFMClient.user.getTopArtists(
            username,
            period as TimePeriod,
            limit,
          ),
          LastFMClient.user.getTopTracks(username, period as TimePeriod, limit),
          LastFMClient.user.getTopAlbums(username, period as TimePeriod, limit),
          getActivitySample(username, sample, from),
        ]);

        const activity = activityBuckets(recent);
        const sampledPlayCount = recent.length;
        const overallPlayCount = Number(profile.playcount || 0);
        const topTrackPlays = tracks.reduce(
          (total, track) => total + Number(track.playcount || 0),
          0,
        );

        // getInfo also returns library-wide totals (distinct from the
        // period-scoped top lists above) — surface them since they're
        // otherwise fetched and discarded.
        const profileExtra = profile as {
          artist_count?: string;
          track_count?: string;
          album_count?: string;
          registered?: { unixtime?: string };
        };
        const registeredUnix = Number(profileExtra.registered?.unixtime || 0);

        const topArtistPlayCount = Number(artists[0]?.playcount || 0);
        const topArtistShare =
          overallPlayCount > 0 ? topArtistPlayCount / overallPlayCount : 0;

        const durations = await Promise.all(
          tracks.map(async (track) => {
            try {
              // getTopTracks returns artist.name (not artist['#text'] — that
              // shape only applies to getRecentTracks results). Using the
              // wrong field sent literal "artist=undefined" to track.getInfo,
              // which is what caused almost every "Track not found" error.
              const mbid = (track as { mbid?: string }).mbid;
              const info = await LastFMClient.track.getInfo({
                artist: track.artist.name,
                track: track.name,
                ...(mbid ? { mbid } : {}),
              });
              return Number(info.duration || 0) * Number(track.playcount || 0);
            } catch {
              return 0;
            }
          }),
        );

        return {
          user: username,
          period,
          periodLabel: PERIOD_LABELS[period],
          overallPlayCount,
          sampledPlayCount,
          sampleLimit: sample,
          topTrackPlayCount: topTrackPlays,
          topTrackListeningTimeMs: durations.reduce(
            (total, duration) => total + duration,
            0,
          ),
          topArtistShare,
          library: {
            uniqueArtists: Number(profileExtra.artist_count || 0),
            uniqueTracks: Number(profileExtra.track_count || 0),
            uniqueAlbums: Number(profileExtra.album_count || 0),
            memberSince: registeredUnix
              ? new Date(registeredUnix * 1_000).toISOString().slice(0, 10)
              : undefined,
          },
          topArtists: artists.map((artist, index) => ({
            rank: index + 1,
            name: artist.name,
            playCount: artist.playcount,
          })),
          topTracks: tracks.map((track, index) => ({
            rank: index + 1,
            name: track.name,
            artist: track.artist.name,
            playCount: track.playcount,
          })),
          topAlbums: albums.map((album, index) => ({
            rank: index + 1,
            name: album.name,
            artist: album.artist.name,
            playCount: album.playcount,
          })),
          activity,
        };
      },
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
      `  ${ui.theme.label(`Top ${result.topTracks.length} tracks`)}${formatWithCommas(String(result.topTrackPlayCount))} plays, ${formatDuration(result.topTrackListeningTimeMs)} of listening time`,
      `  ${ui.theme.label("Recent sample  ")}${formatWithCommas(String(result.sampledPlayCount))} of ${formatWithCommas(String(result.overallPlayCount))} plays (most recent scrobbles — trend/hour/day below are scoped to this window, not "${result.periodLabel}")`,
      `  ${ui.theme.label("Trend          ")}${result.activity.trend.direction} (within the recent sample)`,
    ]);
    ui.table(
      [
        { key: "rank", header: "#", align: "right", minWidth: 2 },
        { key: "name", header: "Top artists", minWidth: 24 },
        { key: "playCount", header: "Plays", align: "right", minWidth: 8 },
      ],
      result.topArtists.map((artist) => ({
        ...artist,
        rank: String(artist.rank),
      })),
    );
    ui.blank();
    ui.table(
      [
        { key: "rank", header: "#", align: "right", minWidth: 2 },
        { key: "name", header: "Top tracks", minWidth: 20 },
        { key: "artist", header: "Artist", minWidth: 16 },
        { key: "playCount", header: "Plays", align: "right", minWidth: 8 },
      ],
      result.topTracks.map((track) => ({ ...track, rank: String(track.rank) })),
    );
    ui.blank();
    ui.table(
      [
        { key: "rank", header: "#", align: "right", minWidth: 2 },
        { key: "name", header: "Top albums", minWidth: 20 },
        { key: "artist", header: "Artist", minWidth: 16 },
        { key: "playCount", header: "Plays", align: "right", minWidth: 8 },
      ],
      result.topAlbums.map((album) => ({ ...album, rank: String(album.rank) })),
    );
    ui.blank();
    ui.table(
      [
        { key: "day", header: "Day", minWidth: 10 },
        { key: "plays", header: "Plays", align: "right", minWidth: 8 },
      ],
      result.activity.byDay.map((day) => ({
        day: day.day,
        plays: String(day.plays),
      })),
    );
    ui.blank();
    ui.table(
      [
        { key: "weekday", header: "Day of week", minWidth: 12 },
        { key: "plays", header: "Plays", align: "right", minWidth: 8 },
      ],
      result.activity.byWeekday.map((entry) => ({
        weekday: WEEKDAY_LABELS[entry.weekday]!,
        plays: String(entry.plays),
      })),
    );
    ui.blank();
    const peak = peakHour(result.activity.byHour);
    ui.section("Activity by hour (00–23, local time)", [
      `  ${hourlySparkline(result.activity.byHour)}`,
      `  ${ui.theme.label("Peak hour     ")}${String(peak.hour).padStart(2, "0")}:00 (${formatWithCommas(String(peak.plays))} plays)`,
    ]);
    ui.blank();
  },
};
