import { format as formatWithSqlFormatter, type FormatOptionsWithLanguage } from "sql-formatter";
import { splitSqlStatements } from "./sqlLex";
import { resolveSqlDialect } from "./sqlDialect";

const MAJOR_CLAUSES = [
  "UNION ALL",
  "UNION",
  "INSERT INTO",
  "DELETE FROM",
  "UPDATE",
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "LIMIT",
  "LEFT JOIN",
  "RIGHT JOIN",
  "INNER JOIN",
  "JOIN",
  "SET",
  "VALUES",
  "ON",
] as const;

const CLAUSE_REGEX = MAJOR_CLAUSES.slice()
  .sort((a, b) => b.length - a.length)
  .map((clause) => clause.replace(/\s+/g, "\\s+"))
  .join("|");

function protectLiterals(sql: string): { text: string; restore: (value: string) => string } {
  const preserved: string[] = [];
  const placeholder = (value: string) => {
    const index = preserved.length;
    preserved.push(value);
    return `__SQL_FMT_${index}__`;
  };

  let text = sql;
  text = text.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g, placeholder);
  text = text.replace(/--[^\n]*/g, placeholder);
  text = text.replace(/\/\*[\s\S]*?\*\//g, placeholder);

  return {
    text,
    restore: (value: string) =>
      value.replace(/__SQL_FMT_(\d+)__/g, (_, index) => preserved[Number(index)] ?? ""),
  };
}

/** 正则降级格式化（单条语句）。 */
export function formatSingleStatementLegacy(raw: string): string {
  const { text, restore } = protectLiterals(raw);
  let formatted = text.replace(/\s+/g, " ").trim();
  if (!formatted) {
    return "";
  }

  for (const clause of MAJOR_CLAUSES.slice().sort((a, b) => b.length - a.length)) {
    const pattern = clause.replace(/\s+/g, "\\s+");
    formatted = formatted.replace(
      new RegExp(`\\b(${pattern})\\b`, "gi"),
      (_match, keyword: string) => `\n${keyword.toUpperCase()}`,
    );
  }

  formatted = formatted
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const clauseMatch = line.match(new RegExp(`^(${CLAUSE_REGEX})\\b`, "i"));
      if (!clauseMatch) {
        return line;
      }
      const clause = clauseMatch[1];
      const rest = line.slice(clause.length).trimStart();
      return rest ? `${clause.toUpperCase()} ${rest}` : clause.toUpperCase();
    })
    .join("\n");

  return restore(formatted);
}

function formatStatementWithEngine(sql: string, dbType?: string | null): string {
  const trimmed = sql.trim();
  if (!trimmed) {
    return "";
  }

  const { formatterLanguage } = resolveSqlDialect(dbType);
  const { text, restore } = protectLiterals(trimmed);

  try {
    const options: FormatOptionsWithLanguage = {
      language: formatterLanguage,
      tabWidth: 2,
      keywordCase: "upper",
    };
    return restore(formatWithSqlFormatter(text, options));
  } catch {
    return formatSingleStatementLegacy(trimmed);
  }
}

/** 格式化单条 SQL。 */
export function formatStatement(sql: string, dbType?: string | null): string {
  return formatStatementWithEngine(sql, dbType);
}

/** 格式化 SQL 文本（多条语句以 ; 分隔）。 */
export function formatSql(input: string, dbType?: string | null): string {
  const normalized = input.replace(/\r\n/g, "\n");
  const endedWithSemicolon = normalized.trimEnd().endsWith(";");
  const parts = splitSqlStatements(normalized);
  if (parts.length === 0) {
    return normalized.trim();
  }

  const formattedParts = parts.map((part) => formatStatementWithEngine(part.sql, dbType));
  const joined = formattedParts.join(";\n\n");
  if (parts.length === 1 && !parts[0].hadTrailingSemicolon && !endedWithSemicolon) {
    return joined;
  }
  return `${joined};`;
}

/**
 * 格式化文档片段并映射光标：在 [rangeFrom, rangeTo) 内格式化，返回新文本与光标位置。
 */
export function formatSqlRange(
  doc: string,
  rangeFrom: number,
  rangeTo: number,
  cursor: number,
  dbType?: string | null,
): { text: string; cursor: number } {
  const before = doc.slice(0, rangeFrom);
  const target = doc.slice(rangeFrom, rangeTo);
  const after = doc.slice(rangeTo);
  const relativeCursor = Math.max(0, Math.min(cursor - rangeFrom, target.length));
  const ratio = target.length > 0 ? relativeCursor / target.length : 0;

  const formatted = formatStatement(target, dbType);
  if (formatted === target) {
    return { text: doc, cursor };
  }

  const newDoc = before + formatted + after;
  const newCursor = before.length + Math.round(formatted.length * ratio);
  return { text: newDoc, cursor: Math.min(newCursor, newDoc.length) };
}

export { splitSqlStatements } from "./sqlLex";
