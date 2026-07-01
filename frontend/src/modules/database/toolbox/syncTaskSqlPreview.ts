import { fetchTableDdl } from "../api";
import type { DbColumnMeta, DbConnectionConfig, DbIndexMeta } from "../api";
import { resolveTargetTableName } from "./schemaSyncAlignedTables";
import type { SchemaTableDiff } from "./schemaDiff";
import { formatIndexDetail } from "./schemaDiff";
import type {
  DataSyncStrategy,
  SyncTableInfo,
  TableTargetStatus,
  ToolboxTabId,
} from "./types";

export interface SyncTaskSqlPreviewInput {
  tab: ToolboxTabId;
  sourceConn: DbConnectionConfig;
  sourceDb: string;
  targetConn: DbConnectionConfig;
  targetDb: string;
  tableNames: string[];
  tableTargetStatus: Record<string, TableTargetStatus>;
  tableSyncStrategies: Record<string, DataSyncStrategy>;
  sourceTableColumns: Record<string, DbColumnMeta[]>;
  sourceTableIndexes: Record<string, DbIndexMeta[]>;
  schemaAnalysisDiffs: Record<string, SchemaTableDiff>;
  sourceRowCounts: Record<string, number | null>;
  targetTables: SyncTableInfo[];
  schemaCaseSensitive: boolean;
}

function isMysqlEngine(dbType: string): boolean {
  const t = dbType.toLowerCase();
  return t === "mysql" || t === "mariadb";
}

function isPostgresEngine(dbType: string): boolean {
  const t = dbType.toLowerCase();
  return t === "postgresql" || t === "postgres";
}

function quoteIdent(dbType: string, name: string): string {
  if (isMysqlEngine(dbType)) {
    return `\`${name.replace(/`/g, "``")}\``;
  }
  if (isPostgresEngine(dbType)) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  return `"${name.replace(/"/g, '""')}"`;
}

function normalizeCreateTableDdl(ddl: string, dbType: string): string {
  let sql = ddl.trim().replace(/;\s*$/, "");
  if (!sql.toUpperCase().includes("IF NOT EXISTS")) {
    sql = sql.replace(/^CREATE TABLE/i, "CREATE TABLE IF NOT EXISTS");
  }
  if (isMysqlEngine(dbType)) {
    const marker = "IF NOT EXISTS";
    const idx = sql.indexOf(marker);
    if (idx >= 0) {
      let tail = sql.slice(idx + marker.length).trimStart();
      const dot = tail.indexOf("`.`");
      if (tail.startsWith("`") && dot >= 0) {
        tail = tail.slice(dot + 3).trimStart();
        sql = `${sql.slice(0, idx + marker.length)} ${tail}`;
      }
    }
  }
  return sql;
}

function strategyLabel(strategy: DataSyncStrategy): string {
  if (strategy === "append") return "append";
  if (strategy === "update") return "update";
  return "rewrite";
}

function buildAddColumnSql(dbType: string, table: string, col: DbColumnMeta): string {
  const tableIdent = quoteIdent(dbType, table);
  const colIdent = quoteIdent(dbType, col.name);
  const nullSql = col.nullable !== false ? "NULL" : "NOT NULL";
  return `ALTER TABLE ${tableIdent} ADD COLUMN ${colIdent} ${col.type} ${nullSql}`;
}

function buildModifyColumnSql(dbType: string, table: string, col: DbColumnMeta): string {
  const tableIdent = quoteIdent(dbType, table);
  const colIdent = quoteIdent(dbType, col.name);
  const nullSql = col.nullable !== false ? "NULL" : "NOT NULL";
  if (isMysqlEngine(dbType)) {
    return `ALTER TABLE ${tableIdent} MODIFY COLUMN ${colIdent} ${col.type} ${nullSql}`;
  }
  if (isPostgresEngine(dbType)) {
    return `ALTER TABLE ${tableIdent} ALTER COLUMN ${colIdent} TYPE ${col.type}`;
  }
  return "";
}

function buildCreateIndexSql(dbType: string, table: string, idx: DbIndexMeta): string {
  const tableIdent = quoteIdent(dbType, table);
  const idxIdent = quoteIdent(dbType, idx.name);
  const cols = idx.columns.map((c) => quoteIdent(dbType, c)).join(", ");
  const kind = idx.unique ? "CREATE UNIQUE INDEX" : "CREATE INDEX";
  return `${kind} ${idxIdent} ON ${tableIdent} (${cols})`;
}

