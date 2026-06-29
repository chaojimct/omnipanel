import type { LsEntry } from "./parseLsListing";

export type LongFieldFormat = "unix" | "powershell" | "cmd";

const UNIX_MODE_MIN_WIDTH = 10;

export function detectLongFieldFormat(entries: LsEntry[]): LongFieldFormat {
  const fields = entries.find((e) => e.longFields && e.longFields.length > 0)?.longFields;
  if (!fields?.length) return "unix";
  if (/^[d-][arhsl-]{4,6}$/i.test(fields[0] ?? "")) return "powershell";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(fields[0] ?? "")) return "cmd";
  return "unix";
}

export function longFormatSizeFieldIndex(format: LongFieldFormat): number {
  switch (format) {
    case "powershell":
      return 2;
    case "cmd":
      return 1;
    default:
      return 4;
  }
}

export function computeLongFieldWidths(
  entries: LsEntry[],
  format: LongFieldFormat,
): number[] {
  const widths: number[] = [];
  const sizeIndex = longFormatSizeFieldIndex(format);

  for (const entry of entries) {
    const fields = entry.longFields;
    if (!fields) continue;

    for (let i = 0; i < fields.length; i += 1) {
      const minWidth = i === 0 && format === "unix" ? UNIX_MODE_MIN_WIDTH : 1;
      const next = Math.max(widths[i] ?? minWidth, fields[i]!.length, minWidth);
      widths[i] = i === sizeIndex ? Math.max(next, widths[i] ?? 1) : next;
    }
  }

  return widths;
}

/** 按列填充空格，模拟 ls -l 固定列宽 */
export function padLongField(
  value: string,
  index: number,
  width: number,
  format: LongFieldFormat,
): string {
  const sizeIndex = longFormatSizeFieldIndex(format);

  if (index === sizeIndex) {
    return value.padStart(width, " ");
  }
  if (format === "unix" && index === 1) {
    return value.padStart(width, " ");
  }
  return value.padEnd(width, " ");
}
