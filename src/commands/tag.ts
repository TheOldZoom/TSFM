import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { loadConfig, requireSession } from "@/config";
import { UsageError } from "@/libs/errors";
import { suggestClosest, didYouMean } from "@/libs/suggest";
import { createUi, icons } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";
import { resolveTrack, sourceLabel } from "@/libs/resolve-track";
import { requireOnline } from "@/cache/context";

const TAG_ACTIONS = ["add", "remove"] as const;

export const tagCommand: Command = {
  name: "tag",
  description:
    "Add or remove tags on a track (defaults to now playing, or your last played)",
  aliases: ["tg"],
  usage:
    'tsfm tag <add|remove> [--artist "<artist>" --track "<track>"] --tags "tag1,tag2"',
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
    {
      flag: '--tags "tag1,tag2"',
      description: "Comma-separated tags to add, up to 10 (required for `add`)",
    },
    {
      flag: '--tag "tagname"',
      description: "Single tag to remove (required for `remove`)",
    },
  ],
  async run(ctx) {
    requireOnline("Tag a track");
    const config = loadConfig();
    requireSession(config);

    let [subcommand, ...rest] = ctx.args;

    if (!subcommand) {
      if (ctx.options.output === "pretty" && process.stdout.isTTY) {
        const answer = await p.select({
          message: "Add or remove a tag?",
          options: [
            { value: "add", label: "Add" },
            { value: "remove", label: "Remove" },
          ],
        });
        if (p.isCancel(answer)) {
          p.cancel("Cancelled.");
          return;
        }
        subcommand = answer;
      } else {
        throw new UsageError(
          'Usage: tsfm tag <add|remove> [--artist "<artist>" --track "<track>"] --tags "tag1,tag2"',
        );
      }
    } else if (!(TAG_ACTIONS as readonly string[]).includes(subcommand)) {
      const hint = didYouMean(suggestClosest(subcommand, TAG_ACTIONS, 3));
      throw new UsageError(
        `Unknown tag action "${subcommand}". ${hint || "Must be add or remove."}`,
      );
    }

    const { values, positionals } = parseArgs({
      args: rest,
      options: {
        artist: { type: "string" },
        track: { type: "string" },
        tags: { type: "string" },
        tag: { type: "string" },
      },
      allowPositionals: true,
      strict: false,
    });

    const artist = (values.artist as string) ?? positionals[0];
    const track =
      ((values.track as string) ?? positionals.slice(1).join(" ")) || undefined;

    const ui = createUi(ctx.options);
    const username = config.lastfm.session.username;

    if (subcommand === "add") {
      let tagsRaw = (values.tags as string) ?? (values.tag as string);
      if (!tagsRaw) {
        if (ctx.options.output === "pretty" && process.stdout.isTTY) {
          const answer = await p.text({
            message: 'Tags to add (comma-separated, e.g. "chill, favorite")',
            validate(value) {
              if (!value) return "At least one tag is required.";
            },
          });
          if (p.isCancel(answer)) {
            p.cancel("Cancelled.");
            return;
          }
          tagsRaw = answer;
        } else {
          throw new UsageError('Provide --tags "tag1,tag2" to add.');
        }
      }
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10);

      const resolved = await ui.spinner(
        artist && track
          ? `Tagging "${track}" by ${artist}`
          : "Tagging current track",
        async () => {
          const result = await resolveTrack(username, { artist, track });
          await LastFMClient.track.addTags({
            artist: result.artist,
            track: result.track,
            tags,
          });
          return result;
        },
      );

      if (isMachineOutput(ctx.options.output)) {
        writeOutput(ctx.options.output, { tagged: true, tags, ...resolved });
        return;
      }
      console.log(
        `${ui.theme.success(icons.success)} Added tags to "${resolved.track}": ${tags.join(", ")}.${sourceLabel(resolved.source)}`,
      );
      return;
    }

    let tag = (values.tag as string) ?? (values.tags as string);
    if (!tag) {
      if (ctx.options.output === "pretty" && process.stdout.isTTY) {
        const answer = await p.text({
          message: "Which tag do you want to remove?",
          validate(value) {
            if (!value) return "A tag is required.";
          },
        });
        if (p.isCancel(answer)) {
          p.cancel("Cancelled.");
          return;
        }
        tag = answer;
      } else {
        throw new UsageError('Provide --tag "tagname" to remove.');
      }
    }

    const resolved = await ui.spinner(
      artist && track
        ? `Removing tag from "${track}" by ${artist}`
        : "Removing tag from current track",
      async () => {
        const result = await resolveTrack(username, { artist, track });
        await LastFMClient.track.removeTag({
          artist: result.artist,
          track: result.track,
          tag,
        });
        return result;
      },
    );

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, { untagged: true, tag, ...resolved });
      return;
    }
    console.log(
      `${ui.theme.success(icons.success)} Removed tag "${tag}" from "${resolved.track}".${sourceLabel(resolved.source)}`,
    );
  },
};
