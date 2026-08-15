import * as p from "@clack/prompts";
import type { Command } from "./types";
import { getConfigPath, loadConfig, writeConfigFile } from "@/config";

export const setupCommand: Command = {
  name: "setup",
  description: "Setup TSFM",
  usage: "tsfm setup",
  async run() {
    const current = loadConfig();

    console.log();
    p.intro("◆ TSFM  /  SETUP");

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
        secret: () =>
          p.text({
            message:
              "Last.fm API secret (optional, enables login/love/scrobble)",
            placeholder: current.lastfm.secret
              ? "leave blank to keep current"
              : "leave blank to skip",
            initialValue: "",
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
        images: () =>
          p.confirm({
            message: "Render album artwork in the terminal",
            initialValue: current.appearance.images,
          }),
        imageMode: () =>
          p.select({
            message: "Artwork style",
            initialValue: current.appearance.imageMode,
            options: [
              {
                value: "auto" as const,
                label: "Native images when supported",
                hint: "otherwise use ANSI artwork",
              },
              {
                value: "ansi" as const,
                label: "ANSI artwork only",
              },
            ],
          }),
        imageSize: () =>
          p.select({
            message: "Artwork size",
            initialValue: current.appearance.imageSize,
            options: [
              { value: "compact" as const, label: "Compact" },
              { value: "normal" as const, label: "Normal" },
              { value: "large" as const, label: "Large" },
            ],
          }),
        imageWidth: () =>
          p.text({
            message: "Artwork target width (terminal columns)",
            placeholder: "automatic",
            initialValue: current.appearance.imageWidth?.toString() ?? "",
            validate(value) {
              if (!value) return;
              const width = Number(value);
              if (!Number.isInteger(width) || width < 4 || width > 80) {
                return "Enter a whole number from 4 to 80, or leave blank for automatic.";
              }
            },
          }),
        imageMaxWidth: () =>
          p.text({
            message: "Maximum artwork width (terminal columns)",
            initialValue: String(current.appearance.imageMaxWidth),
            validate(value) {
              const width = Number(value);
              if (!Number.isInteger(width) || width < 8 || width > 80) {
                return "Enter a whole number from 8 to 80.";
              }
            },
          }),
        imageSpacing: () =>
          p.text({
            message: "Space between ANSI artwork and text",
            initialValue: String(current.appearance.imageSpacing),
            validate(value) {
              const spacing = Number(value);
              if (!Number.isInteger(spacing) || spacing < 0 || spacing > 8) {
                return "Enter a whole number from 0 to 8.";
              }
            },
          }),
        cacheEnabled: () =>
          p.confirm({
            message:
              "Cache Last.fm responses locally to speed up repeat lookups",
            initialValue: current.cache.enabled,
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
        secret: group.secret.trim() || current.lastfm.secret,
        session: current.lastfm.session,
      },
      appearance: {
        images: group.images,
        imageMode: group.imageMode,
        imageSize: group.imageSize,
        imageWidth: group.imageWidth ? Number(group.imageWidth) : undefined,
        imageMaxWidth: Number(group.imageMaxWidth),
        imageSpacing: Number(group.imageSpacing),
      },
      cache: {
        enabled: group.cacheEnabled,
      },
    };

    const s = p.spinner();
    s.start("Saving your preferences");

    if (!config.lastfm.apiKey || !config.lastfm.username) {
      s.stop("Configuration incomplete");
      p.outro("Both an API key and a username are required.");
      process.exitCode = 1;
      return;
    }
    writeConfigFile(config);
    s.stop("Preferences saved");

    p.outro(`Saved to ${getConfigPath()}`);
  },
};
