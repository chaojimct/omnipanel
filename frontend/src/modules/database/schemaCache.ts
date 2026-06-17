import type { DbTableSchema } from "./api";

export interface SchemaCacheDatabaseEntry {
  name: string;
  tables: DbTableSchema[];
  loadError?: string;
}

export interface SchemaCacheConnectionEntry {
  databases: SchemaCacheDatabaseEntry[];
  refreshedAt?: number;
  error?: string;
}

export interface SchemaCacheSnapshot {
  connections: Record<string, SchemaCacheConnectionEntry>;
}

export function emptySchemaCacheSnapshot(): SchemaCacheSnapshot {
  return { connections: {} };
}
