import { formatUptime } from "./monitoringUtils";

type Props = {
  hostLabel: string;
  hostAddress?: string;
  uptimeSecs?: number | null;
  updatedAt?: number | null;
  live?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export function MonStatusBar({
  hostLabel,
  hostAddress,
  uptimeSecs,
  updatedAt,
  live = true,
  refreshing = false,
  onRefresh,
}: Props) {
  return (
    <div className="mon-status-bar">
      <span className={`live-dot${live ? "" : " live-dot--paused"}`} />
      <span className="host-chip">{hostLabel}</span>
      {hostAddress && <span>{hostAddress}</span>}
      {hostAddress && uptimeSecs != null && <span>·</span>}
      {uptimeSecs != null && <span>运行 {formatUptime(uptimeSecs)}</span>}
      {updatedAt != null && (
        <>
          <span>·</span>
          <span>更新于 {fmtTime(updatedAt)}</span>
        </>
      )}
      <span className="mon-status-spacer" />
      {onRefresh && (
        <button
          type="button"
          className={`mon-refresh-btn${refreshing ? " spinning" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          刷新
        </button>
      )}
    </div>
  );
}
