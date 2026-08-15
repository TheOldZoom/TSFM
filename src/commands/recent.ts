import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { applyEnrichedPlays, enrichTrackUserPlays } from "@/api/enrich";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import {
  printLines,
  renderTrackLines,
  shouldRenderImages,
  shouldUseNativeImages,
} from "@/ui/render-track";

export const recentCommand: Command = {
  name: "recent",
  description: "Show recently played tracks",
  aliases: ["r"],
  usage: "tsfm recent [--user <name>] [--limit <n>]",
  flags: [
    {
      flag: "--user <name>",
      description: "Last.fm username (defaults to your configured username)",
    },
    {
      flag: "--limit <n>",
      description: "Number of tracks to show (default: 10)",
    },
  ],
  async run(ctx) {
    requireConfig(ctx.config);

    const ui = createUi(ctx.options);

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

    const { tracks, plays } = await ui.spinner(
      `Fetching recent tracks for ${username}`,
      async () => {
        const recent = await LastFMClient.user.getRecentTracks(
          username,
          limit + 1,
        );

        const enrichedPlays = await enrichTrackUserPlays(
          username,
          recent.track,
        );

        return {
          tracks: recent.track,
          plays: enrichedPlays,
        };
      },
    );

    const nowPlayingTrack = tracks.find(
      (track) => track["@attr"]?.nowplaying === "true",
    );

    const recentTracks = tracks
      .filter((track) => track["@attr"]?.nowplaying !== "true")
      .slice(0, limit);

    const data = [
      ...(nowPlayingTrack
        ? [
            {
              rank: 0,
              name: nowPlayingTrack.name,
              artist: nowPlayingTrack.artist["#text"],
              album: nowPlayingTrack.album?.["#text"] ?? "",
              playedAt: null,
              nowPlaying: true,
              userPlayCount: applyEnrichedPlays(nowPlayingTrack, plays) ?? null,
              url: nowPlayingTrack.url,
            },
          ]
        : []),
      ...recentTracks.map((track, index) => ({
        rank: index + 1,
        name: track.name,
        artist: track.artist["#text"],
        album: track.album?.["#text"] ?? "",
        playedAt: track.date?.["#text"] ?? null,
        nowPlaying: false,
        userPlayCount: applyEnrichedPlays(track, plays) ?? null,
        url: track.url,
      })),
    ];

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, data);
      return;
    }

    if (tracks.length === 0) {
      ui.hint(`No recent tracks found for ${username}.`);
      return;
    }

    const images = shouldRenderImages(ctx.options);
    const nativeImages = shouldUseNativeImages(ctx.options);
    const imageOptions = ctx.config.appearance;

    ui.page(
      "Recent tracks",
      `@${username}  ·  ${recentTracks.length} latest plays`,
    );

    if (nowPlayingTrack) {
      ui.heading("Currently Playing");
      ui.blank();

      const userPlayCount = applyEnrichedPlays(nowPlayingTrack, plays);

      const lines = await renderTrackLines(
        {
          name: nowPlayingTrack.name,
          artist: nowPlayingTrack.artist["#text"],
          album: nowPlayingTrack.album?.["#text"],
          image: nowPlayingTrack.image,
          userPlayCount,
        },
        `▶  ${nowPlayingTrack.name}`,
        ui.theme,
        { ...imageOptions, images, nativeImages },
      );

      printLines(lines);
      ui.blank();

      ui.heading("Recently Played");
      ui.blank();
    }

    for (const [index, track] of recentTracks.entries()) {
      const userPlayCount = applyEnrichedPlays(track, plays);

      const lines = await renderTrackLines(
        {
          name: track.name,
          artist: track.artist["#text"],
          album: track.album?.["#text"],
          image: track.image,
          userPlayCount,
        },
        `#${String(index + 1).padStart(2, "0")}  ${track.name}`,
        ui.theme,
        { ...imageOptions, images, nativeImages },
      );

      printLines(lines);
      ui.blank();
    }
  },
};
