import { MySQL, PostgreSQL, SQLite, StandardSQL } from "@codemirror/lang-sql";
import type { SQLDialect } from "@codemirror/lang-sql";
import type { SqlLanguage } from "sql-formatter";

export interface SqlDialectProfile {
  cmDialect: SQLDialect;
  formatterLanguage: SqlLanguage;
  parserDialect: "mysql" | "postgresql" | "sqlite" | null;
}

const MYSQL_PROFILE: SqlDialectProfile = {
  cmDialect: MySQL,
  formatterLanguage: "mysql",
  parserDialect: "mysql",
};

const POSTGRES_PROFILE: SqlDialectProfile = {
  cmDialect: PostgreSQL,
  formatterLanguage: "postgresql",
  parserDialect: "postgresql",
};

const SQLITE_PROFILE: SqlDialectProfile = {
  cmDialect: SQLite,
  formatterLanguage: "sqlite",
  parserDialect: "sqlite",
};

const DEFAULT_PROFILE: SqlDialectProfile = {
  cmDialect: StandardSQL,
  formatterLanguage: "sql",
  parserDialect: null,
};

/** 连接 db_type → CodeMirror / formatter / parser 方言。 */
export function resolveSqlDialect(dbType?: string | null): SqlDialectProfile {
  const engine = (dbType ?? "").trim().toLowerCase();
  if (engine === "mysql" || engine === "mariadb") {
    return MYSQL_PROFILE;
  }
  if (engine === "postgresql" || engine === "postgres") {
    return POSTGRES_PROFILE;
  }
  if (engine === "sqlite") {
    return SQLITE_PROFILE;
  }
  return DEFAULT_PROFILE;
}
