import { Parser } from "node-sql-parser";
import type { AST, Select, From, ColumnRef } from "node-sql-parser";
import type { DatabaseSchema, TableSchema } from "../types";

const SQL_KEYWORDS = [
  { label: "SELECT", insertText: "SELECT ", detail: "Retrieve rows" },
  { label: "FROM", insertText: "FROM ", detail: "Specify source table" },
  { label: "WHERE", insertText: "WHERE ", detail: "Filter results" },
  { label: "AND", insertText: "AND ", detail: "Logical AND" },
  { label: "OR", insertText: "OR ", detail: "Logical OR" },
  { label: "NOT", insertText: "NOT ", detail: "Logical NOT" },
  { label: "IN", insertText: "IN ", detail: "Check value in set" },
  { label: "IS", insertText: "IS ", detail: "Null comparison" },
  { label: "NULL", insertText: "NULL", detail: "Null value" },
  { label: "JOIN", insertText: "JOIN ", detail: "Join tables" },
  { label: "LEFT JOIN", insertText: "LEFT JOIN ", detail: "Left outer join" },
  { label: "RIGHT JOIN", insertText: "RIGHT JOIN ", detail: "Right outer join" },
  { label: "INNER JOIN", insertText: "INNER JOIN ", detail: "Inner join" },
  { label: "ON", insertText: "ON ", detail: "Join condition" },
  { label: "AS", insertText: "AS ", detail: "Alias" },
  { label: "ORDER BY", insertText: "ORDER BY ", detail: "Sort results" },
  { label: "GROUP BY", insertText: "GROUP BY ", detail: "Group results" },
  { label: "HAVING", insertText: "HAVING ", detail: "Filter groups" },
  { label: "LIMIT", insertText: "LIMIT ", detail: "Limit rows" },
  { label: "OFFSET", insertText: "OFFSET ", detail: "Skip rows" },
  { label: "DISTINCT", insertText: "DISTINCT ", detail: "Unique rows only" },
  { label: "INSERT INTO", insertText: "INSERT INTO ", detail: "Insert rows" },
  { label: "VALUES", insertText: "VALUES ", detail: "Row values" },
  { label: "UPDATE", insertText: "UPDATE ", detail: "Update rows" },
  { label: "SET", insertText: "SET ", detail: "Set columns" },
  { label: "DELETE", insertText: "DELETE ", detail: "Delete rows" },
  { label: "CREATE TABLE", insertText: "CREATE TABLE ", detail: "Create table" },
  { label: "ALTER TABLE", insertText: "ALTER TABLE ", detail: "Alter table" },
  { label: "DROP TABLE", insertText: "DROP TABLE ", detail: "Drop table" },
  { label: "BETWEEN", insertText: "BETWEEN ", detail: "Range check" },
  { label: "LIKE", insertText: "LIKE ", detail: "Pattern match" },
  { label: "EXISTS", insertText: "EXISTS ", detail: "Subquery exists" },
  { label: "CASE", insertText: "CASE ", detail: "Case expression" },
  { label: "WHEN", insertText: "WHEN ", detail: "Case when" },
  { label: "THEN", insertText: "THEN ", detail: "Case then" },
  { label: "ELSE", insertText: "ELSE ", detail: "Case else" },
  { label: "END", insertText: "END", detail: "End clause" },
  { label: "UNION", insertText: "UNION ", detail: "Combine queries" },
  { label: "WITH", insertText: "WITH ", detail: "CTE" },
  { label: "RETURNING", insertText: "RETURNING ", detail: "Return inserted rows" },
];

