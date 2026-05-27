import { useRef, useState, useCallback, useEffect } from "react";
import { CompletionItem } from "vscode-languageserver-types";
import { getCompletionItems } from "./lsp/sqlCompletion";
import { MOCK_SCHEMA } from "./lsp/schema";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function measureCursor(textarea: HTMLTextAreaElement): { top: number; left: number } {
  const pos = textarea.selectionStart;
  const text = textarea.value;
  const before = text.slice(0, pos);

  const mirror = document.createElement("div");
  mirror.style.cssText = `
    position: absolute;
    top: -9999px;
    left: -9999px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-family: ${getComputedStyle(textarea).fontFamily};
    font-size: ${getComputedStyle(textarea).fontSize};
    font-weight: ${getComputedStyle(textarea).fontWeight};
    line-height: ${getComputedStyle(textarea).lineHeight};
    letter-spacing: ${getComputedStyle(textarea).letterSpacing};
    padding: ${getComputedStyle(textarea).padding};
    border: ${getComputedStyle(textarea).border};
    width: ${textarea.clientWidth}px;
  `;

  const lines = before.split("\n");
  const lineText = lines
    .slice(0, -1)
    .map((l) => l + "\n")
    .join("");
  const lastLine = lines[lines.length - 1];

  const span = document.createElement("span");
  span.textContent = lastLine;
  mirror.textContent = lineText;
  mirror.appendChild(span);
  document.body.appendChild(mirror);

  const spanRect = span.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();
  const computed = getComputedStyle(textarea);

  const top = spanRect.top - textareaRect.top + parseFloat(computed.lineHeight) + textarea.scrollTop;
  const left = spanRect.left - textareaRect.left + parseFloat(computed.paddingLeft || "0") - textarea.scrollLeft;

  document.body.removeChild(mirror);

  return { top, left };
}

const kindLabels: Record<number, string> = {
  3: "fn",
  5: "col",
  14: "kw",
  22: "tbl",
};

export function SqlEditor({ value, onChange }: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const suppressRef = useRef(false);

  const updateCompletions = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const offset = ta.selectionStart;
    const items = getCompletionItems(value, offset, MOCK_SCHEMA);
    if (items.length > 0 && !suppressRef.current) {
      setCompletions(items);
      setSelectedIdx(0);
      setShowPopup(true);
      const pos = measureCursor(ta);
      setPopupPos(pos);
    } else {
      setShowPopup(false);
    }
  }, [value]);

  const acceptCompletion = useCallback(
    (item: CompletionItem) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const offset = ta.selectionStart;
      const before = value.slice(0, offset);
      const prefixMatch = before.match(/(\w+)$/);
      const prefix = prefixMatch ? prefixMatch[1] : "";
      const start = offset - prefix.length;
      const insertText = item.insertText ?? item.label;
      const newValue = value.slice(0, start) + insertText + value.slice(offset);
      onChange(newValue);

      suppressRef.current = true;
      const newOffset = start + insertText.length;
      requestAnimationFrame(() => {
        const ta2 = textareaRef.current;
        if (ta2) {
          ta2.focus();
          ta2.selectionStart = newOffset;
          ta2.selectionEnd = newOffset;
        }
        suppressRef.current = false;
      });
      setShowPopup(false);
    },
    [value, onChange]
  );

  useEffect(() => {
    if (!showPopup) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".sql-completion-popup") && !target.closest(".sql-textarea")) {
        setShowPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPopup]);

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showPopup) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, completions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        acceptCompletion(completions[selectedIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowPopup(false);
        return;
      }
    }

    if (e.key === " " && e.ctrlKey) {
      e.preventDefault();
      updateCompletions();
      return;
    }

    if (e.key === "Tab" && !showPopup) {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.slice(0, start) + "    " + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = start + 4;
        ta.selectionEnd = start + 4;
      });
      return;
    }
  }

  function handleSelect() {
    if (!suppressRef.current) {
      updateCompletions();
    }
  }

  return (
    <div className="sql-editor-container">
      <textarea
        ref={textareaRef}
        className="sql-textarea"
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onClick={handleSelect}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
      />
      {showPopup && completions.length > 0 && (
        <div
          className="sql-completion-popup"
          style={{
            top: popupPos.top,
            left: popupPos.left,
          }}
        >
          {completions.map((item, i) => (
            <div
              key={item.label + (item.detail ?? "")}
              className={`completion-item${i === selectedIdx ? " selected" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                acceptCompletion(item);
              }}
            >
              <span className={`completion-kind kind-${kindLabels[item.kind ?? 0] ?? "kw"}`}>
                {kindLabels[item.kind ?? 0] ?? "kw"}
              </span>
              <span className="completion-label">{item.label}</span>
              {item.detail && <span className="completion-detail">{item.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
