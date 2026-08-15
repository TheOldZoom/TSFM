import type { Command } from "./types";
import { loadConfig, getConfigPath } from "@/config";
import { createUi } from "@/ui";

export const configCommand: Command = {
  name: "config",
  description: "Show configuration, or its file path with `path`",
  run(ctx) {
    const ui = createUi(ctx.options);
    const [subcommand] = ctx.args;

    if (subcommand === "path") {
      console.log(getConfigPath());
      return;
    }

    const config = loadConfig();
    ui.page("Configuration", getConfigPath());
    ui.section("Last.fm", [
      `  ${ui.theme.label("Username    ")}${config.lastfm.username ?? "not set"}`,
      `  ${ui.theme.label("API key     ")}${config.lastfm.apiKey ? "configured" : "not set"}`,
    ]);
    ui.section("Artwork", [
      `  ${ui.theme.label("Enabled     ")}${config.appearance.images ? "yes" : "no"}`,
      `  ${ui.theme.label("Style       ")}${config.appearance.imageMode}`,
      `  ${ui.theme.label("Size        ")}${config.appearance.imageSize}`,
      `  ${ui.theme.label("Target width")}${config.appearance.imageWidth ?? "automatic"}`,
      `  ${ui.theme.label("Maximum     ")}${config.appearance.imageMaxWidth} columns`,
    ]);

    if (!config.lastfm.apiKey || !config.lastfm.username) {
      ui.hint("TSFM is not fully configured. Run `tsfm setup` to get started.");
    }
  },
};
