import * as p from "@clack/prompts";
import type { Command } from "./types";
import { loadConfig, writeConfigFile } from "@/config";

export const setupCommand: Command = {
  name: "setup",
  description: "Setup TSFM",
  async run() {
    const current = loadConfig();

    console.log();
    p.intro("tsfm setup");

    const group = await p.group(
      {
        apiKey: () =>
          p.text({
            message: "Last.fm API key",
            placeholder: current.lastfm.apiKey
              ? "leave blank to keep current"
              : "your Last.fm API key",
            initialValue: "",
            validate(value) {
              if (!value && !current.lastfm.apiKey) {
                return "An API key is required.";
              }
            },
          }),
        username: () =>
          p.text({
            message: "Last.fm username",
            placeholder: current.lastfm.username
              ? "leave blank to keep current"
              : "your Last.fm username",
            initialValue: "",
            validate(value) {
              if (!value && !current.lastfm.username) {
                return "A username is required.";
              }
            },
          }),
      },
      {
        onCancel: () => {
          p.cancel("Setup cancelled.");
          process.exit(0);
        },
      },
    );

    const config = {
      lastfm: {
        apiKey: group.apiKey.trim() || current.lastfm.apiKey,
        username: group.username.trim() || current.lastfm.username,
      },
    };

    const s = p.spinner();
    s.start("Saving configuration");

    if (!config.lastfm.apiKey || !config.lastfm.username) {
      s.stop("Configuration incomplete");
      p.outro("Both an API key and a username are required.");
      process.exitCode = 1;
      return;
    }
    writeConfigFile(config);
    s.stop("Configuration saved");

    p.outro(`Saved to ${process.env.XDG_CONFIG_HOME ?? "~/.config"}`);
  },
};
