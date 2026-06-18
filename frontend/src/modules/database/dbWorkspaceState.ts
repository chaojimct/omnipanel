import type { SqlEditorOpenMode } from "./SqlEditor";
import type { TablePreviewResult, DbColumnMeta } from "./api";

export { type DbWorkspaceTab, type SqlWorkspaceTab } from "./workspaceTabs";

export type QueryResult = {
  columns: string[];
  rows: unknown[][];
  rowsAffected: number;
};

export type TablePreviewState = {
  loading: boolean;
  error: string | null;
  data: TablePreviewResult | null;
  totalRows: number;
  page: number;
  pageSize: number;
  connId?: string;
  dbName?: string;
  tableName?: string;
};

export type SqlTabState = {
  sql: string;
  database: string;
  /** 上次光标位置，表预览模式无编辑器焦点时 ⌘+Enter 用此 offset 取语句。 */
  cursorOffset: number;
  result: QueryResult | null;
  error: string | null;
  elapsed: number | null;
  running: boolean;
};

export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_SQL = `SELECT version();`;

/** 未提交的新建行在 tabDirtyRows 中的 key 前缀 */
export const NEW_ROW_KEY_PREFIX = "__new__:";
/** 预览网格行对象上标记 pending insert 的内部字段（非表列） */
export const PENDING_INSERT_ROW_KEY = "__pendingRowKey";

export function createDefaultTablePreviewState(): TablePreviewState {
  return { loading: false, error: null, data: null, totalRows: 0, page: 0, pageSize: DEFAULT_PAGE_SIZE };
}

export function createDefaultSqlTabState(database = ""): SqlTabState {
  return {
    sql: DEFAULT_SQL,
    database,
    cursorOffset: 0,
    result: null,
    error: null,
    elapsed: 0,
    running: false,
  };
}

export function tabModeToEditorOpenMode(mode: "data" | "sql"): SqlEditorOpenMode {
  return mode === "data" ? "table" : "query";
}

export function rowsToRecord(
  columns: string[],
  rows: unknown[][],
): Record<string, unknown>[] {
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i]] = row[i];
    }
    return obj;
  });
}

export type { DbColumnMeta };
