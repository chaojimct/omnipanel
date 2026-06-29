import { resolveSqlDialect, type SqlDialectProfile } from "../../sqlIntel/sqlDialect";

export type ParserDialect = NonNullable<SqlDialectProfile["parserDialect"]>;

/** 连接 db_type → node-sql-parser database 选项。 */
export function resolveParserDialect(dbType?: string | null): ParserDialect | undefined {
  return resolveSqlDialect(dbType).parserDialect ?? undefined;
}

export function parserDatabaseOption(dbType?: string | null): { database?: ParserDialect } {
  const dialect = resolveParserDialect(dbType);
  return dialect ? { database: dialect } : {};
}
