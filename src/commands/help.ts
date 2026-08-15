import type { Command } from "./types";
import { commands, resolveCommand } from "./index";
import { UsageError } from "@/libs/errors";
import { createUi } from "@/ui";
import { isMachineOutput, writeOutput } from "@/output";

export const helpCommand: Command = {
  name: "help",
  description: "Show help for a command, or list all commands",
  aliases: ["h", "?"],
  usage: "tsfm help [command]",
  run(ctx) {
    const ui = createUi(ctx.options);
    const [target] = ctx.args;

    if (!target) {
      if (isMachineOutput(ctx.options.output)) {
        writeOutput(
          ctx.options.output,
          [...commands.values()].map((command) => ({
            name: command.name,
            description: command.description,
            aliases: command.aliases ?? [],
            usage: command.usage ?? `tsfm ${command.name}`,
          })),
        );
        return;
      }

      ui.page(
        "Your Last.fm, in the terminal",
        "Usage: tsfm <command> [options]",
      );
      ui.table(
        [
          { key: "command", header: "Command", minWidth: 8 },
          { key: "aliases", header: "Aliases", minWidth: 10 },
          { key: "description", header: "Description", minWidth: 28 },
        ],
        [...commands.values()].map((cmd) => ({
          command: cmd.name,
          aliases: cmd.aliases?.join(", ") ?? "",
          description: cmd.description,
        })),
      );
      ui.blank();
      ui.hint(
        "Global: --no-color  --quiet  --verbose  --images  --no-images  --json  --csv  --no-cache  --offline  --help/-h",
      );
      ui.hint(
        "Run `tsfm help <command>` or `tsfm <command> --help` for details on a specific command.",
      );
      return;
    }

    const command = resolveCommand(target);
    if (!command) {
      throw new UsageError(
        `Unknown command "${target}". Run \`tsfm help\` to see available commands.`,
      );
    }

    if (isMachineOutput(ctx.options.output)) {
      writeOutput(ctx.options.output, {
        name: command.name,
        description: command.description,
        aliases: command.aliases ?? [],
        usage: command.usage ?? `tsfm ${command.name}`,
        flags: command.flags ?? [],
      });
      return;
    }

    ui.page(`tsfm ${command.name}`, command.description);
    ui.section("Usage", [`  ${command.usage ?? `tsfm ${command.name}`}`]);
    if (command.aliases?.length) {
      ui.section("Aliases", [`  ${command.aliases.join(", ")}`]);
    }
    if (command.flags?.length) {
      const width = Math.max(...command.flags.map((f) => f.flag.length));
      ui.section(
        "Flags",
        command.flags.map(
          (f) => `  ${f.flag.padEnd(width)}   ${f.description}`,
        ),
      );
    }
    ui.section("Global flags", [
      "  --json / --csv          Machine-readable output instead of pretty-printed",
      "  --no-color              Disable colored output",
      "  --quiet                 Suppress non-essential output",
      "  --verbose               Print extra diagnostic detail on errors",
      "  --images / --no-images  Toggle album artwork rendering",
      "  --no-cache              Bypass the local response cache",
      "  --offline               Don't make network requests",
      "  --help, -h              Show this help",
    ]);
    ui.blank();
    ui.hint(
      `You can also run \`tsfm ${command.name} --help\` to see this at any time.`,
    );
  },
};
