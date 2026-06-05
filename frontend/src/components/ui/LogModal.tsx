import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../../i18n";
import { SubWindow } from "./SubWindow";

type LogEntry = {
  timestamp: string;
  module: string;
  level: string;
  message: string;
};

interface LogModalProps {
  open: boolean;
  onClose: () => void;
}

const LEVEL_ORDER = ["error", "warn", "info"] as const;
const LOG_LEVELS: Record<string, string> = {
  error: "log-level--error",
  warn: "log-level--warn",
  info: "log-level--info",
};

export function LogModal({ open, onClose }: LogModalProps) {
  const { t } = useI18n();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterModule, setFilterModule] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await invoke<LogEntry[]>("get_backend_logs");
      setLogs(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchLogs();
    const timer = setInterval(fetchLogs, 3000);
    return () => clearInterval(timer);
  }, [open, fetchLogs]);

  useEffect(() => {
    if (autoScrollRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    autoScrollRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
  }, []);

  const handleClear = async () => {
    await invoke("clear_backend_logs");
    setLogs([]);
  };

  const modules = [...new Set(logs.map((l) => l.module))].sort();

  const filtered = logs.filter((l) => {
    if (filterModule && l.module !== filterModule) return false;
    if (filterLevel && l.level !== filterLevel) return false;
    return true;
  });

  return (
    <SubWindow
      open={open}
      title={t("shell.statusbar.backendLogs")}
      onClose={onClose}
      className="log-subwindow"
    >
      <div className="log-window">
        <div className="log-modal-toolbar">
          <select
            className="log-modal-select"
            value={filterModule ?? ""}
            onChange={(e) => setFilterModule(e.target.value || null)}
          >
            <option value="">全部模块</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            className="log-modal-select"
            value={filterLevel ?? ""}
            onChange={(e) => setFilterLevel(e.target.value || null)}
          >
            <option value="">全部级别</option>
            {LEVEL_ORDER.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
          <button type="button" className="log-modal-btn" onClick={handleClear}>
            清空
          </button>
        </div>
        <div className="log-modal-body" onScroll={handleScroll}>
          {filtered.length === 0 ? (
            <div className="log-modal-empty">暂无日志</div>
          ) : (
            filtered.map((entry, i) => (
              <div key={i} className="log-modal-entry">
                <span className="log-modal-ts">{entry.timestamp}</span>
                <span className={`log-modal-level ${LOG_LEVELS[entry.level] ?? ""}`}>
                  {entry.level.toUpperCase()}
                </span>
                <span className="log-modal-module">{entry.module}</span>
                <span className="log-modal-msg">{entry.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="log-window-footer">
          <span className="log-window-footer__status">{filtered.length} 条日志</span>
        </div>
      </div>
    </SubWindow>
  );
}
