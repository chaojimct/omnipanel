import { linter, type Diagnostic } from "@codemirror/lint";
import type { EditorView } from "@codemirror/view";
import { findStatementRangeAtOffset } from "../../sqlIntel/sqlLex";
import { formatParseError } from "../parser/ast";

const KEYWORD_TYPO_SUGGESTIONS: Record<string, string> = {
  FORM: "FROM",
  FORMED: "FROM",
  WERE: "WHERE",
  WHRE: "WHERE",
  SELCT: "SELECT",
  SLECT: "SELECT",
  INSER: "INSERT",
  UDPATE: "UPDATE",
  DELTE: "DELETE",
  GROP: "GROUP",
  OREDER: "ORDER",
  JION: "JOIN",
};

function scanKeywordTypos(text: string, baseOffset: number): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const re = /\b([A-Z]{3,})\b/g;
  for (const match of text.matchAll(re)) {
    const word = match[1];
    const suggestion = KEYWORD_TYPO_SUGGESTIONS[word];
    if (!suggestion) continue;
    const from = baseOffset + (match.index ?? 0);
    diagnostics.push({
      from,
      to: from + word.length,
      severity: "error",
      message: `未知关键字 ${word}，是否应为 ${suggestion}？`,
    });
  }
  return diagnostics;
}

/** SQL 语法 Lint：Parser 错误 + 常见关键字拼写。 */
export function createSqlLinter(getDbType?: () => string | undefined) {
  return linter((view: EditorView) => {
    const doc = view.state.doc.toString();
    const head = view.state.selection.main.head;
    const { from, to } = findStatementRangeAtOffset(doc, head);
    const statement = doc.slice(from, to).trim();
    if (!statement) return [];

    const diagnostics: Diagnostic[] = scanKeywordTypos(statement, from);
    const parseError = formatParseError(statement, getDbType?.());
    if (parseError) {
      diagnostics.push({
        from,
        to: Math.min(from + statement.length, doc.length),
        severity: "warning",
        message: parseError,
      });
    }
    return diagnostics;
  });
}
