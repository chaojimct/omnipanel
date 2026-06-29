import { EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { findSqlFunctionDef, type SqlFunctionDef } from "../../sqlIntel/sqlFunctionCatalog";

export interface ActiveFunctionCall {
  name: string;
  def: SqlFunctionDef;
  paramIndex: number;
  signatureHtml: string;
}

function countCommasOutsideNesting(text: string): number {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let commas = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "'" && !inDouble && !inBacktick) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle && !inBacktick) {
      inDouble = !inDouble;
      continue;
    }
    if (ch === "`" && !inSingle && !inDouble) {
      inBacktick = !inBacktick;
      continue;
    }
    if (inSingle || inDouble || inBacktick) {
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (ch === "," && depth === 0) {
      commas += 1;
    }
  }
  return commas;
}

function findActiveFunctionCall(doc: string, offset: number, dbType?: string): ActiveFunctionCall | null {
  const before = doc.slice(0, offset);
  const openIndex = before.lastIndexOf("(");
  if (openIndex < 0) {
    return null;
  }

  const head = before.slice(0, openIndex);
  const nameMatch = head.match(/([A-Za-z_][\w$]*)\s*$/);
  if (!nameMatch) {
    return null;
  }

  const name = nameMatch[1];
  const def = findSqlFunctionDef(name, dbType);
  if (!def) {
    return null;
  }

  const inner = before.slice(openIndex + 1);
  const paramIndex = countCommasOutsideNesting(inner);
  const paramsHtml = def.params
    .map((param, index) => {
      const active = index === paramIndex;
      const label = param.optional ? `${param.name}?` : param.name;
      return active
        ? `<strong class="cm-sql-signature-param cm-sql-signature-param--active">${label}</strong>`
        : `<span class="cm-sql-signature-param">${label}</span>`;
    })
    .join(", ");

  const signatureHtml = paramsHtml
    ? `<span class="cm-sql-signature-name">${def.name}</span>( ${paramsHtml} )`
    : `<span class="cm-sql-signature-name">${def.name}</span>( ${def.signature.replace(/^[^()]+\(/, "").replace(/\)$/, "")} )`;

  return { name, def, paramIndex, signatureHtml };
}

class FunctionSignatureWidget {
  dom: HTMLElement;

  constructor(view: EditorView, dbType?: string) {
    this.dom = document.createElement("div");
    this.dom.className = "cm-sql-function-signature";
    this.update(view, dbType);
  }

  update(view: EditorView, dbType?: string) {
    const head = view.state.selection.main.head;
    const active = findActiveFunctionCall(view.state.doc.toString(), head, dbType);
    if (!active) {
      this.dom.style.display = "none";
      this.dom.innerHTML = "";
      return;
    }
    this.dom.style.display = "block";
    this.dom.innerHTML = active.signatureHtml;
    if (active.def.description) {
      const hint = document.createElement("span");
      hint.className = "cm-sql-function-signature__desc";
      hint.textContent = active.def.description;
      this.dom.appendChild(hint);
    }
  }
}

/** 光标位于函数调用括号内时，在编辑器顶部显示签名提示。 */
export function createFunctionSignaturePlugin(getDbType: () => string | undefined) {
  return ViewPlugin.fromClass(
    class {
      widget: FunctionSignatureWidget;

      constructor(view: EditorView) {
        this.widget = new FunctionSignatureWidget(view, getDbType());
        view.dom.appendChild(this.widget.dom);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.widget.update(update.view, getDbType());
        }
      }

      destroy() {
        this.widget.dom.remove();
      }
    },
  );
}

export { findActiveFunctionCall };
