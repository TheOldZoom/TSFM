import {
  defaultUiOptions,
  isGlobalFlag,
  parseCommandArgv,
  parseGlobalFlags,
  type UiOptions,
} from "./options";
import { createTheme, icons, type Theme } from "./theme";
import {
  renderTable,
  renderTablesStacked,
  type TableColumn,
  type TableSpec,
} from "./table";
import { withSpinner } from "./spinner";
import {
  formatError,
  formatHeading,
  formatHint,
  formatKeyValue,
  formatNowPlaying,
  formatPage,
  formatSection,
} from "./format";

export { parseGlobalFlags, parseCommandArgv, defaultUiOptions, isGlobalFlag };
export type { UiOptions } from "./options";
export { icons, createTheme, type Theme };
export { renderTable, renderTablesStacked, type TableColumn, type TableSpec };
export { withSpinner };

export interface Ui {
  options: UiOptions;
  theme: Theme;
  page(title: string, meta?: string): void;
  heading(text: string): void;
  section(title: string, body: string[]): void;
  keyValue(label: string, value: string): void;
  table(columns: TableColumn[], rows: Record<string, string>[]): void;
  tables(tables: TableSpec[]): void;
  nowPlaying(artist: string, track: string): void;
  error(message: string): void;
  hint(message: string): void;
  spinner<T>(label: string, fn: () => Promise<T>): Promise<T>;
  blank(): void;
}

export function createUi(options: UiOptions): Ui {
  const theme = createTheme(options);

  return {
    options,
    theme,
    page(title, meta) {
      if (options.quiet || options.output !== "pretty") return;
      for (const line of formatPage(theme, title, meta)) {
        console.log(line);
      }
    },
    heading(text) {
      if (options.quiet || options.output !== "pretty") return;
      console.log(formatHeading(theme, text));
    },
    section(title, body) {
      if (options.output !== "pretty") return;
      if (options.quiet) {
        for (const line of body) console.log(line);
        return;
      }
      for (const line of formatSection(theme, title, body)) {
        console.log(line);
      }
    },
    keyValue(label, value) {
      if (options.output !== "pretty") return;
      console.log(formatKeyValue(theme, label, value));
    },
    table(columns, rows) {
      if (options.output !== "pretty") return;
      for (const line of renderTable(columns, rows, {
        theme,
        quiet: options.quiet,
      })) {
        console.log(line);
      }
    },
    tables(tables) {
      if (options.output !== "pretty") return;
      for (const line of renderTablesStacked(tables, {
        theme,
        quiet: options.quiet,
      })) {
        console.log(line);
      }
    },
    nowPlaying(artist, track) {
      if (options.output !== "pretty") return;
      if (options.quiet) {
        console.log(`${track} — ${artist}`);
        return;
      }
      for (const line of formatNowPlaying(theme, artist, track)) {
        console.log(line);
      }
    },
    error(message) {
      if (options.output !== "pretty") return;
      console.error(formatError(theme, message));
    },
    hint(message) {
      if (options.quiet || options.output !== "pretty") return;
      console.error(formatHint(theme, message));
    },
    spinner(label, fn) {
      return withSpinner(label, fn, options);
    },
    blank() {
      if (options.quiet || options.output !== "pretty") return;
      console.log();
    },
  };
}
