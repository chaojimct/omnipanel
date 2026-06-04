import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useActionStore } from "../../stores/actionStore";
import { useAiStore } from "../../stores/aiStore";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";
import {
  useContainerLogStream,
  useDockerWorkspace,
  type ContainerFilter,
} from "./useDockerWorkspace";
import { DockerExecTerminal } from "./DockerExecTerminal";
import type {
  DockerContainerDetail,
  DockerContainerSummary,
} from "../../ipc/bindings";

type WorkspaceTab = "containers" | "images" | "compose";

interface ConfirmState {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  onConfirm: () => void;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}

function formatTimestamp(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  return new Date(seconds * 1000).toLocaleString();
}

const STATUS_BADGE: Record<string, string> = {
  online: "badge-success",
  degraded: "badge-warn",
  offline: "badge-muted",
};

const SOURCE_LABEL: Record<string, string> = {
  "local-engine": "本地 Engine",
  "remote-engine": "远程 Engine",
  "ssh-engine": "SSH 宿主机",
  "panel-adapter": "面板适配",
};

export function DockerPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const enqueueAction = useActionStore((s) => s.enqueueAction);
  const setAiDraft = useAiStore((s) => s.setDraftPrompt);
  const openAiDrawer = useAiStore((s) => s.openDrawer);

  const docker = useDockerWorkspace();
  const {
    connections,
    selectedConnection,
    selectedConnectionId,
    selectConnection,
    probe,
    overview,
    containers,
    images,
    composeProjects,
    connectionsLoading,
    dataLoading,
    error,
    refresh,
    containerAction,
    inspect,
    removeImage,
    pruneImages,
  } = docker;

  const [tab, setTab] = useState<WorkspaceTab>("containers");
  const [filter, setFilter] = useState<ContainerFilter>("all");
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  // 连接 → topbar 标签页。
  const topbarTabs = useMemo(
    () =>
      connections.map((c) => ({
        id: c.connectionId,
        label: c.name,
        active: c.connectionId === selectedConnectionId,
      })),
    [connections, selectedConnectionId]
  );

  useTopbarTabs(
    topbarTabs,
    { onSelect: (id) => selectConnection(id) },
    { mode: "connection", showAddTab: false }
  );

  // 切换连接时复位本地视图状态。
  useEffect(() => {
    setDrawerId(null);
    setTab("containers");
    setFilter("all");
    setQuery("");
  }, [selectedConnectionId]);

  const counts = useMemo(
    () => ({
      all: containers.length,
      running: containers.filter((c) => c.running).length,
      stopped: containers.filter((c) => !c.running).length,
    }),
    [containers]
  );

  const filteredContainers = useMemo(() => {
    const q = query.toLowerCase();
    return containers.filter((c) => {
      const matchesFilter =
        filter === "all" || (filter === "running" ? c.running : !c.running);
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.image.toLowerCase().includes(q) ||
        c.networks.some((n) => n.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [containers, filter, query]);

  // 审计记录（记录型动作，进入操作流，不二次执行）。
  const recordAudit = (title: string, description: string) => {
    enqueueAction({
      type: "docker",
      title,
      description,
      resourceId: selectedConnectionId ?? undefined,
      source: "用户",
    });
  };

  const runContainerAction = async (
    container: DockerContainerSummary,
    action: string,
    label: string
  ) => {
    const res = await containerAction(container.id, action);
    if (res.ok) {
      showToast(`${label} ${container.name} 成功`);
    } else {
      showToast(`${label} ${container.name} 失败：${res.message ?? "未知错误"}`);
    }
  };

  const confirmContainerRemove = (container: DockerContainerSummary) => {
    const isProd = selectedConnection?.environment === "prod";
    setConfirm({
      title: `删除容器 ${container.name}`,
      message: `将永久删除容器（含其可写层），此操作不可恢复。`,
      detail: `${selectedConnection?.name ?? ""} · ${container.image}${isProd ? " · ⚠ 生产环境" : ""}`,
      confirmLabel: "确认删除",
      onConfirm: async () => {
        setConfirm(null);
        const res = await containerAction(container.id, "remove");
        if (res.ok) {
          recordAudit(`删除容器 ${container.name}`, `${selectedConnection?.name ?? ""} · docker rm -f ${container.name}`);
          showToast(`已删除容器 ${container.name}`);
          if (drawerId === container.id) setDrawerId(null);
        } else {
          showToast(`删除失败：${res.message ?? "未知错误"}`);
        }
      },
    });
  };

  const confirmImageRemove = (imageId: string, label: string) => {
    setConfirm({
      title: `删除镜像 ${label}`,
      message: "删除后若有容器引用将失败，可使用强制删除。",
      detail: selectedConnection?.name ?? "",
      confirmLabel: "确认删除",
      onConfirm: async () => {
        setConfirm(null);
        const res = await removeImage(imageId, true);
        if (res.ok) {
          recordAudit(`删除镜像 ${label}`, `${selectedConnection?.name ?? ""} · docker rmi -f ${label}`);
          showToast(`已删除镜像 ${label}`);
        } else {
          showToast(`删除失败：${res.message ?? "未知错误"}`);
        }
      },
    });
  };

  const confirmPrune = () => {
    setConfirm({
      title: "清理悬空镜像",
      message: "将删除所有未被引用的悬空镜像以释放磁盘空间。",
      detail: selectedConnection?.name ?? "",
      confirmLabel: "确认清理",
      onConfirm: async () => {
        setConfirm(null);
        const res = await pruneImages();
        if (res.ok) {
          recordAudit("清理 Docker 悬空镜像", `${selectedConnection?.name ?? ""} · docker image prune`);
          showToast(res.message ?? "清理完成");
        } else {
          showToast(`清理失败：${res.message ?? "未知错误"}`);
        }
      },
    });
  };

  const isOffline = probe?.status === "offline";

  return (
    <>
      <div className="docker-layout">
        {/* 连接头部 */}
        {selectedConnection && (
          <div className="docker-conn-header">
            <div className="flex items-center gap-2">
              <span className={`status-dot ${selectedConnection.status === "online" ? "online" : selectedConnection.status === "degraded" ? "warning" : "offline"}`} />
              <strong>{selectedConnection.name}</strong>
              <span className={`badge ${STATUS_BADGE[selectedConnection.status] ?? "badge-muted"}`}>
                {selectedConnection.status === "online" ? "在线" : selectedConnection.status === "degraded" ? "降级" : "离线"}
              </span>
              <span className="text-muted text-xs">{SOURCE_LABEL[selectedConnection.source] ?? selectedConnection.source}</span>
              <span className="text-muted text-xs">{selectedConnection.hostLabel}</span>
              {selectedConnection.engineVersion && (
                <span className="text-muted text-xs">Engine {selectedConnection.engineVersion}</span>
              )}
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={refresh} disabled={dataLoading}>
              {dataLoading ? "刷新中…" : "刷新"}
            </button>
          </div>
        )}

        {connectionsLoading ? (
          <div className="docker-empty">正在加载 Docker 连接…</div>
        ) : connections.length === 0 ? (
          <div className="docker-empty">暂无 Docker 连接</div>
        ) : isOffline ? (
          <div className="docker-empty">
            <div className="docker-empty-title">Docker 未安装或未启动</div>
            <div className="text-muted text-sm">{probe?.warningMessage ?? error ?? "无法连接到 Docker Engine"}</div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={refresh}>重试</button>
          </div>
        ) : (
          <>
            {/* 统计 */}
            <div className="docker-stats">
              <StatCard color="success" value={overview?.summary.containersRunning ?? counts.running} label={t("docker.stats.running")} />
              <StatCard color="muted" value={overview?.summary.containersStopped ?? counts.stopped} label={t("docker.stats.stopped")} />
              <StatCard color="accent" value={overview?.summary.images ?? images.length} label={t("docker.stats.images")} />
              <StatCard color="warn" value={composeProjects.length} label="Compose" />
            </div>

            {/* 子页签 */}
            <div className="docker-subtabs">
              {(["containers", "images", "compose"] as const).map((key) => (
                <button key={key} type="button" className={`subtab${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>
                  {key === "containers" ? "容器" : key === "images" ? "镜像" : "Compose"}
                </button>
              ))}
            </div>

            {tab === "containers" && (
              <>
                <div className="docker-filters">
                  {(["all", "running", "stopped"] as const).map((key) => (
                    <button key={key} type="button" className={`filter-tab${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
                      {t(`docker.filters.${key}`)}
                      <span className="count">{counts[key]}</span>
                    </button>
                  ))}
                  <span style={{ marginLeft: "auto" }}>
                    <input
                      className="input input-search"
                      placeholder="筛选容器…"
                      style={{ fontSize: 11, width: 200 }}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </span>
                </div>

                <div className="container-list">
                  <div className="list-header list-5">
                    <span>{t("docker.list.container")}</span>
                    <span>{t("docker.list.status")}</span>
                    <span>{t("docker.list.ports")}</span>
                    <span>网络</span>
                    <span></span>
                  </div>
                  {filteredContainers.length === 0 ? (
                    <div className="docker-empty" style={{ minHeight: 120 }}>
                      {dataLoading ? "加载中…" : "没有匹配的容器"}
                    </div>
                  ) : (
                    filteredContainers.map((container) => (
                      <div
                        key={container.id}
                        className="container-card container-card-5"
                        style={!container.running ? { opacity: 0.65 } : undefined}
                        onClick={() => setDrawerId(container.id)}
                      >
                        <div className="container-name">
                          <div className="container-icon" style={{ color: container.running ? "var(--success)" : "var(--muted)" }}>
                            <BoxIcon />
                          </div>
                          <div>
                            <div className="container-title">{container.name}</div>
                            <div className="container-image">{container.image}</div>
                          </div>
                        </div>
                        <div className="container-status">
                          <span className={`status-dot ${container.running ? "online" : "offline"}`} />
                          <span className={container.running ? "text-success text-sm" : "text-muted text-sm"}>
                            {container.statusText || (container.running ? "Running" : "Exited")}
                          </span>
                        </div>
                        <div className="text-sm" style={{ whiteSpace: "pre-line" }}>
                          {container.ports.length > 0 ? container.ports.map((p) => portLabel(p)).join("\n") : "-"}
                        </div>
                        <div className="text-sm text-muted">{container.networks.join(", ") || "-"}</div>
                        <div className="container-actions" onClick={(e) => e.stopPropagation()}>
                          {container.running ? (
                            <>
                              <button className="btn-icon" title="重启" onClick={() => runContainerAction(container, "restart", "重启")}>
                                <RestartIcon />
                              </button>
                              <button className="btn-icon" title="停止" onClick={() => runContainerAction(container, "stop", "停止")}>
                                <StopIcon />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="btn-icon" title="启动" onClick={() => runContainerAction(container, "start", "启动")}>
                                <PlayIcon />
                              </button>
                              <button className="btn-icon text-danger" title="删除" onClick={() => confirmContainerRemove(container)}>
                                <TrashIcon />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {tab === "images" && (
              <div className="container-list">
                <div className="docker-filters">
                  <span className="text-muted text-sm">{images.length} 个镜像</span>
                  <button className="btn btn-secondary btn-sm" style={{ marginLeft: "auto" }} onClick={confirmPrune}>
                    清理悬空镜像
                  </button>
                </div>
                <div className="list-header image-row">
                  <span>仓库</span>
                  <span>标签</span>
                  <span>大小</span>
                  <span>创建时间</span>
                  <span></span>
                </div>
                {images.length === 0 ? (
                  <div className="docker-empty" style={{ minHeight: 120 }}>{dataLoading ? "加载中…" : "暂无镜像"}</div>
                ) : (
                  images.map((img, idx) => (
                    <div key={`${img.id}-${img.repository}-${img.tag}-${idx}`} className="container-card image-row">
                      <div className="container-title">
                        {img.repository}
                        {img.dangling && <span className="badge badge-warn" style={{ marginLeft: 6 }}>悬空</span>}
                      </div>
                      <div className="text-sm text-muted">{img.tag}</div>
                      <div className="text-sm">{formatBytes(img.sizeBytes)}</div>
                      <div className="text-sm text-muted">{formatTimestamp(img.createdAt)}</div>
                      <div className="container-actions">
                        <button className="btn-icon text-danger" title="删除镜像" onClick={() => confirmImageRemove(img.id, `${img.repository}:${img.tag}`)}>
                          <TrashIcon />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "compose" && (
              <div className="container-list">
                {composeProjects.length === 0 ? (
                  <div className="docker-empty" style={{ minHeight: 120 }}>
                    {dataLoading ? "加载中…" : "未识别到 Compose 项目"}
                  </div>
                ) : (
                  composeProjects.map((proj) => (
                    <div key={proj.name} className="compose-card">
                      <div className="compose-head">
                        <strong>{proj.name}</strong>
                        <span className="text-muted text-xs">
                          {proj.runningContainerCount}/{proj.containerCount} 运行 · {proj.serviceCount} 服务
                        </span>
                        {proj.workingDir && <span className="text-muted text-xs">{proj.workingDir}</span>}
                      </div>
                      <div className="compose-services">
                        {proj.services.map((svc) => (
                          <div key={svc.name} className="compose-service">
                            <span className={`status-dot ${svc.runningContainerCount > 0 ? "online" : "offline"}`} />
                            <span className="compose-service-name">{svc.name}</span>
                            <span className="text-muted text-xs">{svc.image}</span>
                            <span className="text-muted text-xs" style={{ marginLeft: "auto" }}>
                              {svc.runningContainerCount}/{svc.containerCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ContainerDrawer
        connectionId={selectedConnectionId}
        containerId={drawerId}
        canExec={selectedConnection?.source === "local-engine"}
        hostLabel={selectedConnection?.hostLabel ?? null}
        sourceLabel={selectedConnection ? SOURCE_LABEL[selectedConnection.source] ?? selectedConnection.source : null}
        inspect={inspect}
        onClose={() => setDrawerId(null)}
        onAction={runContainerAction}
        onRemove={confirmContainerRemove}
        onNavigate={navigate}
        onSendToAi={(detail) => {
          const s = detail.summary;
          const ports = s.ports.length
            ? s.ports.map((p) => `${p.publicPort ?? "-"}->${p.privatePort}/${p.protocol}`).join(", ")
            : "无";
          const context = [
            `请帮我分析以下 Docker 容器的运行情况：`,
            `- 名称：${s.name}`,
            `- 镜像：${s.image}`,
            `- 状态：${s.state}（${s.statusText}）`,
            detail.exitCode != null ? `- 退出码：${detail.exitCode}` : null,
            detail.restartPolicy ? `- 重启策略：${detail.restartPolicy}` : null,
            `- 端口：${ports}`,
            `- 来源：${selectedConnection ? SOURCE_LABEL[selectedConnection.source] ?? selectedConnection.source : "未知"} · ${selectedConnection?.hostLabel ?? ""}`,
          ]
            .filter(Boolean)
            .join("\n");
          setAiDraft(context);
          openAiDrawer();
          recordAudit(`发送容器上下文给 AI：${s.name}`, `${selectedConnection?.name ?? ""} · ${s.image}`);
        }}
      />

      {confirm && (
        <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)} />
      )}

      {toast && <div className="docker-toast">{toast}</div>}
    </>
  );
}

function StatCard({ color, value, label }: { color: string; value: number; label: string }) {
  const bg = `var(--${color}-soft)`;
  const fg = `var(--${color})`;
  return (
    <div className="docker-stat">
      <div className="stat-icon" style={{ background: bg, color: fg }}>
        <BoxIcon />
      </div>
      <div className="stat-info">
        <span className="stat-val">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function portLabel(p: { ip: string | null; publicPort: number | null; privatePort: number; protocol: string }): string {
  if (p.publicPort != null) {
    return `${p.ip ?? "0.0.0.0"}:${p.publicPort}->${p.privatePort}/${p.protocol}`;
  }
  return `${p.privatePort}/${p.protocol}`;
}

interface ContainerDrawerProps {
  connectionId: string | null;
  containerId: string | null;
  canExec: boolean;
  hostLabel: string | null;
  sourceLabel: string | null;
  inspect: (id: string) => Promise<DockerContainerDetail | null>;
  onClose: () => void;
  onAction: (c: DockerContainerSummary, action: string, label: string) => void;
  onRemove: (c: DockerContainerSummary) => void;
  onNavigate: (path: string) => void;
  onSendToAi: (detail: DockerContainerDetail) => void;
}

type DrawerTab = "info" | "logs" | "terminal";

function ContainerDrawer({
  connectionId,
  containerId,
  canExec,
  hostLabel,
  sourceLabel,
  inspect,
  onClose,
  onAction,
  onRemove,
  onNavigate,
  onSendToAi,
}: ContainerDrawerProps) {
  const [detail, setDetail] = useState<DockerContainerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("info");

  useEffect(() => {
    if (!containerId) {
      setDetail(null);
      return;
    }
    setDrawerTab("info");
    setLoading(true);
    let cancelled = false;
    void inspect(containerId).then((d) => {
      if (!cancelled) {
        setDetail(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [containerId, inspect]);

  const open = Boolean(containerId);

  return (
    <>
      <div className={`drawer-overlay${open ? " show" : ""}`} onClick={onClose} />
      <div className={`drawer${open ? " show" : ""}`}>
        {open && (
          <>
            <div className="drawer-header">
              <div className="container-icon" style={{ color: "var(--success)", width: 28, height: 28, display: "grid", placeItems: "center", background: "var(--success-soft)", borderRadius: "var(--r-sm)" }}>
                <BoxIcon />
              </div>
              <h2>{detail?.summary.name ?? "加载中…"}</h2>
              {detail && (
                <span className={`badge ${detail.summary.running ? "badge-success" : "badge-muted"}`}>
                  {detail.summary.running ? "运行中" : "已停止"}
                </span>
              )}
              <button className="btn-icon" onClick={onClose} title="关闭">
                <CloseIcon />
              </button>
            </div>

            <div className="drawer-subtabs">
              <button className={`subtab${drawerTab === "info" ? " active" : ""}`} onClick={() => setDrawerTab("info")}>详情</button>
              <button className={`subtab${drawerTab === "logs" ? " active" : ""}`} onClick={() => setDrawerTab("logs")}>日志</button>
              {canExec && detail?.summary.running && (
                <button className={`subtab${drawerTab === "terminal" ? " active" : ""}`} onClick={() => setDrawerTab("terminal")}>终端</button>
              )}
            </div>

            <div className="drawer-body">
              {loading && <div className="text-muted text-sm">加载容器详情…</div>}

              {!loading && detail && drawerTab === "info" && (
                <>
                  <div className="drawer-section">
                    <h4>容器信息</h4>
                    <dl className="drawer-kv">
                      <dt>ID</dt><dd className="text-muted">{detail.summary.shortId}</dd>
                      <dt>镜像</dt><dd>{detail.summary.image}</dd>
                      <dt>状态</dt><dd>{detail.summary.statusText || detail.summary.state}</dd>
                      {detail.command && (<><dt>命令</dt><dd className="text-muted">{detail.command}</dd></>)}
                      {detail.restartPolicy && (<><dt>重启策略</dt><dd>{detail.restartPolicy}</dd></>)}
                      {detail.exitCode != null && (<><dt>退出码</dt><dd>{detail.exitCode}</dd></>)}
                    </dl>
                  </div>

                  <div className="drawer-section">
                    <h4>端口</h4>
                    <dl className="drawer-kv">
                      {detail.summary.ports.length > 0 ? (
                        detail.summary.ports.map((p, i) => (
                          <div key={i} style={{ display: "contents" }}>
                            <dt>{i === 0 ? "映射" : `端口 ${i + 1}`}</dt>
                            <dd>{portLabel(p)}</dd>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: "contents" }}><dt>端口</dt><dd>-</dd></div>
                      )}
                    </dl>
                  </div>

                  <div className="drawer-section">
                    <h4>挂载</h4>
                    <dl className="drawer-kv">
                      {detail.mounts.length > 0 ? (
                        detail.mounts.map((m, i) => (
                          <div key={i} style={{ display: "contents" }}>
                            <dt>{m.kind || "mount"}</dt>
                            <dd className="text-sm">{m.source} → {m.destination}{m.readOnly ? " (ro)" : ""}</dd>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: "contents" }}><dt>挂载</dt><dd>-</dd></div>
                      )}
                    </dl>
                  </div>

                  <div className="drawer-section">
                    <h4>网络</h4>
                    <dl className="drawer-kv">
                      {detail.networks.length > 0 ? (
                        detail.networks.map((n, i) => (
                          <div key={i} style={{ display: "contents" }}>
                            <dt>{n.name}</dt>
                            <dd className="text-muted">{n.ipAddress ?? "-"}</dd>
                          </div>
                        ))
                      ) : (
                        <div style={{ display: "contents" }}><dt>网络</dt><dd>-</dd></div>
                      )}
                    </dl>
                  </div>

                  {detail.env.length > 0 && (
                    <div className="drawer-section">
                      <h4>环境变量</h4>
                      <dl className="drawer-kv">
                        {detail.env.map((e) => (
                          <div key={e.key} style={{ display: "contents" }}>
                            <dt>{e.key}</dt><dd className="text-sm">{e.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  <div className="drawer-section">
                    <h4>联动</h4>
                    <div className="kv">
                      <span className="k">引擎来源</span>
                      <span className="v">{sourceLabel ?? "—"}</span>
                    </div>
                    <div className="kv">
                      <span className="k">宿主机</span>
                      <span className="v">{hostLabel ?? "—"}</span>
                    </div>
                    <div className="flex gap-2" style={{ flexWrap: "wrap", marginTop: "var(--sp-2)" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("/ssh")}>打开 SSH</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("/server")}>查看服务器</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onSendToAi(detail)}>发送给 AI 分析</button>
                    </div>
                  </div>
                </>
              )}

              {!loading && detail && drawerTab === "logs" && (
                <LogsView connectionId={connectionId} containerId={containerId} />
              )}

              {!loading && detail && drawerTab === "terminal" && connectionId && containerId && (
                <div className="drawer-section">
                  <h4>容器终端</h4>
                  <DockerExecTerminal connectionId={connectionId} containerId={containerId} />
                </div>
              )}

              {!loading && !detail && (
                <div className="text-muted text-sm">无法获取容器详情，可能已被删除。</div>
              )}

              {detail && (
                <div className="flex gap-2" style={{ marginTop: "var(--sp-4)" }}>
                  {detail.summary.running ? (
                    <>
                      <button className="btn btn-secondary btn-sm" onClick={() => onAction(detail.summary, "restart", "重启")}>重启</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onAction(detail.summary, "stop", "停止")}>停止</button>
                    </>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => onAction(detail.summary, "start", "启动")}>启动</button>
                  )}
                  <button className="btn btn-danger btn-sm" style={{ marginLeft: "auto" }} onClick={() => onRemove(detail.summary)}>删除</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function LogsView({ connectionId, containerId }: { connectionId: string | null; containerId: string | null }) {
  const [follow, setFollow] = useState(true);
  const { lines, streaming, error } = useContainerLogStream(connectionId, containerId, true, follow);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (follow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, follow]);

  return (
    <div className="drawer-section">
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <h4 style={{ margin: 0 }}>日志</h4>
        <span className="text-muted text-xs">{streaming ? "跟随中…" : "已结束"}</span>
        <label className="text-xs flex items-center gap-1" style={{ marginLeft: "auto", cursor: "pointer" }}>
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          自动滚动
        </label>
      </div>
      {error && <div className="text-danger text-sm" style={{ marginBottom: 6 }}>{error}</div>}
      <div className="log-viewer" ref={scrollRef} style={{ maxHeight: 360, overflow: "auto" }}>
        {lines.length === 0 ? (
          <div className="text-muted text-sm">{streaming ? "等待日志输出…" : "暂无日志"}</div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="log-line">
              <span className={line.stream === "stderr" ? "level-error" : "level-info"}>{line.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ConfirmModal({ confirm, onCancel }: { confirm: ConfirmState; onCancel: () => void }) {
  return (
    <>
      <div className="drawer-overlay show" onClick={onCancel} />
      <div className="confirm-modal">
        <h3>{confirm.title}</h3>
        <p className="text-sm">{confirm.message}</p>
        {confirm.detail && <p className="text-muted text-xs">{confirm.detail}</p>}
        <div className="flex gap-2" style={{ marginTop: 16, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>取消</button>
          <button className="btn btn-danger btn-sm" onClick={confirm.onConfirm}>{confirm.confirmLabel}</button>
        </div>
      </div>
    </>
  );
}

// --- 图标 ---
function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <rect x="2" y="7" width="6" height="5" rx="1" />
      <rect x="10" y="7" width="6" height="5" rx="1" />
    </svg>
  );
}
function RestartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M23 4v6h-6M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
