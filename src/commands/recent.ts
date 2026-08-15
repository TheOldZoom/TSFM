import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import {
  applyEnrichedPlays,
  enrichTrackUserPlays,
} from "@/api/enrich";
import { requireConfig } from "@/config";
import { UsageError } from "@/libs/errors";
import { createUi } from "@/ui";
import {
  printLines,
  renderTrackLines,
  shouldRenderImages,
  shouldUseNativeImages,
} from "@/ui/render-track";

export const recentCommand: Command = {
  name: "recent",
  description: "Show recently played tracks",
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
        const recent = await LastFMClient.user.getRecentTracks(username, limit);
        const enrichedPlays = await enrichTrackUserPlays(username, recent.track);
        return { tracks: recent.track, plays: enrichedPlays };
      },
    );

    if (tracks.length === 0) {
      ui.hint(`No recent tracks found for ${username}.`);
      return;
    }

    const images = shouldRenderImages(ctx.options);
    const nativeImages = shouldUseNativeImages(ctx.options);
    const imageOptions = ctx.config.appearance;

    ui.page("Recent tracks", `@${username}  ·  ${tracks.length} latest plays`);

    for (const [index, track] of tracks.entries()) {
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
