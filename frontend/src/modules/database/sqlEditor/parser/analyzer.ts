import type { Catalog, ResolvedTable } from "../catalog";
import { safeParseStatement } from "./ast";

export interface TableRef {
  schemaName?: string;
  tableName: string;
  alias?: string;
}

export interface StatementAnalysis {
  tables: TableRef[];
  aliasMap: Map<string, TableRef>;
  primaryTable: TableRef | null;
}

type FromLike = {
  db?: string | null;
  table?: string | null;
  as?: string | null;
};

function pushFromItem(target: TableRef[], item: unknown): void {
  if (!item || typeof item !== "object") return;
  const row = item as FromLike;
  if (!row.table) return;
  target.push({
    schemaName: row.db ?? undefined,
    tableName: String(row.table),
    alias: row.as ? String(row.as) : undefined,
  });
}

function collectFromList(from: unknown): TableRef[] {
  if (!Array.isArray(from)) return [];
  const refs: TableRef[] = [];
  for (const item of from) {
    pushFromItem(refs, item);
  }
  return refs;
}

function buildAliasMap(refs: TableRef[]): Map<string, TableRef> {
  const map = new Map<string, TableRef>();
  for (const ref of refs) {
    if (ref.alias) {
      map.set(ref.alias.toLowerCase(), ref);
    }
    map.set(ref.tableName.toLowerCase(), ref);
  }
  return map;
}

function analyzeAstNode(ast: unknown): StatementAnalysis | null {
  if (!ast || typeof ast !== "object") return null;
  const node = ast as { type?: string; from?: unknown; table?: unknown };
  let tables: TableRef[] = [];

  if (node.type === "select") {
    tables = collectFromList(node.from);
  } else if (node.type === "update" || node.type === "delete") {
    tables = collectFromList(node.table);
  } else if (node.type === "insert") {
    pushFromItem(tables, node.table);
  }

  if (tables.length === 0) return null;
  return {
    tables,
    aliasMap: buildAliasMap(tables),
    primaryTable: tables[0] ?? null,
  };
}

/** 解析单条 SQL 语句，提取表引用与别名映射。 */
export function analyzeStatement(sql: string, dbType?: string | null): StatementAnalysis | null {
  const ast = safeParseStatement(sql, dbType);
  if (!ast) return null;
  if (Array.isArray(ast)) {
    return analyzeAstNode(ast[0]);
  }
  return analyzeAstNode(ast);
}

export function resolveTableByAlias(
  catalog: Catalog,
  analysis: StatementAnalysis,
  aliasOrTable: string,
): ResolvedTable | null {
  const key = aliasOrTable.toLowerCase();
  const ref = analysis.aliasMap.get(key);
  if (!ref) return null;
  return catalog.findTable(ref.tableName, ref.schemaName);
}

export function resolvePrimaryFromTable(
  catalog: Catalog,
  analysis: StatementAnalysis,
): ResolvedTable | null {
  if (!analysis.primaryTable) return null;
  return catalog.findTable(analysis.primaryTable.tableName, analysis.primaryTable.schemaName);
}
