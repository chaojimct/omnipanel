import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Terminal, type ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useI18n } from "../../i18n";

export interface LogViewerProps {
  /** 日志全文，写入 xterm 展示 */
  text?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  error?: string | null;
  /** 工具栏左侧扩展区（筛选、刷新等） */
  toolbar?: ReactNode;
  footer?: ReactNode;
  onClear?: () => void | Promise<void>;
  showClear?: boolean;
  autoScroll?: boolean;
  className?: string;
}

function readLogTerminalTheme(): ITheme {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    background: get("--bg-deeper", "#1a1717"),
    foreground: get("--fg", "#fdfcfc"),
    cursor: get("--bg-deeper", "#1a1717"),
    selectionBackground: get("--accent-soft", "rgba(0, 122, 255, 0.12)"),
    black: get("--bg-deeper", "#1a1717"),
    red: get("--danger", "#ff3b30"),
    green: get("--success", "#30d158"),
    yellow: get("--warn", "#ff9f0a"),
    blue: get("--accent", "#007aff"),
    magenta: "#da77f2",
    cyan: "#66d9e8",
    white: get("--fg", "#fdfcfc"),
    brightBlack: get("--muted", "#9a9898"),
    brightRed: get("--danger", "#ff3b30"),
    brightGreen: get("--success", "#30d158"),
    brightYellow: get("--warn", "#ff9f0a"),
    brightBlue: get("--accent", "#007aff"),
    brightMagenta: "#e599f7",
    brightCyan: "#99e9f2",
    brightWhite: get("--fg", "#fdfcfc"),
  };
}

function isTerminalAtBottom(term: Terminal): boolean {
  const buf = term.buffer.active;
  return buf.baseY + term.rows >= buf.length;
}

export function LogViewer({
  text = "",
  loading = false,
  loadingText,
  emptyText,
  error,
  toolbar,
  footer,
  onClear,
  showClear,
  autoScroll = true,
  className,
}: LogViewerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const autoScrollRef = useRef(autoScroll);
  const lastTextRef = useRef<string | null>(null);

  const canClear = showClear ?? Boolean(onClear);
  const showToolbar = Boolean(toolbar) || canClear;
  const showLoadingOverlay = loading && !text;
  const showEmptyOverlay = !loading && !text && !error;

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new Terminal({
      disableStdin: true,
      cursorBlink: false,
      fontSize: 12,
      lineHeight: 1.6,
      fontFamily:
        '"Berkeley Mono", "IBM Plex Mono", "Cascadia Code", "JetBrains Mono", Consolas, "Liberation Mono", ui-monospace, monospace',
      scrollback: 10000,
      theme: readLogTerminalTheme(),
      allowTransparency: true,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    const onScroll = () => {
      autoScrollRef.current = isTerminalAtBottom(term);
    };
    const scrollDisposable = term.onScroll(onScroll);

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(el);

    return () => {
      scrollDisposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      lastTextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    if (lastTextRef.current === text) return;

    const stickToBottom = autoScrollRef.current && (lastTextRef.current === null || isTerminalAtBottom(term));
    lastTextRef.current = text;

    term.reset();
    if (text) {
      term.write(text.replace(/\r?\n/g, "\r\n"), () => {
        if (stickToBottom) {
          term.scrollToBottom();
          autoScrollRef.current = true;
        }
      });
    }
  }, [text]);

  const handleClear = useCallback(() => {
    const term = termRef.current;
    if (term) {
      term.reset();
      lastTextRef.current = "";
    }
    void onClear?.();
  }, [onClear]);

  const panelClass = className ? `log-viewer-panel ${className}` : "log-viewer-panel";

  return (
    <div className={panelClass}>
      {showToolbar && (
        <div className="log-viewer-panel__toolbar">
          <div className="log-viewer-panel__toolbar-start">{toolbar}</div>
          {canClear && (
            <div className="log-viewer-panel__toolbar-actions">
              <button type="button" className="log-viewer-panel__btn" onClick={handleClear}>
                {t("logViewer.clear")}
              </button>
            </div>
          )}
        </div>
      )}
      {error ? <div className="log-viewer-panel__error">{error}</div> : null}
      <div className="log-viewer-panel__xterm">
        <div ref={containerRef} className="log-viewer-panel__xterm-host" />
        {showLoadingOverlay ? (
          <div className="log-viewer-panel__overlay">{loadingText ?? t("common.loading")}</div>
        ) : null}
        {showEmptyOverlay ? (
          <div className="log-viewer-panel__overlay">{emptyText ?? t("logViewer.empty")}</div>
        ) : null}
      </div>
      {footer ? <div className="log-viewer-panel__footer">{footer}</div> : null}
    </div>
  );
}
