import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
  const status = useHostOnlineStatus(activeResource?.id ?? null);

  const isOnline = status === "online";

  const loadDirRef = useRef<(dir: string) => Promise<void>>();

  useEffect(() => {
    if (!activeResource?.id) {
      loadDirRef.current = undefined;
      return;
    }
    const id = activeResource.id;
    loadDirRef.current = async (dir: string) => {
      setLoading(true);
      setError(null);
      try {
        const list = await invoke<SftpEntry[]>("sftp_list", { id, path: dir });
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
  }, [activeResource?.id]);

  useEffect(() => {
    if (!isOnline || !loadDirRef.current) return;
    loadDirRef.current(path);
  }, [isOnline, path, loadDirRef]);

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
              <tr key={entry.name} className={entry.isDir ? "sftp-row-dir" : "sftp-row-file"}>
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
    </div>
  );
}