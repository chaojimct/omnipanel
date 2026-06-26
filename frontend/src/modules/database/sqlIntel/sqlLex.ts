/** SQL 词法扫描：识别字符串、注释与语句分隔分号。 */

export interface SqlStatementPart {
  /** trim 后的语句文本 */
  sql: string;
  /** 文档中的 [from, to) 范围（trim 后语句在文档中的位置） */
  from: number;
  to: number;
  hadTrailingSemicolon: boolean;
}

function isEscaped(sql: string, i: number): boolean {
  let slashes = 0;
  for (let j = i - 1; j >= 0 && sql[j] === "\\"; j -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}

interface LexFlags {
  inSingle: boolean;
  inDouble: boolean;
  inBacktick: boolean;
  lineComment: boolean;
  blockComment: boolean;
}

function createLexFlags(): LexFlags {
  return {
    inSingle: false,
    inDouble: false,
    inBacktick: false,
    lineComment: false,
    blockComment: false,
  };
}

function stepLex(sql: string, i: number, flags: LexFlags): number {
  const ch = sql[i];
  const next = sql[i + 1];

  if (flags.lineComment) {
    if (ch === "\n") {
      flags.lineComment = false;
    }
    return i;
  }

  if (flags.blockComment) {
    if (ch === "*" && next === "/") {
      flags.blockComment = false;
      return i + 1;
    }
    return i;
  }

  if (!flags.inSingle && !flags.inDouble && !flags.inBacktick) {
    if (ch === "-" && next === "-") {
      flags.lineComment = true;
      return i + 1;
    }
    if (ch === "/" && next === "*") {
      flags.blockComment = true;
      return i + 1;
    }
  }

  if (ch === "'" && !flags.inDouble && !flags.inBacktick && !isEscaped(sql, i)) {
    flags.inSingle = !flags.inSingle;
    return i;
  }
  if (ch === '"' && !flags.inSingle && !flags.inBacktick && !isEscaped(sql, i)) {
    flags.inDouble = !flags.inDouble;
    return i;
  }
  if (ch === "`" && !flags.inSingle && !flags.inDouble) {
    flags.inBacktick = !flags.inBacktick;
  }
  return i;
}

function isSemicolonDelimiter(sql: string, i: number, flags: LexFlags): boolean {
  return (
    sql[i] === ";" &&
    !flags.inSingle &&
    !flags.inDouble &&
    !flags.inBacktick &&
    !flags.lineComment &&
    !flags.blockComment
  );
}

/** 光标所在语句在文档中的 [from, to) 范围（含语句区段内空白，不含分隔分号）。 */
export function findStatementRangeAtOffset(
  sql: string,
  offset: number,
): { from: number; to: number } {
  const pos = Math.max(0, Math.min(offset, sql.length));
  let start = 0;
  const flags = createLexFlags();

  for (let i = 0; i < pos; i += 1) {
    if (isSemicolonDelimiter(sql, i, flags)) {
      start = i + 1;
    }
    i = stepLex(sql, i, flags);
  }

  const endFlags = createLexFlags();
  for (let i = 0; i < pos; i += 1) {
    i = stepLex(sql, i, endFlags);
  }

  let end = sql.length;
  for (let i = pos; i < sql.length; i += 1) {
    if (isSemicolonDelimiter(sql, i, endFlags)) {
      end = i;
      break;
    }
    i = stepLex(sql, i, endFlags);
  }

  return { from: start, to: end };
}

/** 按分号切分多条 SQL（忽略字符串与注释中的分号）。 */
export function splitSqlStatements(text: string): SqlStatementPart[] {
  const normalized = text.replace(/\r\n/g, "\n");
  const parts: SqlStatementPart[] = [];
  let statementStart = 0;
  const flags = createLexFlags();

  for (let i = 0; i < normalized.length; i += 1) {
    if (isSemicolonDelimiter(normalized, i, flags)) {
      const raw = normalized.slice(statementStart, i);
      const trimmed = raw.trim();
      if (trimmed) {
        const lead = raw.length - raw.trimStart().length;
        parts.push({
          sql: trimmed,
          from: statementStart + lead,
          to: statementStart + lead + trimmed.length,
          hadTrailingSemicolon: true,
        });
      }
      statementStart = i + 1;
    }
    i = stepLex(normalized, i, flags);
  }

  const tail = normalized.slice(statementStart);
  const trimmedTail = tail.trim();
  if (trimmedTail) {
    const lead = tail.length - tail.trimStart().length;
    parts.push({
      sql: trimmedTail,
      from: statementStart + lead,
      to: statementStart + lead + trimmedTail.length,
      hadTrailingSemicolon: false,
    });
  }

  return parts;
}
