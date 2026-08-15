import type { Command } from "./types";
import { loadConfig, writeConfigFile } from "@/config";
import { createUi, icons } from "@/ui";

export const logoutCommand: Command = {
  name: "logout",
  description: "Sign out of Last.fm",
  usage: "tsfm logout",
  run(ctx) {
    const config = loadConfig();
    const ui = createUi(ctx.options);

    if (!config.lastfm.session) {
      ui.hint("You're not logged in.");
      return;
    }

    const { session: _session, ...lastfm } = config.lastfm;
    writeConfigFile({ ...config, lastfm });

    console.log(`${ui.theme.success(icons.success)} Signed out.`);
  },
};
