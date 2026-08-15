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

function pad(value: string, width: number, align: ColumnAlign): string {
  if (value.length >= width) return value.slice(0, width);
  const padding = width - value.length;
  return align === "right" ? " ".repeat(padding) + value : value + " ".repeat(padding);
}

export function renderTable(
  columns: TableColumn[],
  rows: Record<string, string>[],
  options: RenderTableOptions,
): string[] {
  if (rows.length === 0) return [];

  const { theme, quiet = false } = options;
  const widths = columns.map((column) => {
    const cellWidths = rows.map((row) => (row[column.key] ?? "").length);
    const headerWidth = column.header.length;
    const minWidth = column.minWidth ?? 0;
    return Math.max(minWidth, headerWidth, ...cellWidths);
  });

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
    lines.push(theme.dim("─".repeat(widths.reduce((sum, width) => sum + width, 0) + (columns.length - 1) * 2)));
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
