import type { DbColumnMeta } from "../api";

export type SchemaColumnDiffKind = "added" | "removed" | "changed";

export interface SchemaColumnDiff {
  name: string;
  kind: SchemaColumnDiffKind;
  sourceType?: string;
  targetType?: string;
}

export type SchemaTableDiffStatus = "checking" | "new" | "match" | "diff" | "error";

export interface SchemaTableDiff {
  tableName: string;
  status: SchemaTableDiffStatus;
  columns: SchemaColumnDiff[];
  error?: string;
  /** 对比所依据的目标库标识，用于缓存失效 */
  targetKey?: string;
  /** 对比所依据的源表结构签名，用于缓存失效 */
  sourceKey?: string;
}

function columnSignature(col: DbColumnMeta): string {
  return `${col.type}|${col.isPk}|${col.isFk}`;
}

export function compareTableColumns(
  source: DbColumnMeta[],
  target: DbColumnMeta[],
): SchemaColumnDiff[] {
  const diffs: SchemaColumnDiff[] = [];
  const targetByName = new Map(target.map((c) => [c.name, c]));
  const sourceByName = new Map(source.map((c) => [c.name, c]));

  for (const sc of source) {
    const tc = targetByName.get(sc.name);
    if (!tc) {
      diffs.push({ name: sc.name, kind: "added", sourceType: sc.type });
    } else if (columnSignature(sc) !== columnSignature(tc)) {
      diffs.push({
        name: sc.name,
        kind: "changed",
        sourceType: sc.type,
        targetType: tc.type,
      });
    }
  }

  for (const tc of target) {
    if (!sourceByName.has(tc.name)) {
      diffs.push({ name: tc.name, kind: "removed", targetType: tc.type });
    }
  }

  return diffs.sort((a, b) => a.name.localeCompare(b.name));
}

export function sourceColumnsSignature(columns: DbColumnMeta[]): string {
  return columns.map((c) => `${c.name}|${c.type}|${c.isPk}|${c.isFk}`).join(",");
}

export function buildNewTableDiff(
  tableName: string,
  sourceColumns: DbColumnMeta[],
): SchemaTableDiff {
  return {
    tableName,
    status: "new",
    columns: sourceColumns.map((c) => ({
      name: c.name,
      kind: "added" as const,
      sourceType: c.type,
    })),
    sourceKey: sourceColumnsSignature(sourceColumns),
  };
}
