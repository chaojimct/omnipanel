export interface ColumnSchema {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  /** 表或视图，默认 table。 */
  kind?: "table" | "view";
}

export interface DatabaseSchema {
  name: string;
  tables: TableSchema[];
}
