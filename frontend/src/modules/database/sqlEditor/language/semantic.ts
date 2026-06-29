import { EditorView, Decoration, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { DatabaseSchema } from "../../types";
import { Catalog } from "../catalog";
import { findStatementRangeAtOffset } from "../../sqlIntel/sqlLex";

const tableMark = Decoration.mark({ class: "cm-sqlSemanticTable" });
const columnMark = Decoration.mark({ class: "cm-sqlSemanticColumn" });
const databaseMark = Decoration.mark({ class: "cm-sqlSemanticDatabase" });

function buildSemanticDecorations(view: EditorView, schemas: DatabaseSchema[]) {
  if (schemas.length === 0) return Decoration.none;

  const catalog = Catalog.fromSchemas(schemas);
  const doc = view.state.doc.toString();
  const head = view.state.selection.main.head;
  const { from, to } = findStatementRangeAtOffset(doc, head);
  const slice = doc.slice(from, to);
  if (!slice.trim()) return Decoration.none;

  const tableNames = new Set<string>();
  const columnNames = new Set<string>();
  const databaseNames = new Set<string>();
  for (const database of catalog.databases) {
    databaseNames.add(database.name.toLowerCase());
    for (const table of database.tables) {
      tableNames.add(table.name.toLowerCase());
      for (const column of table.columns) {
        columnNames.add(column.name.toLowerCase());
      }
    }
  }

  const ranges: ReturnType<typeof tableMark.range>[] = [];
  const re = /[`"]?([A-Za-z_][\w$]*)[`"]?/g;
  for (const match of slice.matchAll(re)) {
    const word = match[1];
    const key = word.toLowerCase();
    const start = from + (match.index ?? 0);
    const end = start + word.length;
    if (databaseNames.has(key)) {
      ranges.push(databaseMark.range(start, end));
    } else if (tableNames.has(key)) {
      ranges.push(tableMark.range(start, end));
    } else if (columnNames.has(key)) {
      ranges.push(columnMark.range(start, end));
    }
  }

  return ranges.length > 0 ? Decoration.set(ranges, true) : Decoration.none;
}

/** 基于 Catalog 的语义高亮（表/列/库名）。 */
export function createSqlSemanticHighlight(getSchemas: () => DatabaseSchema[]) {
  return ViewPlugin.fromClass(
    class {
      decorations;

      constructor(view: EditorView) {
        this.decorations = buildSemanticDecorations(view, getSchemas());
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = buildSemanticDecorations(update.view, getSchemas());
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}
