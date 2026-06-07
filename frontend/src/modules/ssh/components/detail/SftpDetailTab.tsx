import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { commands } from "../../../../ipc/bindings";
import { useHostOnlineStatus } from "../../../../stores/sshConnectionStore";

type SftpEntry = { name: string; isDir: boolean; size: number };

type Props = {
  activeResource: { id: string } | null;
};

const QUICK_PATHS = [
  { label: "/", path: "/" },
  { label: "/etc", path: "/etc" },
  { label: "/var/log", path: "/var/log" },
  { label: "/home", path: "/home" },
  { label: "/tmp", path: "/tmp" },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtError(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const err = e as Record<string, unknown>;
    if (typeof err.message === "string") return err.message;
    if (typeof err.cause === "string") return err.cause;
  }
  try { return JSON.stringify(e); } catch { return String(e); }
}

export function SftpDetailTab({ activeResource }: Props) {
  const [path, setPath] = useState("/");
  const [entries, setEntries] = useState<SftpEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMkdir, setShowMkdir] = useState(false);
  const [mkdirName, setMkdirName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: SftpEntry } | null>(null);
  const [renameTarget, setRenameTarget] = useState<SftpEntry | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [chmodTarget, setChmodTarget] = useState<SftpEntry | null>(null);
  const [chmodValue, setChmodValue] = useState("");
  const status = useHostOnlineStatus(activeResource?.id ?? null);

  const isOnline = status === "online";

  const activeResourceRef = useRef(activeResource);
  activeResourceRef.current = activeResource;

  const loadDir = async (dir: string) => {
    if (!activeResourceRef.current?.id || !isOnline) return;
    setLoading(true);
    setError(null);
    try {
      const list = await invoke<SftpEntry[]>("sftp_list", { id: activeResourceRef.current.id, path: dir });
      list.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setEntries(list);
      setPath(dir);
    } catch (e) {
      setError(fmtError(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) loadDir(path);
  }, [isOnline]);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handler);
      return () => document.removeEventListener("click", handler);
    }
  }, [contextMenu]);

  const navigateUp = () => {
    if (path === "/") return;
    const parent = path.split("/").slice(0, -1).join("/") || "/";
    loadDir(parent);
  };

  const navigateTo = (entry: SftpEntry) => {
    if (!entry.isDir) return;
    const newPath = path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
    loadDir(newPath);
  };

  const handleDelete = async (entry: SftpEntry) => {
    const fullPath = path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;
    try {
      await invoke("sftp_remove", { id: activeResource!.id, path: fullPath });
      loadDir(path);
    } catch (e) {
      setError(fmtError(e));
    }
  };

  const handleMkdir = async () => {
    if (!mkdirName) return;
    const fullPath = path === "/" ? `/${mkdirName}` : `${path}/${mkdirName}`;
    try {
      await invoke("sftp_mkdir", { id: activeResource!.id, path: fullPath });
      setShowMkdir(false);
      setMkdirName("");
      loadDir(path);
    } catch (e) {
      setError(fmtError(e));
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const oldPath = path === "/" ? `/${renameTarget.name}` : `${path}/${renameTarget.name}`;
    const dir = path === "/" ? "" : path;
    const newPath = `${dir}/${renameValue.trim()}`;
    try {
      const res = await commands.sftpRename(activeResource!.id, oldPath, newPath);
      if (res.status === "ok") {
        setRenameTarget(null);
        setRenameValue("");
        loadDir(path);
      } else {
        setError(res.error.message);
      }
    } catch (e) {
      setError(fmtError(e));
    }
  };

  const handleChmod = async () => {
    if (!chmodTarget || !chmodValue.trim()) return;
    const fullPath = path === "/" ? `/${chmodTarget.name}` : `${path}/${chmodTarget.name}`;
    const mode = parseInt(chmodValue.trim(), 8);
    if (isNaN(mode) || mode < 0 || mode > 0o777) {
      setError("请输入有效的八进制权限（如 755）");
      return;
    }
    try {
      const res = await commands.sftpChmod(activeResource!.id, fullPath, mode);
      if (res.status === "ok") {
        setChmodTarget(null);
        setChmodValue("");
        loadDir(path);
      } else {
        setError(res.error.message);
      }
    } catch (e) {
      setError(fmtError(e));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, entry: SftpEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const pathParts = path.split("/").filter(Boolean);

  return (
    <div className="sftp-panel">
      <div className="sftp-toolbar">
        <button className="btn btn-secondary btn-sm" onClick={navigateUp} disabled={path === "/"} title="上级目录">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowMkdir(true)} title="新建文件夹">+ 目录</button>
        <div className="sftp-path">
          <button className="sftp-path-seg" onClick={() => loadDir("/")}>/</button>
          {pathParts.map((seg, i) => {
            const segPath = "/" + pathParts.slice(0, i + 1).join("/");
            return (
              <span key={segPath} className="sftp-path-group">
                <span className="sftp-path-sep">/</span>
                <button className="sftp-path-seg" onClick={() => loadDir(segPath)}>{seg}</button>
              </span>
            );
          })}
        </div>
      </div>
      {showMkdir && (
        <div className="sftp-mkdir-bar">
          <input className="input input-sm" value={mkdirName} onChange={(e) => setMkdirName(e.target.value)} placeholder="文件夹名称" />
          <button className="btn btn-primary btn-sm" onClick={handleMkdir}>创建</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setShowMkdir(false); setMkdirName(""); }}>取消</button>
        </div>
      )}
      {renameTarget && (
        <div className="sftp-mkdir-bar">
          <span className="text-sm">重命名 <code>{renameTarget.name}</code> →</span>
          <input className="input input-sm" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="新名称" autoFocus onKeyDown={(e) => e.key === "Enter" && handleRename()} />
          <button className="btn btn-primary btn-sm" onClick={handleRename}>确定</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setRenameTarget(null); setRenameValue(""); }}>取消</button>
        </div>
      )}
      {chmodTarget && (
        <div className="sftp-mkdir-bar">
          <span className="text-sm">修改权限 <code>{chmodTarget.name}</code></span>
          <input className="input input-sm" value={chmodValue} onChange={(e) => setChmodValue(e.target.value)} placeholder="755" autoFocus onKeyDown={(e) => e.key === "Enter" && handleChmod()} style={{ width: 80 }} />
          <button className="btn btn-primary btn-sm" onClick={handleChmod}>确定</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setChmodTarget(null); setChmodValue(""); }}>取消</button>
        </div>
      )}
      {error && <div className="sftp-error">{error}</div>}
      {!isOnline ? (
        <div className="empty-state compact">主机未连接</div>
      ) : loading ? (
        <div className="empty-state compact">加载中…</div>
      ) : (
        <table className="sftp-table">
          <thead>
            <tr>
              <th className="sftp-col-name">名称</th>
              <th className="sftp-col-size">大小</th>
              <th className="sftp-col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.name} className={entry.isDir ? "sftp-row-dir" : "sftp-row-file"} onContextMenu={(e) => handleContextMenu(e, entry)}>
                <td className="sftp-col-name" onClick={() => entry.isDir && navigateTo(entry)}>
                  <span className={`sftp-icon ${entry.isDir ? "sftp-icon-dir" : "sftp-icon-file"}`}>
                    {entry.isDir ? "📁" : "📄"}
                  </span>
                  <span className={entry.isDir ? "sftp-name-dir" : "sftp-name-file"}>{entry.name}</span>
                </td>
                <td className="sftp-col-size text-muted">{entry.isDir ? "—" : formatSize(entry.size)}</td>
                <td className="sftp-col-actions">
                  <button className="sftp-action-btn" onClick={() => handleDelete(entry)} title="删除">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="sftp-quick-paths">
        {QUICK_PATHS.map((qp) => (
          <button key={qp.path} className="sftp-quick-btn" onClick={() => loadDir(qp.path)}>
            {qp.label}
          </button>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="sftp-context-menu"
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000,
            background: "var(--bg-elevated, #1e1e2e)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-sm, 4px)",
            padding: "4px 0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            minWidth: 140,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="sftp-ctx-item"
            style={{ display: "block", width: "100%", padding: "6px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "var(--fg, #cdd6f4)", fontSize: 12 }}
            onClick={() => {
              setRenameTarget(contextMenu.entry);
              setRenameValue(contextMenu.entry.name);
              setContextMenu(null);
            }}
          >
            重命名
          </button>
          <button
            className="sftp-ctx-item"
            style={{ display: "block", width: "100%", padding: "6px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "var(--fg, #cdd6f4)", fontSize: 12 }}
            onClick={() => {
              setChmodTarget(contextMenu.entry);
              setChmodValue("");
              setContextMenu(null);
            }}
          >
            修改权限
          </button>
          <button
            className="sftp-ctx-item"
            style={{ display: "block", width: "100%", padding: "6px 12px", textAlign: "left", background: "none", border: "none", cursor: "pointer", color: "var(--danger, #f38ba8)", fontSize: 12 }}
            onClick={() => {
              handleDelete(contextMenu.entry);
              setContextMenu(null);
            }}
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
}
