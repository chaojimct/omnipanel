import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { EditorState } from "@codemirror/state";
import { findStatementRangeAtOffset } from "../../sqlIntel/sqlLex";

function resolveTrimmedStatementRange(state: EditorState): { from: number; to: number } | null {
  const head = state.selection.main.head;
  const docText = state.doc.toString();
  const { from, to } = findStatementRangeAtOffset(docText, head);
  const slice = docText.slice(from, to);
  const trimmed = slice.trim();
  if (!trimmed) {
    return null;
  }
  const lead = slice.length - slice.trimStart().length;
  const trail = slice.length - slice.trimEnd().length;
  return {
    from: from + lead,
    to: to - trail,
  };
}

type OutlineMeasure = {
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

function measureActiveStatementOutline(view: EditorView): OutlineMeasure {
  const range = resolveTrimmedStatementRange(view.state);
  if (!range) {
    return null;
  }

  const doc = view.state.doc;
  const startLine = doc.lineAt(range.from);
  const endPos = Math.max(range.from, range.to - 1);
  const endLine = doc.lineAt(endPos);

  const startCoords = view.coordsAtPos(startLine.from, 1);
  const endCoords = view.coordsAtPos(endLine.to, -1);
  if (!startCoords || !endCoords) {
    return null;
  }

  const editorRect = view.dom.getBoundingClientRect();
  const gutters = view.dom.querySelector(".cm-gutters");
  const gutterWidth = gutters?.getBoundingClientRect().width ?? 0;

  return {
    top: startCoords.top - editorRect.top,
    left: gutterWidth,
    width: 2,
    height: endCoords.bottom - startCoords.top,
  };
}

function applyActiveStatementOutline(outlineEl: HTMLElement, measure: OutlineMeasure) {
  if (!measure) {
    outlineEl.style.display = "none";
    return;
  }

  outlineEl.style.display = "block";
  outlineEl.style.top = `${measure.top}px`;
  outlineEl.style.left = `${measure.left}px`;
  outlineEl.style.width = `${measure.width}px`;
  outlineEl.style.height = `${measure.height}px`;
}

/** 高亮光标所在的当前 SQL 语句（整行宽绿色外边框，与 Mod+Enter 执行范围一致）。 */
export const activeStatementPlugin = ViewPlugin.fromClass(
  class {
    outlineEl: HTMLDivElement;
    private readonly measureReq = {
      read: (view: EditorView) => measureActiveStatementOutline(view),
      write: (measure: OutlineMeasure, _view: EditorView) => {
        applyActiveStatementOutline(this.outlineEl, measure);
      },
    };

    constructor(view: EditorView) {
      this.outlineEl = document.createElement("div");
      this.outlineEl.className = "cm-activeStatementOutline";
      this.outlineEl.setAttribute("aria-hidden", "true");
      this.outlineEl.style.display = "none";
      view.dom.appendChild(this.outlineEl);
      view.requestMeasure(this.measureReq);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged ||
        update.geometryChanged
      ) {
        update.view.requestMeasure(this.measureReq);
      }
    }

    destroy() {
      this.outlineEl.remove();
    }
  },
);

export { resolveTrimmedStatementRange };
