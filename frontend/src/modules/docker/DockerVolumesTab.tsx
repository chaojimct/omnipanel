import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import type { DockerVolumeSummary, DockerCreateVolumeRequest } from "../../ipc/bindings";
import type { DockerActionResult } from "./useDockerWorkspace";

interface ConfirmState {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  onConfirm: () => void;
}

interface DockerVolumesTabProps {
  volumes: DockerVolumeSummary[];
  canManage: boolean;
  onRefresh: () => Promise<void>;
  onCreate: (req: DockerCreateVolumeRequest) => Promise<DockerActionResult>;
  onRemove: (name: string) => Promise<DockerActionResult>;
  onPrune: () => Promise<DockerActionResult>;
  onInspect: (name: string) => void;
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function DockerVolumesTab({ volumes, canManage, onRefresh, onCreate, onRemove, onPrune, onInspect }: DockerVolumesTabProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [driver, setDriver] = useState("local");
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  return (
    <div className="container-list">
      <div className="docker-filters">
        <span className="text-muted text-sm">{volumes.length} 个卷</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <button className="btn btn-secondary btn-sm" onClick={onRefresh}>刷新</button>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!canManage}
            onClick={async () => {
              setConfirm({
                title: "清理未使用的卷",
                message: "将删除所有未使用的卷以释放磁盘空间。",
                confirmLabel: "确认清理",
                onConfirm: async () => {
                  setConfirm(null);
                  await onPrune();
                },
              });
            }}
          >
            清理
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!canManage}
            onClick={() => setShowCreate(true)}
          >
            新建卷
          </button>
        </div>
      </div>
      <div className="list-header volume-row">
        <span>名称</span>
        <span>驱动</span>
        <span>挂载点</span>
        <span>大小</span>
        <span>状态</span>
        <span></span>
      </div>
      {volumes.length === 0 ? (
        <div className="docker-empty" style={{ minHeight: 120 }}>暂无卷</div>
      ) : (
          volumes.map((v) => (
            <div
              key={v.name}
              className="container-card volume-row"
              onClick={() => onInspect(v.name)}
            >
              <div className="container-title">{v.name}</div>
              <div className="text-sm">{v.driver}</div>
              <div className="text-sm text-muted" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{v.mountpoint}</div>
              <div className="text-sm">{formatBytes(v.sizeBytes)}</div>
              <div className="text-sm">{v.inUse ? <span className="badge badge-success">使用中</span> : <span className="badge badge-muted">空闲</span>}</div>
              <div className="container-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="btn-icon text-danger"
                  title="删除卷"
                  disabled={!canManage}
                  onClick={() => {
                  setConfirm({
                    title: `删除卷 ${v.name}`,
                    message: `将永久删除卷 ${v.name}，此操作不可恢复。`,
                    confirmLabel: "确认删除",
                    onConfirm: async () => {
                      setConfirm(null);
                      await onRemove(v.name);
                    },
                  });
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>新建卷</h3>
            <button className="btn-icon" onClick={() => setShowCreate(false)} title="关闭">×</button>
          </div>
          <div className="modal-body">
            <div className="form-field">
              <label className="form-label">名称</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div className="form-field">
              <label className="form-label">驱动</label>
              <input className="input" value={driver} onChange={(e) => setDriver(e.target.value)} style={{ width: "100%" }} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
            <button
              className="btn btn-primary"
              disabled={!name.trim()}
              onClick={async () => {
                const r = await onCreate({
                  name: name.trim(),
                  driver: driver.trim() || null,
                  labels: [],
                });
                if (r.ok) {
                  setShowCreate(false);
                  setName("");
                }
              }}
            >
              创建
            </button>
          </div>
        </div>
      </Modal>
      {confirm && (
        <ConfirmModal confirm={confirm} onCancel={() => setConfirm(null)} />
      )}
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
