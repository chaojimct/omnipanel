import { useState } from "react";
import { Button } from "../../components/ui/Button";
import type { DockerComposeProject } from "../../ipc/bindings";
import type { DockerComposeAction } from "../../ipc/bindings";

interface DockerComposeDrawerProps {
  project: DockerComposeProject | null;
  onClose: () => void;
  onAction: (action: DockerComposeAction, project: DockerComposeProject) => Promise<{ ok: boolean; message: string }>;
}

export function DockerComposeDrawer({ project, onClose, onAction }: DockerComposeDrawerProps) {
  const [busy, setBusy] = useState<DockerComposeAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!project) return null;

  const run = async (action: DockerComposeAction) => {
    setBusy(action);
    setMessage(null);
    const r = await onAction(action, project);
    setBusy(null);
    setMessage(r.message);
  };

  return (
    <>
      <div className="drawer-overlay show" onClick={onClose} />
      <aside className="docker-drawer" role="dialog" aria-label="Compose 项目详情">
        <header className="docker-drawer-header">
          <div className="docker-drawer-title">
            <div className="docker-drawer-eyebrow">Compose</div>
            <h2 title={project.name}>{project.name}</h2>
          </div>
          <Button variant="icon" onClick={onClose} title="关闭">×</Button>
        </header>
        <div className="docker-drawer-body">
          <section className="docker-drawer-section">
            <h4>基础</h4>
            <dl className="drawer-kv">
              <dt>项目名</dt>
              <dd><code>{project.name}</code></dd>
              <dt>工作目录</dt>
              <dd><code>{project.workingDir ?? "-"}</code></dd>
              <dt>Compose 文件</dt>
              <dd><code>{project.configFiles ?? "-"}</code></dd>
              <dt>服务</dt>
              <dd>{project.serviceCount}</dd>
              <dt>容器</dt>
              <dd>
                {project.containerCount}
                {project.runningContainerCount > 0 && (
                  <span className="text-muted"> · 运行 {project.runningContainerCount}</span>
                )}
              </dd>
            </dl>
          </section>
          {project.services.length > 0 && (
            <section className="docker-drawer-section">
              <h4>服务 ({project.services.length})</h4>
              <table className="docker-drawer-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>镜像</th>
                    <th>容器</th>
                  </tr>
                </thead>
                <tbody>
                  {project.services.map((s) => (
                    <tr key={s.name}>
                      <td><code>{s.name}</code></td>
                      <td><code className="text-muted">{s.image || "-"}</code></td>
                      <td>
                        {s.containerCount}
                        {s.runningContainerCount > 0 && (
                          <span className="text-success"> · {s.runningContainerCount} 运行</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {message && (
            <div className={`docker-drawer-msg ${message.startsWith("已") ? "ok" : "err"}`}>
              {message}
            </div>
          )}
        </div>
        <footer className="docker-drawer-footer">
          <Button
            variant="primary"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run("Up")}
          >
            {busy === "Up" ? "启动中…" : "Up"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run("Restart")}
          >
            {busy === "Restart" ? "重启中…" : "Restart"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run("Pull")}
          >
            {busy === "Pull" ? "拉取中…" : "Pull"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={busy !== null}
            onClick={() => void run("Down")}
          >
            {busy === "Down" ? "停止中…" : "Down"}
          </Button>
        </footer>
      </aside>
    </>
  );
}