function buildDropIndexSql(dbType: string, table: string, idx: DbIndexMeta): string {
  const tableIdent = quoteIdent(dbType, table);
  const idxIdent = quoteIdent(dbType, idx.name);
  if (isMysqlEngine(dbType)) {
    return `DROP INDEX ${idxIdent} ON ${tableIdent}`;
  }
  if (isPostgresEngine(dbType)) {
    return `DROP INDEX IF EXISTS ${idxIdent}`;
  }
  return "";
}

function buildTruncateSql(dbType: string, table: string): string {
  const ident = quoteIdent(dbType, table);
  if (isMysqlEngine(dbType) || isPostgresEngine(dbType)) {
    return `TRUNCATE TABLE ${ident}`;
  }
  return `DELETE FROM ${ident}`;
}

function buildInsertPreviewSql(
  dbType: string,
  table: string,
  columns: DbColumnMeta[],
  strategy: DataSyncStrategy,
  rowCount: number | null,
): string {
  const tableIdent = quoteIdent(dbType, table);
  const colNames = columns.map((c) => quoteIdent(dbType, c.name)).join(", ");
  const rowsHint =
    rowCount != null && rowCount >= 0
      ? `-- 预计同步 ${rowCount.toLocaleString()} 行（分批 INSERT，每批约 150 行）`
      : "-- 预计从源库分批读取并 INSERT";
  const valuesHint = `-- INSERT INTO ${tableIdent} (${colNames}) VALUES (...), (...);`;

  if (isMysqlEngine(dbType)) {
    if (strategy === "append") {
      return `${rowsHint}\n-- INSERT IGNORE INTO ${tableIdent} (${colNames}) VALUES (...);`;
    }
    if (strategy === "update") {
      return `${rowsHint}\n-- INSERT INTO ${tableIdent} (${colNames}) VALUES (...)\n-- ON DUPLICATE KEY UPDATE ...;`;
    }
    return `${rowsHint}\n${valuesHint}`;
  }

  if (isPostgresEngine(dbType)) {
    if (strategy === "append") {
      return `${rowsHint}\n-- INSERT INTO ${tableIdent} (${colNames}) VALUES (...)\n-- ON CONFLICT DO NOTHING;`;
    }
    if (strategy === "update") {
      return `${rowsHint}\n-- INSERT INTO ${tableIdent} (${colNames}) VALUES (...)\n-- ON CONFLICT (...) DO UPDATE SET ...;`;
    }
    return `${rowsHint}\n${valuesHint}`;
  }

  if (strategy === "append") {
    return `${rowsHint}\n-- INSERT OR IGNORE INTO ${tableIdent} (${colNames}) VALUES (...);`;
  }
  if (strategy === "update") {
    return `${rowsHint}\n-- INSERT OR REPLACE INTO ${tableIdent} (${colNames}) VALUES (...);`;
  }
  return `${rowsHint}\n${valuesHint}`;
}

