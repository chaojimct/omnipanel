import {
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type { CellEditorKind } from "./cell_editor/types";

export interface TableDataGridInlineCellEditorProps {
  kind: CellEditorKind;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}

const INLINE_EDITOR_MIN_WIDTH = 160;
const INLINE_EDITOR_MAX_WIDTH = 720;
const INLINE_EDITOR_MIN_HEIGHT = 36;
const VIEWPORT_MARGIN = 8;

function syncTextareaSize(
  textarea: HTMLTextAreaElement,
  maxWidth: number,
  maxHeight?: number,
) {
  textarea.style.maxWidth = `${maxWidth}px`;
  if (maxHeight !== undefined) {
    textarea.style.maxHeight = `${Math.max(INLINE_EDITOR_MIN_HEIGHT, maxHeight)}px`;
  }

  textarea.style.height = "0px";
  const naturalHeight = textarea.scrollHeight;
  const cappedHeight =
    maxHeight !== undefined
      ? Math.min(Math.max(naturalHeight, INLINE_EDITOR_MIN_HEIGHT), Math.max(INLINE_EDITOR_MIN_HEIGHT, maxHeight))
      : Math.max(naturalHeight, INLINE_EDITOR_MIN_HEIGHT);
  textarea.style.height = `${cappedHeight}px`;
  textarea.style.overflowY =
    maxHeight !== undefined && naturalHeight > maxHeight ? "auto" : "hidden";

  textarea.style.width = "0px";
  const nextWidth = Math.max(
    INLINE_EDITOR_MIN_WIDTH,
    Math.min(textarea.scrollWidth + 4, maxWidth),
  );
  textarea.style.width = `${nextWidth}px`;
}

function InlineEditorHost({
  hostRef,
  children,
}: {
  hostRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div ref={hostRef} className="db-data-table-inline-editor-host">
      {children}
    </div>
  );
}

export function TableDataGridInlineCellEditor({
  kind,
  value,
  onChange,
  onCommit,
  onCancel,
}: TableDataGridInlineCellEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  const layoutInlineEditor = useCallback(() => {
    const host = hostRef.current;
    const anchor = host?.closest("td") as HTMLElement | null;
    if (!host || !anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = anchorRect.left;
    let top = anchorRect.top;

    const maxWidth = Math.min(
      INLINE_EDITOR_MAX_WIDTH,
      viewportW - VIEWPORT_MARGIN * 2,
    );

    host.style.position = "fixed";
    host.style.maxWidth = `${maxWidth}px`;
    host.style.left = `${left}px`;
    host.style.top = `${top}px`;

    const textarea = textareaRef.current;
    if (textarea) {
      const maxHeight = Math.max(INLINE_EDITOR_MIN_HEIGHT, viewportH - VIEWPORT_MARGIN - top);
      syncTextareaSize(textarea, maxWidth, maxHeight);
    }

    const clampToViewport = () => {
      const hostRect = host.getBoundingClientRect();

      if (hostRect.right > viewportW - VIEWPORT_MARGIN) {
        left = Math.max(VIEWPORT_MARGIN, viewportW - VIEWPORT_MARGIN - hostRect.width);
      }
      if (left < VIEWPORT_MARGIN) {
        left = VIEWPORT_MARGIN;
      }
      if (hostRect.bottom > viewportH - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, viewportH - VIEWPORT_MARGIN - hostRect.height);
      }
      if (top < VIEWPORT_MARGIN) {
        top = VIEWPORT_MARGIN;
      }

      host.style.left = `${left}px`;
      host.style.top = `${top}px`;
    };

    clampToViewport();

    if (textarea) {
      const maxHeight = Math.max(INLINE_EDITOR_MIN_HEIGHT, viewportH - VIEWPORT_MARGIN - top);
      syncTextareaSize(textarea, maxWidth, maxHeight);
      clampToViewport();

      const finalRect = host.getBoundingClientRect();
      if (finalRect.bottom > viewportH - VIEWPORT_MARGIN) {
        top = Math.max(VIEWPORT_MARGIN, viewportH - VIEWPORT_MARGIN - finalRect.height);
        host.style.top = `${top}px`;
        syncTextareaSize(
          textarea,
          maxWidth,
          Math.max(INLINE_EDITOR_MIN_HEIGHT, viewportH - VIEWPORT_MARGIN - top),
        );
      }
    } else {
      clampToViewport();
    }
  }, [kind]);

  useLayoutEffect(() => {
    layoutInlineEditor();
  }, [layoutInlineEditor, kind, value]);

  useEffect(() => {
    const host = hostRef.current;
    const scrollEl = host?.closest(".db-data-table-wrap");
    if (!scrollEl) return;

    const relayout = () => layoutInlineEditor();
    scrollEl.addEventListener("scroll", relayout, { passive: true });
    window.addEventListener("resize", relayout);

    const control = kind === "boolean" ? selectRef.current : textareaRef.current;
    if (!control) return;
    control.focus();
    if (control instanceof HTMLTextAreaElement) {
      control.select();
    }

    return () => {
      scrollEl.removeEventListener("scroll", relayout);
      window.removeEventListener("resize", relayout);
    };
  }, [kind, layoutInlineEditor]);

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
      <InlineEditorHost hostRef={hostRef}>
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
    <InlineEditorHost hostRef={hostRef}>
      <textarea
        ref={textareaRef}
        className="db-data-table-inline-editor db-data-table-inline-editor--textarea"
        rows={2}
        spellCheck={false}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          layoutInlineEditor();
        }}
        onKeyDown={handleTextareaKeyDown}
        onBlur={onCommit}
        {...sharedMouseProps}
      />
    </InlineEditorHost>
  );
}
