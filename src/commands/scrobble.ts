import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { loadConfig, requireSession } from "@/config";
import { createUi, icons } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import { resolveTrack, sourceLabel } from "@/libs/resolve-track";
import { requireOnline } from "@/cache/context";

export const scrobbleCommand: Command = {
  name: "scrobble",
  description:
    "Scrobble a track, or update now-playing status (defaults to current track)",
  aliases: ["sb"],
  usage:
    'tsfm scrobble [--artist "<artist>" --track "<track>"] [--album "<album>"] [--playing-now] [-y|--yes]',
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
    { flag: '--album "<album>"', description: "Override the album name" },
    {
      flag: "--playing-now",
      description: "Update now-playing status instead of scrobbling",
    },
    { flag: "-y, --yes", description: "Skip the confirmation prompt" },
  ],
  async run(ctx) {
    requireOnline("Scrobble a track");
    const config = loadConfig();
    requireSession(config);

    const { values, positionals } = parseArgs({
      args: ctx.args,
      options: {
        artist: { type: "string" },
        track: { type: "string" },
        album: { type: "string" },
        yes: { type: "boolean", short: "y" },
        "playing-now": { type: "boolean" },
      },
      allowPositionals: true,
      strict: false,
    });

    const artist = (values.artist as string) ?? positionals[0];
    const track =
      ((values.track as string) ?? positionals.slice(1).join(" ")) || undefined;
    const albumOverride = values.album as string | undefined;
    const playingNow = Boolean(values["playing-now"]);

    const ui = createUi(ctx.options);
    const username = config.lastfm.session.username;

    if (playingNow) {
      const resolved = await ui.spinner(
        "Updating now-playing status",
        async () => {
          const result = await resolveTrack(username, {
            artist,
            track,
            album: albumOverride,
          });
          await LastFMClient.track.updateNowPlaying({
            artist: result.artist,
            track: result.track,
            album: result.album,
          });
          return result;
        },
      );

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, { nowPlayingSet: true, ...resolved });
        return;
      }
      console.log(
        `${ui.theme.success(icons.success)} Now-playing set to "${resolved.track}" by ${resolved.artist}.${sourceLabel(resolved.source)}`,
      );
      return;
    }

    const resolved = await resolveTrack(username, {
      artist,
      track,
      album: albumOverride,
    });

    if (ctx.options.output === "pretty" && !values.yes) {
      const confirmed = await p.confirm({
        message: `Scrobble "${resolved.track}" by ${resolved.artist}${sourceLabel(resolved.source)}?`,
      });
      if (p.isCancel(confirmed) || !confirmed) {
        p.cancel("Scrobble cancelled.");
        return;
      }
    }

    await ui.spinner(
      `Scrobbling "${resolved.track}" by ${resolved.artist}`,
      () =>
        LastFMClient.track.scrobble({
          artist: resolved.artist,
          track: resolved.track,
          album: resolved.album,
        }),
    );

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, { scrobbled: true, ...resolved });
      return;
    }
    console.log(
      `${ui.theme.success(icons.success)} Scrobbled "${resolved.track}" by ${resolved.artist}.${sourceLabel(resolved.source)}`,
    );
  },
};