const SQL_FUNCTIONS = [
  { label: "COUNT", insertText: "COUNT($1)", snippet: true, detail: "Count rows" },
  { label: "SUM", insertText: "SUM($1)", snippet: true, detail: "Sum values" },
  { label: "AVG", insertText: "AVG($1)", snippet: true, detail: "Average values" },
  { label: "MIN", insertText: "MIN($1)", snippet: true, detail: "Minimum value" },
  { label: "MAX", insertText: "MAX($1)", snippet: true, detail: "Maximum value" },
  { label: "COALESCE", insertText: "COALESCE($1, $2)", snippet: true, detail: "First non-null" },
  { label: "NULLIF", insertText: "NULLIF($1, $2)", snippet: true, detail: "Null if equal" },
  { label: "NOW", insertText: "NOW()", detail: "Current timestamp" },
  { label: "CURRENT_DATE", insertText: "CURRENT_DATE", detail: "Current date" },
  { label: "EXTRACT", insertText: "EXTRACT($1 FROM $2)", snippet: true, detail: "Extract date part" },
  { label: "UPPER", insertText: "UPPER($1)", snippet: true, detail: "Uppercase" },
  { label: "LOWER", insertText: "LOWER($1)", snippet: true, detail: "Lowercase" },
  { label: "LENGTH", insertText: "LENGTH($1)", snippet: true, detail: "String length" },
  { label: "SUBSTRING", insertText: "SUBSTRING($1 FROM $2 FOR $3)", snippet: true, detail: "Extract substring" },
  { label: "CONCAT", insertText: "CONCAT($1, $2)", snippet: true, detail: "Concatenate strings" },
  { label: "TRIM", insertText: "TRIM($1)", snippet: true, detail: "Trim whitespace" },
  { label: "REPLACE", insertText: "REPLACE($1, $2, $3)", snippet: true, detail: "Replace substring" },
  { label: "ROUND", insertText: "ROUND($1, $2)", snippet: true, detail: "Round number" },
  { label: "ABS", insertText: "ABS($1)", snippet: true, detail: "Absolute value" },
  { label: "CAST", insertText: "CAST($1 AS $2)", snippet: true, detail: "Type cast" },
  { label: "STRING_AGG", insertText: "STRING_AGG($1, $2)", snippet: true, detail: "Aggregate strings" },
  { label: "ARRAY_AGG", insertText: "ARRAY_AGG($1)", snippet: true, detail: "Aggregate to array" },
  { label: "ROW_NUMBER", insertText: "ROW_NUMBER() OVER ($1)", snippet: true, detail: "Row number" },
  { label: "RANK", insertText: "RANK() OVER ($1)", snippet: true, detail: "Rank" },
];

interface TableAlias {
  name: string;
  alias: string | null;
}

interface CompletionItem {
  label: string;
  kind: number;
  insertText?: string;
  detail?: string;
  snippet?: boolean;
}

function kindMap(k: "keyword" | "function" | "column" | "table"): number {
  return { keyword: 14, function: 3, column: 5, table: 22 }[k];
}

function extractTableAliases(sql: string): TableAlias[] {
  try {
    const parser = new Parser();
    const r = parser.parse(sql);
    const asts = Array.isArray(r.ast) ? r.ast : [r.ast];
    const aliases: TableAlias[] = [];

    for (const stmt of asts) {
      if (stmt.type !== "select") continue;
      const sel = stmt as Select;
      if (!sel.from) continue;
      const froms = Array.isArray(sel.from) ? sel.from : [sel.from];
      for (const f of froms) {
        if ("table" in f && f.table) {
          aliases.push({ name: f.table, alias: f.as || null });
        }
        if ("join" in f && f.join) {
          aliases.push({ name: f.table, alias: f.as || null });
        }
      }
    }
    return aliases;
  } catch {
    return [];
  }
}

function tableAliasMap(aliases: TableAlias[]): Map<string, string | null> {
  const m = new Map<string, string | null>();
  for (const a of aliases) m.set(a.name, a.alias);
  return m;
}

function filterItems<T extends { label: string }>(items: T[], prefix: string): T[] {
  const up = prefix.toUpperCase();
  return items.filter(
    (item) =>
      item.label.toUpperCase().startsWith(up) ||
      item.label.toUpperCase().includes(up),
  );
}

