import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";

import { commands } from "../src/commands";
import type { Command, FlagSpec } from "../src/commands/types";

const OUTPUT_DIR = join(import.meta.dir, "../docs/commands");

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function badge(label: string): string {
  return `\`${label}\``;
}

function renderFlags(flags: FlagSpec[] | undefined): string {
  if (!flags?.length) return "";

  const rows = flags
    .map((f) => `| \`${f.flag}\` | ${f.description} |`)
    .join("\n");

  return `**Flags**\n\n| Flag | Description |\n| :-- | :-- |\n${rows}\n\n`;
}

function renderCommand(command: Command): string {
  let out = `# \`${command.name}\`\n\n`;

  if (command.aliases?.length) {
    out += `**Aliases:** ${command.aliases.map((a) => badge(a)).join(", ")}\n\n`;
  }

  out += `${command.description}\n\n`;

  if (command.usage) {
    out += `**Usage**\n\`\`\`\n${command.usage}\n\`\`\`\n\n`;
  }

  out += renderFlags(command.flags);

  return out;
}

async function main() {
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const sorted = [...commands.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const indexRows: string[] = [];

  for (const command of sorted) {
    const slug = toSlug(command.name);

    await writeFile(join(OUTPUT_DIR, `${slug}.md`), renderCommand(command));

    indexRows.push(
      `| [\`${command.name}\`](./${slug}.md) | ${command.description} |`,
    );
  }

  const generatedAt = new Date().toISOString();

  const readme =
    `# Commands\n\n` +
    `${sorted.length} command${sorted.length === 1 ? "" : "s"} total.\n\n` +
    `| Command | Description |\n| :-- | :-- |\n${indexRows.join("\n")}\n\n` +
    `<sub>Generated ${generatedAt}. Do not edit by hand, run \`bun run docs\` instead.</sub>\n`;

  await writeFile(join(OUTPUT_DIR, "README.md"), readme);

  console.log(`Generated docs for ${sorted.length} commands.`);
}

main().catch((err) => {
  console.error("Doc generation failed:", err);
  process.exit(1);
});
