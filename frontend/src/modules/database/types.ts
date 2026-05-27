export interface ColumnSchema {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export interface DatabaseSchema {
  name: string;
  tables: TableSchema[];
}