export function getCompletionItems(
  text: string,
  offset: number,
  schemas: DatabaseSchema[],
): CompletionItem[] {
  const before = text.slice(0, offset);
  const lineBefore = before.split("\n").pop() ?? "";
  const wordMatch = lineBefore.match(/(\w+)$/);
  const prefix = wordMatch ? wordMatch[1] : "";
  const beforeWord = lineBefore.slice(0, lineBefore.length - prefix.length);

  // Detect alias.column pattern
  const dotMatch = beforeWord.match(/(\w+)\.\s*$/);
  if (dotMatch) {
    const alias = dotMatch[1];
    const aliases = extractTableAliases(text);
    const targetAlias = aliases.find((a) => a.alias === alias || a.name === alias);
    if (targetAlias) {
      for (const db of schemas) {
        const tbl = db.tables.find(
          (t) => t.name === targetAlias.name || t.name === targetAlias.alias,
        );
        if (tbl) {
          return filterItems(
            tbl.columns.map((c) => ({
              label: c.name,
              kind: kindMap("column"),
              detail: `${c.type} · ${tbl.name}`,
            })),
            prefix,
          );
        }
      }
    }
    return [];
  }

  // Detect table/production context
  const tableCtx = beforeWord.match(
    /(?:FROM|JOIN|INTO|UPDATE|TABLE|INDEX\s+ON)\s+$/i,
  );
  if (tableCtx) {
    const items: CompletionItem[] = [];
    for (const db of schemas) {
      for (const t of db.tables) {
        items.push({
          label: t.name,
          kind: kindMap("table"),
          detail: `table (${t.columns.length} columns)`,
        });
      }
    }
    return filterItems(items, prefix);
  }

  // Detect column/production context: SELECT, WHERE, AND, OR, ON, SET, etc.
  const columnCtx = beforeWord.match(
    /(?:SELECT|WHERE|AND|OR|ON|SET|BETWEEN|IN|LIKE|HAVING|ORDER\s+BY|GROUP\s+BY)\s+$/i,
  );
  if (columnCtx) {
    const aliases = extractTableAliases(text);
    const aliasMap = tableAliasMap(aliases);
    const items: CompletionItem[] = [];

    for (const a of aliases) {
      for (const db of schemas) {
        const t = db.tables.find((t) => t.name === a.name);
        if (!t) continue;
        for (const c of t.columns) {
          const label = a.alias ? `${a.alias}.${c.name}` : c.name;
          items.push({
            label,
            kind: kindMap("column"),
            detail: `${c.type} · ${t.name}${a.alias ? ` (${a.alias})` : ""}`,
          });
        }
      }
    }

    if (items.length === 0) {
      // No schema context - show all columns from all tables
      for (const db of schemas) {
        for (const t of db.tables) {
          for (const c of t.columns) {
            items.push({
              label: c.name,
              kind: kindMap("column"),
              detail: `${c.type} · ${t.name}`,
            });
          }
        }
      }
    }

    return filterItems([...items, ...SQL_FUNCTIONS], prefix);
  }

  // Default: keywords + functions
  const defaults = filterItems([...SQL_KEYWORDS, ...SQL_FUNCTIONS], prefix);

  // Also include column names if it looks like the start of SELECT
  if (prefix.length > 0) {
    const aliases = extractTableAliases(text);
    const aliasMap = tableAliasMap(aliases);
    const cols: CompletionItem[] = [];
    for (const a of aliases) {
      for (const db of schemas) {
        const t = db.tables.find((t) => t.name === a.name);
        if (!t) continue;
        for (const c of t.columns) {
          cols.push({
            label: c.name,
            kind: kindMap("column"),
            detail: `${c.type} · ${t.name}${a.alias ? ` (${a.alias})` : ""}`,
          });
        }
      }
    }
    return filterItems([...cols, ...defaults], prefix);
  }

  return defaults;
}
