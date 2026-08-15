import * as p from "@clack/prompts";
import type { Command } from "./types";
import LastFMClient from "@/api";
import { loadConfig, writeConfigFile } from "@/config";
import { UsageError } from "@/libs/errors";
import { requireOnline } from "@/cache/context";

export const loginCommand: Command = {
  name: "login",
  description: "Sign in to Last.fm to enable actions",
  usage: "tsfm login",
  async run() {
    requireOnline("Login");
    const config = loadConfig();

    if (!config.lastfm.apiKey || !config.lastfm.secret) {
      throw new UsageError(
        "An API key and API secret are required first. Run `tsfm setup`.",
      );
    }

    console.log();
    p.intro("◆ TSFM  /  LOGIN");

    const group = await p.group(
      {
        username: () =>
          p.text({
            message: "Last.fm username",
            initialValue: config.lastfm.username ?? "",
            validate(value) {
              if (!value) return "A username is required.";
            },
          }),
        password: () =>
          p.password({
            message: "Last.fm password",
            validate(value) {
              if (!value) return "A password is required.";
            },
          }),
      },
      {
        onCancel: () => {
          p.cancel("Login cancelled.");
          process.exit(0);
        },
      },
    );

    const s = p.spinner();
    s.start("Signing in to Last.fm");

    try {
      const session = await LastFMClient.auth.getMobileSession(
        group.username,
        group.password,
      );

      writeConfigFile({
        ...config,
        lastfm: {
          ...config.lastfm,
          username: config.lastfm.username ?? session.name,
          session: { key: session.key, username: session.name },
        },
      });

      s.stop("Signed in");
      p.outro(
        `Logged in as ${session.name}. Your password wasn't stored, only the session key.`,
      );
    } catch (err) {
      s.stop("Sign in failed");
      throw err;
    }
  },
};
