import type { Theme } from "./theme";

export type ColumnAlign = "left" | "right";

export interface TableColumn {
  key: string;
  header: string;
  align?: ColumnAlign;
  minWidth?: number;
}

export interface RenderTableOptions {
  theme: Theme;
  quiet?: boolean;
}

export interface TableSpec {
  columns: TableColumn[];
  rows: Record<string, string>[];
}

function pad(value: string, width: number, align: ColumnAlign): string {
  if (value.length >= width) return value.slice(0, width);
  const padding = width - value.length;
  return align === "right"
    ? " ".repeat(padding) + value
    : value + " ".repeat(padding);
}

function columnWidths(
  columns: TableColumn[],
  rows: Record<string, string>[],
): number[] {
  return columns.map((column) => {
    const cellWidths = rows.map((row) => (row[column.key] ?? "").length);
    const headerWidth = column.header.length;
    const minWidth = column.minWidth ?? 0;
    return Math.max(minWidth, headerWidth, ...cellWidths);
  });
}

function tableWidth(widths: number[], columnCount: number): number {
  return widths.reduce((sum, width) => sum + width, 0) + (columnCount - 1) * 2;
}

export function renderTable(
  columns: TableColumn[],
  rows: Record<string, string>[],
  options: RenderTableOptions,
): string[] {
  if (rows.length === 0) return [];

  const { theme, quiet = false } = options;
  const widths = columnWidths(columns, rows);

  const lines: string[] = [];

  if (!quiet) {
    const header = columns
      .map((column, index) => {
        const align = column.align ?? "left";
        const text = pad(column.header, widths[index]!, align);
        return theme.label(text);
      })
      .join("  ");
    lines.push(header);
    lines.push(theme.dim("─".repeat(tableWidth(widths, columns.length))));
  }

  for (const row of rows) {
    const line = columns
      .map((column, index) => {
        const align = column.align ?? "left";
        const raw = row[column.key] ?? "";
        return pad(raw, widths[index]!, align);
      })
      .join("  ");
    lines.push(line);
  }

  return lines;
}

export function renderTablesStacked(
  tables: TableSpec[],
  options: RenderTableOptions,
): string[] {
  const sharedWidths = new Map<string, number>();

  for (const table of tables) {
    const widths = columnWidths(table.columns, table.rows);
    table.columns.forEach((column, index) => {
      const current = sharedWidths.get(column.key) ?? 0;
      sharedWidths.set(column.key, Math.max(current, widths[index]!));
    });
  }

  const templateColumns = tables.reduce<TableColumn[]>(
    (widest, table) =>
      table.columns.length > widest.length ? table.columns : widest,
    [],
  );
  const canonicalKeys = templateColumns.map((column) => column.key);
  for (const table of tables) {
    for (const column of table.columns) {
      if (!canonicalKeys.includes(column.key)) canonicalKeys.push(column.key);
    }
  }

  const output: string[] = [];

  for (const table of tables) {
    const byKey = new Map(table.columns.map((column) => [column.key, column]));
    const columns = canonicalKeys.map((key) => {
      const existing = byKey.get(key);
      if (existing) {
        return {
          ...existing,
          minWidth: sharedWidths.get(key) ?? existing.minWidth,
        };
      }
      return {
        key,
        header: "",
        align: "left" as const,
        minWidth: sharedWidths.get(key) ?? 0,
      };
    });

    const lines = renderTable(columns, table.rows, options);
    if (lines.length === 0) continue;

    if (output.length > 0) output.push("");
    output.push(...lines);
  }

  return output;
}
