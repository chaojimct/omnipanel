function mysqlQuoteId(name: string): string {
  return `\`${name.replace(/`/g, "``")}\``;
}

function pgQuoteId(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function normalizeEngine(dbType: string): "mysql" | "postgres" | "other" {
  const engine = dbType.toLowerCase();
  if (engine === "mysql" || engine === "mariadb") {
    return "mysql";
  }
  if (engine === "postgresql" || engine === "postgres") {
    return "postgres";
  }
  return "other";
}

export function isSchemaDropSqlSupported(dbType: string): boolean {
  return normalizeEngine(dbType) !== "other";
}

export function buildDropColumnSql(
  dbType: string,
  dbName: string,
  tableName: string,
  columnName: string,
): string | null {
  const engine = normalizeEngine(dbType);
  if (engine === "mysql") {
    const tableRef = `${mysqlQuoteId(dbName.trim())}.${mysqlQuoteId(tableName.trim())}`;
    return `ALTER TABLE ${tableRef} DROP COLUMN ${mysqlQuoteId(columnName.trim())}`;
  }
  if (engine === "postgres") {
    const schema = "public";
    const tableRef = `${pgQuoteId(schema)}.${pgQuoteId(tableName.trim())}`;
    return `ALTER TABLE ${tableRef} DROP COLUMN ${pgQuoteId(columnName.trim())}`;
  }
  return null;
}

export function buildDropIndexSql(
  dbType: string,
  dbName: string,
  tableName: string,
  indexName: string,
): string | null {
  const engine = normalizeEngine(dbType);
  const name = indexName.trim();
  if (engine === "mysql") {
    const tableRef = `${mysqlQuoteId(dbName.trim())}.${mysqlQuoteId(tableName.trim())}`;
    return `ALTER TABLE ${tableRef} DROP INDEX ${mysqlQuoteId(name)}`;
  }
  if (engine === "postgres") {
    const schema = "public";
    return `DROP INDEX IF EXISTS ${pgQuoteId(schema)}.${pgQuoteId(name)}`;
  }
  return null;
}
