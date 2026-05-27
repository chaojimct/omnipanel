import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from "vscode-languageserver-types";
import type { DatabaseSchema, TableSchema, ColumnSchema } from "../types";

const SQL_KEYWORDS: CompletionItem[] = [
  { label: "SELECT", kind: CompletionItemKind.Keyword, insertText: "SELECT ", detail: "Retrieve rows" },
  { label: "FROM", kind: CompletionItemKind.Keyword, insertText: "FROM ", detail: "Specify source table" },
  { label: "WHERE", kind: CompletionItemKind.Keyword, insertText: "WHERE ", detail: "Filter results" },
  { label: "AND", kind: CompletionItemKind.Keyword, insertText: "AND ", detail: "Logical AND" },
  { label: "OR", kind: CompletionItemKind.Keyword, insertText: "OR ", detail: "Logical OR" },
  { label: "NOT", kind: CompletionItemKind.Keyword, insertText: "NOT ", detail: "Logical NOT" },
  { label: "IN", kind: CompletionItemKind.Keyword, insertText: "IN ", detail: "Check value in set" },
  { label: "IS", kind: CompletionItemKind.Keyword, insertText: "IS ", detail: "Null comparison" },
  { label: "NULL", kind: CompletionItemKind.Keyword, insertText: "NULL", detail: "Null value" },
  { label: "JOIN", kind: CompletionItemKind.Keyword, insertText: "JOIN ", detail: "Join tables" },
  { label: "LEFT JOIN", kind: CompletionItemKind.Keyword, insertText: "LEFT JOIN ", detail: "Left outer join" },
  { label: "RIGHT JOIN", kind: CompletionItemKind.Keyword, insertText: "RIGHT JOIN ", detail: "Right outer join" },
  { label: "INNER JOIN", kind: CompletionItemKind.Keyword, insertText: "INNER JOIN ", detail: "Inner join" },
  { label: "FULL JOIN", kind: CompletionItemKind.Keyword, insertText: "FULL JOIN ", detail: "Full outer join" },
  { label: "ON", kind: CompletionItemKind.Keyword, insertText: "ON ", detail: "Join condition" },
  { label: "AS", kind: CompletionItemKind.Keyword, insertText: "AS ", detail: "Alias" },
  { label: "ORDER BY", kind: CompletionItemKind.Keyword, insertText: "ORDER BY ", detail: "Sort results" },
  { label: "GROUP BY", kind: CompletionItemKind.Keyword, insertText: "GROUP BY ", detail: "Group results" },
  { label: "HAVING", kind: CompletionItemKind.Keyword, insertText: "HAVING ", detail: "Filter groups" },
  { label: "LIMIT", kind: CompletionItemKind.Keyword, insertText: "LIMIT ", detail: "Limit rows" },
  { label: "OFFSET", kind: CompletionItemKind.Keyword, insertText: "OFFSET ", detail: "Skip rows" },
  { label: "DISTINCT", kind: CompletionItemKind.Keyword, insertText: "DISTINCT ", detail: "Unique rows only" },
  { label: "INSERT INTO", kind: CompletionItemKind.Keyword, insertText: "INSERT INTO ", detail: "Insert rows" },
  { label: "VALUES", kind: CompletionItemKind.Keyword, insertText: "VALUES ", detail: "Row values" },
  { label: "UPDATE", kind: CompletionItemKind.Keyword, insertText: "UPDATE ", detail: "Update rows" },
  { label: "SET", kind: CompletionItemKind.Keyword, insertText: "SET ", detail: "Set columns" },
  { label: "DELETE", kind: CompletionItemKind.Keyword, insertText: "DELETE ", detail: "Delete rows" },
  { label: "CREATE TABLE", kind: CompletionItemKind.Keyword, insertText: "CREATE TABLE ", detail: "Create table" },
  { label: "ALTER TABLE", kind: CompletionItemKind.Keyword, insertText: "ALTER TABLE ", detail: "Alter table" },
  { label: "DROP TABLE", kind: CompletionItemKind.Keyword, insertText: "DROP TABLE ", detail: "Drop table" },
  { label: "CREATE INDEX", kind: CompletionItemKind.Keyword, insertText: "CREATE INDEX ", detail: "Create index" },
  { label: "BETWEEN", kind: CompletionItemKind.Keyword, insertText: "BETWEEN ", detail: "Range check" },
  { label: "LIKE", kind: CompletionItemKind.Keyword, insertText: "LIKE ", detail: "Pattern match" },
  { label: "ILIKE", kind: CompletionItemKind.Keyword, insertText: "ILIKE ", detail: "Case-insensitive match" },
  { label: "EXISTS", kind: CompletionItemKind.Keyword, insertText: "EXISTS ", detail: "Subquery exists" },
  { label: "CASE", kind: CompletionItemKind.Keyword, insertText: "CASE ", detail: "Case expression" },
  { label: "WHEN", kind: CompletionItemKind.Keyword, insertText: "WHEN ", detail: "Case when" },
  { label: "THEN", kind: CompletionItemKind.Keyword, insertText: "THEN ", detail: "Case then" },
  { label: "ELSE", kind: CompletionItemKind.Keyword, insertText: "ELSE ", detail: "Case else" },
  { label: "END", kind: CompletionItemKind.Keyword, insertText: "END", detail: "End clause" },
  { label: "UNION", kind: CompletionItemKind.Keyword, insertText: "UNION ", detail: "Combine queries" },
  { label: "INTERSECT", kind: CompletionItemKind.Keyword, insertText: "INTERSECT ", detail: "Intersect queries" },
  { label: "EXCEPT", kind: CompletionItemKind.Keyword, insertText: "EXCEPT ", detail: "Except queries" },
  { label: "WITH", kind: CompletionItemKind.Keyword, insertText: "WITH ", detail: "CTE" },
  { label: "RECURSIVE", kind: CompletionItemKind.Keyword, insertText: "RECURSIVE ", detail: "Recursive CTE" },
  { label: "RETURNING", kind: CompletionItemKind.Keyword, insertText: "RETURNING ", detail: "Return inserted rows" },
];

