export type OutputFormat = "pretty" | "json" | "csv";

export function isMachineOutput(format: OutputFormat): boolean {
  return format !== "pretty";
}

export function writeOutput(format: OutputFormat, value: unknown): void {
  if (format === "json") {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  if (format === "csv") {
    console.log(toCsv(value));
  }
}

export function writeMachineError(
  format: Exclude<OutputFormat, "pretty">,
  message: string,
  code: number,
): void {
  if (format === "json") {
    console.error(JSON.stringify({ error: { message, code } }));
    return;
  }

  console.error(`error,message\n${csvValue(String(code))},${csvValue(message)}`);
}

function toCsv(value: unknown): string {
  const records = Array.isArray(value) ? value : [value];
  const rows = records
    .filter((record): record is Record<string, unknown> =>
      typeof record === "object" && record !== null,
    )
    .map((record) => flattenRecord(record));

  if (rows.length === 0) return "";

  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    headers.map(csvValue).join(","),
    ...rows.map((row) => headers.map((header) => csvValue(row[header] ?? "")).join(",")),
  ].join("\n");
}

function flattenRecord(value: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, raw] of Object.entries(value)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      Object.assign(result, flattenRecord(raw as Record<string, unknown>, name));
    } else if (Array.isArray(raw)) {
      result[name] = JSON.stringify(raw);
    } else {
      result[name] = raw === undefined ? "" : String(raw);
    }
  }

  return result;
}

function csvValue(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
