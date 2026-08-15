import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";
import { createUi, icons } from "@/ui";
import {
  printLines,
  renderTrackLines,
  shouldRenderImages,
  shouldUseNativeImages,
} from "@/ui/render-track";

export const userCommand: Command = {
  name: "user",
  description: "Show Last.fm user information",
  async run(ctx) {
    requireConfig(ctx.config);

    const ui = createUi(ctx.options);

    const { values } = parseArgs({
      args: ctx.args,
      options: { user: { type: "string" } },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;

    const info = await ui.spinner(`Fetching profile for ${username}`, () =>
      LastFMClient.user.getInfo(username),
    );

    const displayName = info.realname ? `${info.realname} (${info.name})` : info.name;
    const images = shouldRenderImages(ctx.options);
    const nativeImages = shouldUseNativeImages(ctx.options);
    const imageOptions = ctx.config.appearance;

    ui.page("Profile", `@${info.name}`);

    if (images) {
      printLines(
        await renderTrackLines(
          {
            name: displayName,
            artist: info.country || "unknown",
            image: info.image,
          },
          displayName,
          ui.theme,
          { ...imageOptions, images, nativeImages },
        ),
      );
      ui.blank();
    } else if (!ctx.options.quiet) {
      ui.heading(`${icons.user} ${displayName}`);
      ui.blank();
    } else {
      console.log(displayName);
    }

    ui.keyValue("Scrobbles", info.playcount);
    ui.keyValue("Country", info.country || "unknown");
    ui.keyValue("Profile", info.url);
    ui.blank();
  },
};
