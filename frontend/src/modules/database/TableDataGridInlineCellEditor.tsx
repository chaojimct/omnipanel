import {
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { CellEditorKind } from "./cell_editor/types";

export interface TableDataGridInlineCellEditorProps {
  kind: CellEditorKind;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

function InlineEditorHost({ children }: { children: ReactNode }) {
  return <div className="db-data-table-inline-editor-host">{children}</div>;
}

export function TableDataGridInlineCellEditor({
  kind,
  value,
  onChange,
  onCommit,
  onCancel,
}: TableDataGridInlineCellEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const control = kind === "boolean" ? selectRef.current : textareaRef.current;
    if (!control) return;
    control.focus();
    if (control instanceof HTMLTextAreaElement) {
      control.select();
    }
  }, [kind]);

  const handleTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      event.stopPropagation();
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        onCommit();
      }
    },
    [onCommit, onCancel],
  );

  const handleSelectKeyDown = useCallback(
    (event: KeyboardEvent<HTMLSelectElement>) => {
      event.stopPropagation();
      if (event.key === "Enter") {
        event.preventDefault();
        onCommit();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    },
    [onCommit, onCancel],
  );

  const sharedMouseProps = {
    onMouseDown: (event: MouseEvent) => event.stopPropagation(),
    onClick: (event: MouseEvent) => event.stopPropagation(),
    onDoubleClick: (event: MouseEvent) => event.stopPropagation(),
  };

  if (kind === "boolean") {
    return (
      <InlineEditorHost>
        <select
          ref={selectRef}
          className="db-data-table-inline-editor db-data-table-inline-editor--select"
          onKeyDown={handleSelectKeyDown}
          onBlur={onCommit}
          {...sharedMouseProps}
          value={value === "true" || value === "1" ? "true" : value === "false" || value === "0" ? "false" : ""}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </InlineEditorHost>
    );
  }

  return (
    <InlineEditorHost>
      <textarea
        ref={textareaRef}
        className="db-data-table-inline-editor db-data-table-inline-editor--textarea"
        rows={1}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleTextareaKeyDown}
        onBlur={onCommit}
        {...sharedMouseProps}
      />
    </InlineEditorHost>
  );
}
