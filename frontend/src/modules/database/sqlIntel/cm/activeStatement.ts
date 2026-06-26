import { EditorView, Decoration, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { findStatementRangeAtOffset } from "../sqlStatement";

const activeStatementMark = Decoration.mark({ class: "cm-activeStatement" });

function buildActiveStatementDecorations(view: EditorView) {
  const head = view.state.selection.main.head;
  const doc = view.state.doc.toString();
  const { from, to } = findStatementRangeAtOffset(doc, head);
  const slice = doc.slice(from, to);
  const trimmed = slice.trim();
  if (!trimmed) {
    return Decoration.none;
  }
  const lead = slice.length - slice.trimStart().length;
  const trimmedFrom = from + lead;
  const trimmedTo = trimmedFrom + trimmed.length;
  return Decoration.set([activeStatementMark.range(trimmedFrom, trimmedTo)]);
}

/** 高亮光标所在的当前 SQL 语句范围。 */
export const activeStatementPlugin = ViewPlugin.fromClass(
  class {
    decorations;

    constructor(view: EditorView) {
      this.decorations = buildActiveStatementDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildActiveStatementDecorations(update.view);
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations,
  },
);