const SQL_FUNCTIONS: CompletionItem[] = [
  { label: "COUNT", kind: CompletionItemKind.Function, insertText: "COUNT($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Count rows" },
  { label: "SUM", kind: CompletionItemKind.Function, insertText: "SUM($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Sum values" },
  { label: "AVG", kind: CompletionItemKind.Function, insertText: "AVG($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Average values" },
  { label: "MIN", kind: CompletionItemKind.Function, insertText: "MIN($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Minimum value" },
  { label: "MAX", kind: CompletionItemKind.Function, insertText: "MAX($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Maximum value" },
  { label: "COALESCE", kind: CompletionItemKind.Function, insertText: "COALESCE($1, $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "First non-null" },
  { label: "NULLIF", kind: CompletionItemKind.Function, insertText: "NULLIF($1, $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Null if equal" },
  { label: "NOW", kind: CompletionItemKind.Function, insertText: "NOW()", detail: "Current timestamp" },
  { label: "CURRENT_DATE", kind: CompletionItemKind.Function, insertText: "CURRENT_DATE", detail: "Current date" },
  { label: "EXTRACT", kind: CompletionItemKind.Function, insertText: "EXTRACT($1 FROM $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Extract date part" },
  { label: "DATE_TRUNC", kind: CompletionItemKind.Function, insertText: "DATE_TRUNC('$1', $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Truncate date" },
  { label: "UPPER", kind: CompletionItemKind.Function, insertText: "UPPER($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Uppercase" },
  { label: "LOWER", kind: CompletionItemKind.Function, insertText: "LOWER($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Lowercase" },
  { label: "LENGTH", kind: CompletionItemKind.Function, insertText: "LENGTH($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "String length" },
  { label: "SUBSTRING", kind: CompletionItemKind.Function, insertText: "SUBSTRING($1 FROM $2 FOR $3)", insertTextFormat: InsertTextFormat.Snippet, detail: "Extract substring" },
  { label: "CONCAT", kind: CompletionItemKind.Function, insertText: "CONCAT($1, $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Concatenate strings" },
  { label: "TRIM", kind: CompletionItemKind.Function, insertText: "TRIM($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Trim whitespace" },
  { label: "REPLACE", kind: CompletionItemKind.Function, insertText: "REPLACE($1, $2, $3)", insertTextFormat: InsertTextFormat.Snippet, detail: "Replace substring" },
  { label: "ROUND", kind: CompletionItemKind.Function, insertText: "ROUND($1, $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Round number" },
  { label: "ABS", kind: CompletionItemKind.Function, insertText: "ABS($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Absolute value" },
  { label: "CAST", kind: CompletionItemKind.Function, insertText: "CAST($1 AS $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Type cast" },
  { label: "STRING_AGG", kind: CompletionItemKind.Function, insertText: "STRING_AGG($1, $2)", insertTextFormat: InsertTextFormat.Snippet, detail: "Aggregate strings" },
  { label: "ARRAY_AGG", kind: CompletionItemKind.Function, insertText: "ARRAY_AGG($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Aggregate to array" },
  { label: "JSON_AGG", kind: CompletionItemKind.Function, insertText: "JSON_AGG($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Aggregate to JSON" },
  { label: "ROW_NUMBER", kind: CompletionItemKind.Function, insertText: "ROW_NUMBER() OVER ($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Row number" },
  { label: "RANK", kind: CompletionItemKind.Function, insertText: "RANK() OVER ($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Rank" },
  { label: "DENSE_RANK", kind: CompletionItemKind.Function, insertText: "DENSE_RANK() OVER ($1)", insertTextFormat: InsertTextFormat.Snippet, detail: "Dense rank" },
];

function tableToItem(t: TableSchema): CompletionItem {
  return {
    label: t.name,
    kind: CompletionItemKind.Struct,
    insertText: t.name,
    detail: `table (${t.columns.length} columns)`,
  };
}

function columnToItem(c: ColumnSchema, tableName?: string): CompletionItem {
  const detail = c.type + (tableName ? ` · ${tableName}` : "");
  const insertText = c.name;
  return {
    label: c.name,
    kind: CompletionItemKind.Field,
    insertText,
    detail,
  };
}

function allColumns(schemas: DatabaseSchema[]): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (const db of schemas) {
    for (const t of db.tables) {
      for (const c of t.columns) {
        items.push(columnToItem(c, t.name));
      }
    }
  }
  return items;
}

function allTables(schemas: DatabaseSchema[]): CompletionItem[] {
  const items: CompletionItem[] = [];
  for (const db of schemas) {
    for (const t of db.tables) {
      items.push(tableToItem(t));
    }
  }
  return items;
}

function columnsForTable(schemas: DatabaseSchema[], tableName: string): CompletionItem[] {
  for (const db of schemas) {
    for (const t of db.tables) {
      if (t.name === tableName) {
        return t.columns.map((c) => columnToItem(c));
      }
    }
  }
  return [];
}

function filterItems(items: CompletionItem[], prefix: string): CompletionItem[] {
  const upper = prefix.toUpperCase();
  return items.filter(
    (item) =>
      item.label.toUpperCase().startsWith(upper) ||
      item.label.toUpperCase().includes(upper)
  );
}

export function getCompletionItems(
  text: string,
  offset: number,
  schemas: DatabaseSchema[]
): CompletionItem[] {
  const textBefore = text.slice(0, offset);
  const lines = textBefore.split("\n");
  const currentLine = lines[lines.length - 1];

  const wordMatch = currentLine.match(/(\w+)$/);
  const prefix = wordMatch ? wordMatch[1] : "";
  const beforeWord = currentLine.slice(0, currentLine.length - prefix.length);

  const dotMatch = beforeWord.match(/(\w+)\.\s*$/);
  if (dotMatch) {
    const alias = dotMatch[1];
    return filterItems(columnsForTable(schemas, alias), prefix);
  }

  const tableCtxMatch = beforeWord.match(
    /(FROM|JOIN|INTO|UPDATE|TABLE|INDEX\s+ON)\s+$/i
  );
  if (tableCtxMatch) {
    return filterItems(allTables(schemas), prefix);
  }

  const columnCtxMatch = beforeWord.match(
    /(SELECT|WHERE|AND|OR|ON|SET|BETWEEN|IN|LIKE|ILIKE|HAVING|ORDER\s+BY|GROUP\s+BY)\s+$/i
  );
  if (columnCtxMatch) {
    return filterItems([...allColumns(schemas), ...SQL_FUNCTIONS], prefix);
  }

  return filterItems([...SQL_KEYWORDS, ...SQL_FUNCTIONS], prefix);
}
