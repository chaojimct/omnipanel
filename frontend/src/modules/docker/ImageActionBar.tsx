import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import type { DockerImageProgress } from "./useDockerWorkspace";

interface ImageActionBarProps {
  canManage: boolean;
  onPull: (image: string, onProgress?: (p: DockerImageProgress) => void) => Promise<{ ok: boolean; message?: string }>;
  onBuild: (
    contextDir: string,
    tag: string,
    dockerfile: string | null,
    onProgress?: (p: DockerImageProgress) => void
  ) => Promise<{ ok: boolean; message?: string }>;
  onMessage: (msg: string, kind?: "ok" | "err") => void;
}

type DialogKind = "pull" | "build" | null;

export function ImageActionBar({ canManage, onPull, onBuild, onMessage }: ImageActionBarProps) {
  const [dlg, setDlg] = useState<DialogKind>(null);
  const [pullImage, setPullImage] = useState("nginx:latest");
  const [ctxDir, setCtxDir] = useState("");
  const [tag, setTag] = useState("myapp:latest");
  const [dockerfile, setDockerfile] = useState("Dockerfile");
  const [progress, setProgress] = useState<DockerImageProgress[]>([]);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setDlg(null);
    setProgress([]);
    setBusy(false);
  };

  const showProgress = (p: DockerImageProgress) => {
    setProgress((prev) => [...prev, p].slice(-50));
  };

  const handlePull = async () => {
    if (!pullImage.trim()) return;
    setBusy(true);
    setProgress([]);
    const r = await onPull(pullImage.trim(), showProgress);
    onMessage(r.message ?? (r.ok ? "完成" : "失败"), r.ok ? "ok" : "err");
    setBusy(false);
    if (r.ok) setTimeout(close, 600);
  };

  const handleBuild = async () => {
    if (!ctxDir.trim() || !tag.trim()) return;
    setBusy(true);
    setProgress([]);
    const r = await onBuild(ctxDir.trim(), tag.trim(), dockerfile.trim() || null, showProgress);
    onMessage(r.message ?? (r.ok ? "完成" : "失败"), r.ok ? "ok" : "err");
    setBusy(false);
    if (r.ok) setTimeout(close, 1200);
  };

  return (
    <>
      <Button variant="secondary" size="sm" disabled={!canManage} onClick={() => setDlg("pull")}>
        拉取镜像
      </Button>
      <Button variant="secondary" size="sm" disabled={!canManage} onClick={() => setDlg("build")}>
        构建镜像
      </Button>
      <Modal open={!!dlg} onClose={close}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{dlg === "pull" ? "拉取镜像" : "构建镜像"}</h3>
            <Button variant="icon" onClick={close} title="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <div className="modal-body">
            {dlg === "pull" && (
              <div className="form-field">
                <label className="form-label">镜像名</label>
                <input
                  className="input"
                  value={pullImage}
                  onChange={(e) => setPullImage(e.target.value)}
                  placeholder="nginx:latest"
                  style={{ width: "100%" }}
                />
              </div>
            )}
            {dlg === "build" && (
              <>
                <div className="form-field">
                  <label className="form-label">构建上下文目录（绝对路径）</label>
                  <input
                    className="input"
                    value={ctxDir}
                    onChange={(e) => setCtxDir(e.target.value)}
                    placeholder="C:\Users\you\myapp"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">目标 tag</label>
                  <input
                    className="input"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="myapp:v1"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Dockerfile（相对 context_dir）</label>
                  <input
                    className="input"
                    value={dockerfile}
                    onChange={(e) => setDockerfile(e.target.value)}
                    placeholder="Dockerfile"
                    style={{ width: "100%" }}
                  />
                </div>
              </>
            )}
            {progress.length > 0 && (
              <div className="docker-progress" style={{ marginTop: 12, maxHeight: 200, overflow: "auto" }}>
                {progress.slice(-15).map((p, i) => (
                  <div key={i} className="text-xs text-muted">
                    <span>{p.status}</span>
                    {p.detail && <span> · {p.detail}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={close} disabled={busy}>
              取消
            </Button>
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                if (dlg === "pull") void handlePull();
                else if (dlg === "build") void handleBuild();
              }}
            >
              {busy ? "执行中…" : "执行"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
