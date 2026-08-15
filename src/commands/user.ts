import { parseArgs } from "node:util";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { requireConfig } from "@/config";

export const userCommand: Command = {
  name: "user",
  description: "Show Last.fm user information",
  async run(ctx) {
    requireConfig(ctx.config);

    const { values } = parseArgs({
      args: ctx.args,
      options: { user: { type: "string" } },
      strict: false,
    });

    const username = (values.user as string) ?? ctx.config.lastfm.username;
    const info = await LastFMClient.user.getInfo(username);

    console.log(info.realname ? `${info.realname} (${info.name})` : info.name);
    console.log(`Scrobbles: ${info.playcount}`);
    console.log(`Country: ${info.country || "unknown"}`);
    console.log(`Profile: ${info.url}`);
  },
};
