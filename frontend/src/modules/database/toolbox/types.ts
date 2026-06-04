import type { DbColumnMeta, DbConnectionConfig } from "../api";

export type ToolboxTabId = "dataSync" | "schemaSync";

/** 源表在目标库中的存在状态（仅数据同步、已勾选时展示） */
export type TableTargetStatus = "checking" | "new" | "conflict";

/** 冲突表的数据同步策略 */
export type DataSyncStrategy = "rewrite" | "append" | "update";

export type SyncSideId = "source" | "target";

export interface SyncSideSelection {
  connectionId: string;
  database: string;
}

export interface SyncTableInfo {
  name: string;
  columns: DbColumnMeta[];
  rowCount: number | null;
}

export interface SyncSideSnapshot {
  tables: SyncTableInfo[];
  loading: boolean;
  error: string | null;
}

export function connectionWithDatabase(
  conn: DbConnectionConfig,
  database: string,
): DbConnectionConfig {
  return { ...conn, database: database.trim() };
}