async function buildSchemaTablePreview(
  input: SyncTaskSqlPreviewInput,
  tableName: string,
): Promise<string[]> {
  const lines: string[] = [];
  const dbType = input.targetConn.db_type;
  const targetName =
    resolveTargetTableName(tableName, input.targetTables, input.schemaCaseSensitive) ?? tableName;
  const diff = input.schemaAnalysisDiffs[tableName];
  const columns = input.sourceTableColumns[tableName] ?? [];
  const indexes = input.sourceTableIndexes[tableName] ?? [];
  const targetExists = input.targetTables.some((t) => t.name === targetName);

  if (!targetExists || diff?.status === "new") {
    try {
      const ddl = await fetchTableDdl(input.sourceConn, input.sourceDb, tableName);
      lines.push(`${normalizeCreateTableDdl(ddl, dbType)};`);
    } catch (e) {
      lines.push(`-- 无法获取建表语句: ${String(e)}`);
    }
    return lines;
  }

  if (!diff || diff.status === "match") {
    lines.push("-- 结构已一致，无需变更");
    return lines;
  }

  if (diff.status === "error") {
    lines.push(`-- 分析失败: ${diff.error ?? "unknown"}`);
    return lines;
  }

  for (const colDiff of diff.columns) {
    const col = columns.find((c) => c.name === colDiff.name);
    if (!col) {
      if (colDiff.kind === "removed") {
        lines.push(`-- 目标端多余列 ${colDiff.name}（执行时不会自动删除）`);
      }
      continue;
    }
    if (colDiff.kind === "added") {
      lines.push(`${buildAddColumnSql(dbType, targetName, col)};`);
    } else if (colDiff.kind === "changed") {
      const sql = buildModifyColumnSql(dbType, targetName, col);
      if (sql) {
        lines.push(`${sql};`);
      }
    }
  }

  for (const idxDiff of diff.indexes) {
    const idx = indexes.find((i) => i.name === idxDiff.name);
    if (!idx) {
      if (idxDiff.kind === "removed") {
        lines.push(`-- 目标端多余索引 ${idxDiff.name}（执行时不会自动删除）`);
      }
      continue;
    }
    if (idxDiff.kind === "added") {
      lines.push(`${buildCreateIndexSql(dbType, targetName, idx)};`);
    } else if (idxDiff.kind === "changed") {
      const dropSql = buildDropIndexSql(dbType, targetName, idx);
      if (dropSql) {
        lines.push(`${dropSql};`);
      }
      lines.push(`${buildCreateIndexSql(dbType, targetName, idx)};`);
    }
  }

  if (lines.length === 0) {
    lines.push("-- 无待执行结构变更");
  }

  return lines;
}

async function buildDataTablePreview(
  input: SyncTaskSqlPreviewInput,
  tableName: string,
): Promise<string[]> {
  const lines: string[] = [];
  const dbType = input.targetConn.db_type;
  const status = input.tableTargetStatus[tableName];
  const strategy =
    input.tableSyncStrategies[tableName] ?? (status === "new" ? "rewrite" : "rewrite");
  const columns = input.sourceTableColumns[tableName] ?? [];
  const rowCount = input.sourceRowCounts[tableName] ?? null;

  if (status === "new") {
    try {
      const ddl = await fetchTableDdl(input.sourceConn, input.sourceDb, tableName);
      lines.push(`${normalizeCreateTableDdl(ddl, dbType)};`);
    } catch (e) {
      lines.push(`-- 无法获取建表语句: ${String(e)}`);
    }
  }

  if (strategy === "rewrite" && status !== "new") {
    lines.push(`${buildTruncateSql(dbType, tableName)};`);
  }

  lines.push(`-- 策略: ${strategyLabel(strategy)}`);
  lines.push(buildInsertPreviewSql(dbType, tableName, columns, strategy, rowCount));

  const pkCols = columns.filter((c) => c.isPk).map((c) => c.name);
  if (pkCols.length > 0) {
    lines.push(`-- 主键: ${pkCols.join(", ")}`);
  }

  const idxList = input.sourceTableIndexes[tableName] ?? [];
  if (idxList.length > 0) {
    lines.push(`-- 索引: ${idxList.map((i) => `${i.name} ${formatIndexDetail(i)}`).join("; ")}`);
  }

  return lines;
}

/** 根据当前任务配置生成预计执行的 SQL 脚本（预览，不含真实行数据）。 */
export async function buildSyncTaskSqlPreview(input: SyncTaskSqlPreviewInput): Promise<string> {
  const header = [
    `-- ${input.tab === "dataSync" ? "数据同步" : "结构同步"} · 脚本预览`,
    `-- 源: ${input.sourceConn.name}/${input.sourceDb}`,
    `-- 目标: ${input.targetConn.name}/${input.targetDb}`,
    `-- 表数量: ${input.tableNames.length}`,
    "",
  ];

  if (input.tableNames.length === 0) {
    return [...header, "-- 未选择任何表"].join("\n");
  }

  const dbType = input.targetConn.db_type.toLowerCase();
  if (!isMysqlEngine(dbType) && !isPostgresEngine(dbType) && dbType !== "sqlite") {
    return [...header, `-- 暂不支持 ${input.targetConn.db_type} 的脚本预览`].join("\n");
  }

  const sections: string[] = [...header];

  for (const name of input.tableNames) {
    sections.push(`-- ── ${name} ──`);
    const body =
      input.tab === "schemaSync"
        ? await buildSchemaTablePreview(input, name)
        : await buildDataTablePreview(input, name);
    sections.push(...body);
    sections.push("");
  }

  return `${sections.join("\n").trimEnd()}\n`;
}
