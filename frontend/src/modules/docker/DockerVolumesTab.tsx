import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import type { DockerVolumeSummary, DockerCreateVolumeRequest } from "../../ipc/bindings";
import type { DockerActionResult } from "./useDockerWorkspace";

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
              if (!window.confirm("清理未使用的卷？")) return;
              await onPrune();
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
                  if (!window.confirm(`删除卷 ${v.name}？`)) return;
                  void onRemove(v.name);
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
    </div>
  );
}
