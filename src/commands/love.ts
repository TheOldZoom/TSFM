import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { loadConfig, requireSession } from "@/config";
import { createUi, icons } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import { resolveTrack, sourceLabel } from "@/libs/resolve-track";
import { requireOnline } from "@/cache/context";

export const loveCommand: Command = {
  name: "love",
  description: "Love a track (defaults to now playing, or your last played)",
  aliases: ["l"],
  usage: 'tsfm love [--artist "<artist>" --track "<track>"]',
  flags: [
    {
      flag: '--artist "<artist>"',
      description:
        "Artist name (or first positional arg); defaults to your current/last played track",
    },
    {
      flag: '--track "<track>"',
      description: "Track name (or remaining positional args)",
    },
  ],
  async run(ctx) {
    requireOnline("Loving a track");

    const config = loadConfig();
    requireSession(config);

    const { values, positionals } = parseArgs({
      args: ctx.args,
      options: {
        artist: { type: "string" },
        track: { type: "string" },
      },
      allowPositionals: true,
      strict: false,
    });

    const artist = (values.artist as string) ?? positionals[0];
    const track =
      ((values.track as string) ?? positionals.slice(1).join(" ")) || undefined;

    const ui = createUi(ctx.options);

    const resolved = await ui.spinner(
      artist && track
        ? `Loving "${track}" by ${artist}`
        : "Loving current track",
      async () => {
        const result = await resolveTrack(config.lastfm.session.username, {
          artist,
          track,
        });
        await LastFMClient.track.love(result.artist, result.track);
        return result;
      },
    );

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, { loved: true, ...resolved });
      return;
    }

    console.log(
      `${ui.theme.success(icons.success)} Loved "${resolved.track}" by ${resolved.artist}.${sourceLabel(resolved.source)}`,
    );
  },
};
