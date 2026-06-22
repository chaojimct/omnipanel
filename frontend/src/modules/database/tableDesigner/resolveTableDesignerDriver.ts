import type { DbConnectionConfig } from "../api";
import { connectionHasTableSchemaChildren } from "../api";
import { mysqlTableDesignerDriver } from "./drivers/mysqlDriver";
import { postgresTableDesignerDriver } from "./drivers/postgresDriver";
import { sqliteTableDesignerDriver } from "./drivers/sqliteDriver";
import { sqlserverTableDesignerDriver } from "./drivers/sqlserverDriver";
import { createGenericDriver } from "./drivers/genericDriver";
import type { TableDesignerDriver } from "./types";

const UNSUPPORTED_DRIVER: TableDesignerDriver = {
  ...createGenericDriver("unsupported", "Unsupported"),
  supportsTableDesign: false,
  buildApplySql: () => [],
  hasModelChanges: () => false,
};

export function resolveTableDesignerDriver(
  connection: Pick<DbConnectionConfig, "db_type">,
): TableDesignerDriver {
  if (!connectionHasTableSchemaChildren(connection)) {
    return UNSUPPORTED_DRIVER;
  }

  const engine = connection.db_type.toLowerCase();
  if (engine.includes("mysql") || engine === "mariadb") {
    return mysqlTableDesignerDriver;
  }
  if (engine.includes("postgres")) {
    return postgresTableDesignerDriver;
  }
  if (engine.includes("sqlite")) {
    return sqliteTableDesignerDriver;
  }
  if (engine.includes("sqlserver") || engine.includes("mssql")) {
    return sqlserverTableDesignerDriver;
  }
  return createGenericDriver(engine, engine.toUpperCase());
}

export function supportsTableDesign(
  connection: Pick<DbConnectionConfig, "db_type">,
): boolean {
  return resolveTableDesignerDriver(connection).supportsTableDesign;
}
