import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { loadConfig, requireSession } from "@/config";
import { createUi, icons } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import { resolveTrack, sourceLabel } from "@/libs/resolve-track";
import { requireOnline } from "@/cache/context";

export const unloveCommand: Command = {
  name: "unlove",
  description: "Unlove a track (defaults to now playing, or your last played)",
  aliases: ["ul"],
  usage: 'tsfm unlove [--artist "<artist>" --track "<track>"]',
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
    requireOnline("Unloving a track");
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
        ? `Unloving "${track}" by ${artist}`
        : "Unloving current track",
      async () => {
        const result = await resolveTrack(config.lastfm.session.username, {
          artist,
          track,
        });
        await LastFMClient.track.unlove(result.artist, result.track);
        return result;
      },
    );

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, { loved: false, ...resolved });
      return;
    }

    console.log(
      `${ui.theme.success(icons.success)} Unloved "${resolved.track}" by ${resolved.artist}.${sourceLabel(resolved.source)}`,
    );
  },
};
