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

interface SqlStatementPart {
  sql: string;
  hadTrailingSemicolon: boolean;
}

/** 按分号切分多条 SQL（忽略字符串与注释中的分号）。 */
export function splitSqlStatements(text: string): SqlStatementPart[] {
  const parts: SqlStatementPart[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let lineComment = false;
  let blockComment = false;

  const pushCurrent = (hadTrailingSemicolon: boolean) => {
    const trimmed = current.trim();
    if (trimmed) {
      parts.push({ sql: trimmed, hadTrailingSemicolon });
    }
    current = "";
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (lineComment) {
      current += ch;
      if (ch === "\n") {
        lineComment = false;
      }
      continue;
    }

    if (blockComment) {
      current += ch;
      if (ch === "*" && next === "/") {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === "-" && next === "-") {
        lineComment = true;
        current += ch + next;
        i += 1;
        continue;
      }
      if (ch === "/" && next === "*") {
        blockComment = true;
        current += ch + next;
        i += 1;
        continue;
      }
    }

    if (ch === "'" && !inDouble && !inBacktick) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (ch === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (ch === "`" && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      current += ch;
      continue;
    }

    if (ch === ";" && !inSingle && !inDouble && !inBacktick) {
      pushCurrent(true);
      continue;
    }

    current += ch;
  }

  pushCurrent(false);
  return parts;
}

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

function formatSingleStatement(raw: string): string {
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

/** 格式化 SQL 文本：子句换行、关键字大写，保留字符串与注释。 */
export function formatSql(input: string): string {
  const normalized = input.replace(/\r\n/g, "\n");
  const endedWithSemicolon = normalized.trimEnd().endsWith(";");
  const parts = splitSqlStatements(normalized);
  if (parts.length === 0) {
    return normalized.trim();
  }

  const formattedParts = parts.map((part) => formatSingleStatement(part.sql));
  const joined = formattedParts.join(";\n\n");
  if (parts.length === 1 && !parts[0].hadTrailingSemicolon && !endedWithSemicolon) {
    return joined;
  }
  return `${joined};`;
}
