import type { TablePreviewState } from "./dbWorkspaceState";

export type SqlWorkspaceTab = {
  id: string;
  kind: "sql";
  label: string;
};

export type DatabaseListWorkspaceTab = {
  id: string;
  kind: "database";
  label: string;
  connId: string;
  dbName: string;
};

export type DbWorkspaceTab = SqlWorkspaceTab | DatabaseListWorkspaceTab;

export function isSqlWorkspaceTab(tab: DbWorkspaceTab): tab is SqlWorkspaceTab {
  return tab.kind === "sql";
}

export function isDatabaseListTab(tab: DbWorkspaceTab): tab is DatabaseListWorkspaceTab {
  return tab.kind === "database";
}

export function makeSqlTabId(): string {
  return `sql:${Date.now()}`;
}

export function makeDatabaseTabId(): string {
  return `dbtab:${Date.now()}`;
}

export function makeSqlTabLabel(sqlTabCount: number): string {
  return sqlTabCount <= 1 ? "SQL" : `SQL ${sqlTabCount}`;
}

export function makeTableTabLabel(dbName: string, tableName: string) {
  return `${dbName}.${tableName}`;
}

/** 数据库列表 Tab 唯一键：连接 + 库名 */
export function makeDatabaseTabKey(connId: string, dbName: string): string {
  return `db:${connId}:${dbName}`;
}

/** 表 Tab 唯一键：连接 + 库 + 表名 */
export function makeTableTabKey(connId: string, dbName: string, tableName: string): string {
  return `tbl:${connId}:${dbName}:${tableName}`;
}

/** 查找已打开指定数据库的列表 Tab */
export function findTabIdForDatabase(
  tabs: DbWorkspaceTab[],
  connId: string,
  dbName: string,
): string | undefined {
  return tabs.find(
    (tab) => tab.kind === "database" && tab.connId === connId && tab.dbName === dbName,
  )?.id;
}

/** 查找已打开指定表的工作区 Tab，未找到返回 undefined */
export function findTabIdForTable(
  tablePreviews: Record<string, TablePreviewState>,
  openTabIds: Iterable<string>,
  connId: string,
  dbName: string,
  tableName: string,
): string | undefined {
  const openIds = new Set(openTabIds);
  for (const [tabId, preview] of Object.entries(tablePreviews)) {
    if (!openIds.has(tabId)) continue;
    if (
      preview.connId === connId &&
      preview.dbName === dbName &&
      preview.tableName === tableName
    ) {
      return tabId;
    }
  }
  return undefined;
}
