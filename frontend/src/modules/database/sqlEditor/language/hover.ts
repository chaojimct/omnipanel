import { hoverTooltip, type Tooltip } from "@codemirror/view";
import type { DatabaseSchema } from "../../types";
import { Catalog } from "../catalog";
import { sliceStatementAtOffset } from "../parser/ast";
import { analyzeStatement, resolveTableByAlias } from "../parser/analyzer";

function identifierAtPos(line: string, offsetInLine: number): { word: string; from: number; to: number } | null {
  const re = /[\w`]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line))) {
    const start = match.index;
    const end = start + match[0].length;
    if (offsetInLine >= start && offsetInLine <= end) {
      const word = match[0].replace(/`/g, "");
      return { word, from: start, to: end };
    }
  }
  return null;
}

function buildTableTooltip(tableName: string, columns: { name: string; type: string }[]): Tooltip {
  const columnLines = columns
    .slice(0, 24)
    .map((col) => `${col.name}: ${col.type}`)
    .join("\n");
  const more = columns.length > 24 ? `\n… +${columns.length - 24} 列` : "";
  return {
    pos: 0,
    create() {
      const dom = document.createElement("div");
      dom.className = "cm-sql-hover-tooltip";
      dom.textContent = `表 ${tableName}\n${columnLines}${more}`;
      return { dom };
    },
  };
}

function buildColumnTooltip(tableName: string, columnName: string, type: string): Tooltip {
  return {
    pos: 0,
    create() {
      const dom = document.createElement("div");
      dom.className = "cm-sql-hover-tooltip";
      dom.textContent = `${tableName}.${columnName}\n${type}`;
      return { dom };
    },
  };
}

/** 表/列 Hover 提示（Metadata Catalog）。 */
export function createSqlHoverTooltip(
  getSchemas: () => DatabaseSchema[],
  getDbType?: () => string | undefined,
) {
  return hoverTooltip((view, pos) => {
    const schemas = getSchemas();
    if (schemas.length === 0) return null;

    const catalog = Catalog.fromSchemas(schemas);
    const line = view.state.doc.lineAt(pos);
    const offsetInLine = pos - line.from;
    const ident = identifierAtPos(line.text, offsetInLine);
    if (!ident) return null;

    const word = ident.word;
    const resolvedTable = catalog.findTable(word);
    if (resolvedTable) {
      const tooltip = buildTableTooltip(resolvedTable.table.name, resolvedTable.table.columns);
      return { ...tooltip, pos, end: pos + word.length };
    }

    const doc = view.state.doc.toString();
    const statement = sliceStatementAtOffset(doc, pos);
    const analysis = analyzeStatement(statement, getDbType?.());
    if (analysis) {
      for (const ref of analysis.tables) {
        const table = catalog.findTable(ref.tableName, ref.schemaName);
        if (!table) continue;
        const column = table.table.columns.find((col) => col.name.toLowerCase() === word.toLowerCase());
        if (column) {
          const tooltip = buildColumnTooltip(table.table.name, column.name, column.type);
          return { ...tooltip, pos, end: pos + word.length };
        }
      }
      const dotPrefix = line.text.slice(0, ident.from).match(/(\w+)\.\s*$/);
      if (dotPrefix) {
        const aliasTable = resolveTableByAlias(catalog, analysis, dotPrefix[1]);
        const column = aliasTable?.table.columns.find((col) => col.name.toLowerCase() === word.toLowerCase());
        if (column && aliasTable) {
          const tooltip = buildColumnTooltip(aliasTable.table.name, column.name, column.type);
          return { ...tooltip, pos, end: pos + word.length };
        }
      }
    }

    return null;
  });
}
