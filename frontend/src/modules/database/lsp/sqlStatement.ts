/** @deprecated 请使用 sqlIntel/sqlStatement */
export {
  positionToOffset,
  extractStatementAtOffset,
  sqlAtOffset,
  isSqlEditorFocused,
  isSqlMonacoEditorFocused,
} from "../sqlIntel/sqlStatement";

export { findStatementRangeAtOffset, splitSqlStatements } from "../sqlIntel/sqlLex";
