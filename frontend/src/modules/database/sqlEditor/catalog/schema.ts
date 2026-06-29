/** SQL 编辑器元数据目录类型（Catalog）。 */

export interface Column {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
  kind?: "table" | "view";
}

export interface Database {
  name: string;
  tables: Table[];
}

export interface CatalogSnapshot {
  databases: Database[];
}

/** 与 DatabasePanel 侧 `DatabaseSchema` 兼容的别名。 */
export type { Column as ColumnSchema, Table as TableSchema, Database as DatabaseSchema };
