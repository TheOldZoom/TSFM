import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { enrichTrackUserPlays } from "@/api/enrich";
import { requireConfig } from "@/config";
import { createUi, icons } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import {
  printLines,
  renderTrackLines,
  shouldRenderImages,
  shouldUseNativeImages,
} from "@/ui/render-track";

export const nowCommand: Command = {
  name: "now",
  description: "Show currently playing track",
  async run(ctx) {
    requireConfig(ctx.config);

    const ui = createUi(ctx.options);

    const { values } = parseArgs({
      args: ctx.args,
      options: { user: { type: "string" } },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;

    const recent = await ui.spinner(`Fetching now playing for ${username}`, () =>
      LastFMClient.user.getRecentTracks(username, 1),
    );

    const track = recent.track.find(
      (item) => item["@attr"]?.nowplaying === "true",
    );

    if (!track) {
      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, { nowPlaying: null });
        return;
      }
      ui.hint("No track is currently playing.");
      return;
    }

    const plays = await enrichTrackUserPlays(username, [track]);
    const userPlayCount = plays.get(`${track.artist["#text"]}\0${track.name}`);

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, {
        nowPlaying: {
          name: track.name,
          artist: track.artist["#text"],
          album: track.album?.["#text"] ?? "",
          userPlayCount: userPlayCount ?? null,
          url: track.url,
        },
      });
      return;
    }

    ui.page("Now playing", `@${username}`);

    const lines = await renderTrackLines(
      {
        name: track.name,
        artist: track.artist["#text"],
        album: track.album?.["#text"],
        image: track.image,
        userPlayCount,
      },
      `${icons.play}  ${track.name}`,
      ui.theme,
      {
        ...ctx.config.appearance,
        images: shouldRenderImages(ctx.options),
        nativeImages: shouldUseNativeImages(ctx.options),
      },
    );

    printLines(lines);
    ui.blank();
  },
};
