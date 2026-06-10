import { useSshOverview } from "../../hooks/useSshOverview";
import { formatBytes, formatUsageBytes, safePercent } from "../../../../../stores/sshStatsStore";
import { useI18n } from "../../../../../i18n";
import { Button } from "../../../../../components/ui/Button";
import { useState } from "react";
import type { SshProcessInfo, SshProcessPort } from "../../../../../ipc/bindings";
import type { SshManagerContext } from "../../hooks/useSshManager";
import { ProcessDetailDrawer } from "./ProcessDetailDrawer";
import { TunnelCreateDialog, type TunnelDraft } from "./TunnelCreateDialog";

type Props = Pick<
  SshManagerContext,
  "profile" | "activeResource" | "setDetailTab"
>;

function CpuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9z" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M6 2v2M6 20v2M18 2v2M18 20v2" strokeWidth="1" />
    </svg>
  );
}

function MemoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <rect x="5" y="9" width="3" height="6" rx="0.5" />
      <rect x="10.5" y="9" width="3" height="6" rx="0.5" />
      <rect x="16" y="9" width="3" height="6" rx="0.5" />
      <path d="M2 10h2M2 14h2M20 10h2M20 14h2" strokeWidth="1" />
    </svg>
  );
}

function DiskIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" />
      <path d="M12 22a10 10 0 0 1-10-10h3a7 7 0 0 0 7 7v3z" />
    </svg>
  );
}

function barStyle(ratio: number, accent: string): React.CSSProperties {
  return {
    width: `${Math.min(ratio * 100, 100)}%`,
    background: accent,
  };
}

type StatCardProps = {
  label: string;
  icon: React.ReactNode;
  percent: number;
  value: string;
  details: string[];
  accent: string;
};

function StatCard({ label, icon, percent, value, details, accent }: StatCardProps) {
  const pctColor =
    percent >= 90 ? "var(--danger)" : percent >= 70 ? "var(--warn)" : accent;

  return (
    <div className="ssh-ov-card">
      <div className="ssh-ov-card-head">
        <div className="ssh-ov-card-icon" style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}>
          {icon}
        </div>
        <span className="ssh-ov-card-label">{label}</span>
      </div>
      <div className="ssh-ov-card-pct" style={{ color: pctColor }}>{value}</div>
      <div className="ssh-ov-card-bar">
        <div className="ssh-ov-card-bar-track">
          <div className="ssh-ov-card-bar-fill" style={barStyle(percent / 100, accent)} />
        </div>
      </div>
      <ul className="ssh-ov-card-details">
        {details.map((d, i) => (
          <li key={i}><span>{d}</span></li>
        ))}
      </ul>
    </div>
  );
}

type SortKey = Exclude<keyof SshProcessInfo, "ports">;
const PAGE_SIZE = 50;

type ProcessListPanelProps = {
  resourceId: string | null;
  processes: SshProcessInfo[];
  loading: boolean;
  refreshing: boolean;
  updatedAt: number | null;
  onRefresh: () => void;
  setDetailTab: (tab: import("../../types").DetailTab) => void;
};

function ProcessListPanel({
  resourceId,
  processes,
  loading,
  refreshing,
  updatedAt,
  onRefresh,
  setDetailTab,
}: ProcessListPanelProps) {
  const { t } = useI18n();
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("cpu");
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [query, setQuery] = useState("");
  const [tunnelDraft, setTunnelDraft] = useState<TunnelDraft | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<SshProcessInfo | null>(null);

  function openTunnelDialog(port: SshProcessPort) {
    setSelectedProcess(null);
    setTunnelDraft({
      remotePort: port.localPort,
      localPort: String(port.localPort),
      remoteHost: port.localAddress === "*" || port.localAddress === "::" ? "127.0.0.1" : port.localAddress,
      tunnelType: "local",
    });
  }

  const filtered = processes.filter((p) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const portHit = (p.ports ?? []).some((port) =>
      String(port.localPort).includes(q) ||
      (port.localAddress ?? "").toLowerCase().includes(q),
    );
    return (
      String(p.pid).includes(q) ||
      (p.user ?? "").toLowerCase().includes(q) ||
      (p.command ?? "").toLowerCase().includes(q) ||
      portHit
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") return sortDir * (av - bv);
    const avs = av == null ? "" : String(av);
    const bvs = bv == null ? "" : String(bv);
    return sortDir * avs.localeCompare(bvs);
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(key === "cpu" || key === "mem" ? -1 : 1);
    }
    setPage(0);
  }

  function SortIndicator({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="proc-sort-arrow">↕</span>;
    return <span className="proc-sort-arrow proc-sort-active">{sortDir === -1 ? "↓" : "↑"}</span>;
  }

  const dataColumns: { key: SortKey; label: string; align?: "right"; colClass: string; render: (p: SshProcessInfo) => React.ReactNode }[] = [
    { key: "user", label: t("ssh.processList.user"), colClass: "proc-col-user", render: (p) => p.user },
    { key: "pid", label: t("ssh.processList.pid"), align: "right", colClass: "proc-col-pid", render: (p) => p.pid },
    { key: "cpu", label: t("ssh.processList.cpu"), align: "right", colClass: "proc-col-cpu", render: (p) => p.cpu?.toFixed(1) ?? "—" },
    { key: "mem", label: t("ssh.processList.mem"), align: "right", colClass: "proc-col-mem", render: (p) => p.mem?.toFixed(1) ?? "—" },
    { key: "vsz", label: t("ssh.processList.vsz"), align: "right", colClass: "proc-col-vsz", render: (p) => p.vsz != null ? formatBytes(p.vsz) : "—" },
    { key: "rss", label: t("ssh.processList.rss"), align: "right", colClass: "proc-col-rss", render: (p) => p.rss != null ? formatBytes(p.rss * 1024) : "—" },
    { key: "stat", label: t("ssh.processList.stat"), colClass: "proc-col-stat", render: (p) => p.stat },
    { key: "start", label: t("ssh.processList.start"), colClass: "proc-col-start", render: (p) => p.start },
    { key: "time", label: t("ssh.processList.time"), colClass: "proc-col-time", render: (p) => p.time },
    { key: "command", label: t("ssh.processList.command"), colClass: "proc-col-cmd", render: (p) => p.command },
  ];

  const updatedLabel =
    updatedAt != null
      ? new Date(updatedAt).toLocaleTimeString()
      : null;

  return (
    <div className="proc-panel">
      <div className="proc-header">
        <span className="proc-title">{t("ssh.processList.title")}</span>
        <span className="proc-count">{t("ssh.processList.total", { count: filtered.length })}</span>
        {updatedLabel && (
          <span className="proc-updated">
            {t("ssh.processList.updatedAt", { time: updatedLabel })}
          </span>
        )}
        <input
          className="input input-sm proc-search"
          placeholder={t("ssh.processList.search")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
        />
        <div className="proc-header-actions">
          {refreshing && (
            <span className="proc-refresh-hint">{t("ssh.overview.refreshing")}</span>
          )}
          <button className="proc-refresh" onClick={onRefresh} disabled={loading}>
            {loading ? "⟳" : "↻"}
          </button>
        </div>
      </div>
      {paged.length === 0 && !loading && (
        <div className="proc-empty">{t("ssh.processList.empty")}</div>
      )}
      <div className="proc-table-wrap">
        <table className="proc-table">
          <colgroup>
            <col className="proc-col-user" />
            <col className="proc-col-pid" />
            <col className="proc-col-ports" />
            <col className="proc-col-cpu" />
            <col className="proc-col-mem" />
            <col className="proc-col-vsz" />
            <col className="proc-col-rss" />
            <col className="proc-col-stat" />
            <col className="proc-col-start" />
            <col className="proc-col-time" />
            <col className="proc-col-cmd" />
          </colgroup>
          <thead>
            <tr>
              {dataColumns.slice(0, 2).map((c) => (
                <th
                  key={c.key}
                  className={c.align === "right" ? "proc-cell-right" : undefined}
                  onClick={() => handleSort(c.key)}
                >
                  {c.label} <SortIndicator col={c.key} />
                </th>
              ))}
              <th>{t("ssh.processList.ports")}</th>
              {dataColumns.slice(2).map((c) => (
                <th
                  key={c.key}
                  className={c.align === "right" ? "proc-cell-right" : undefined}
                  onClick={() => handleSort(c.key)}
                >
                  {c.label} <SortIndicator col={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((p, rowIndex) => (
              <tr
                key={`${p.pid}-${p.user}-${rowIndex}`}
                className="proc-row-clickable"
                onClick={() => setSelectedProcess(p)}
              >
                {dataColumns.slice(0, 2).map((c) => (
                  <td
                    key={c.key}
                    className={c.align === "right" ? "proc-cell-right" : undefined}
                  >
                    {c.render(p)}
                  </td>
                ))}
                <td className="proc-cell-ports">
                  {(p.ports ?? []).length === 0 ? (
                    "—"
                  ) : (
                    <div className="proc-ports-inner">
                      {(p.ports ?? []).slice(0, 3).map((port, idx) => (
                        <button
                          key={`${port.localPort}-${port.protocol}-${idx}`}
                          type="button"
                          className="proc-port-badge"
                          title={t("ssh.processList.createTunnel")}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTunnelDialog(port);
                          }}
                        >
                          :{port.localPort}
                        </button>
                      ))}
                      {(p.ports ?? []).length > 3 && (
                        <span className="proc-port-more">+{(p.ports ?? []).length - 3}</span>
                      )}
                    </div>
                  )}
                </td>
                {dataColumns.slice(2).map((c) => (
                  <td
                    key={c.key}
                    className={[
                      c.align === "right" ? "proc-cell-right" : undefined,
                      c.key === "command" ? "proc-cell-cmd" : undefined,
                      c.key === "start" || c.key === "time" || c.key === "stat"
                        ? "proc-cell-compact"
                        : undefined,
                    ].filter(Boolean).join(" ") || undefined}
                    title={
                      c.key === "command"
                        ? p.command
                        : c.key === "start" || c.key === "time" || c.key === "stat"
                          ? String(c.render(p) ?? "")
                          : undefined
                    }
                  >
                    {c.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="proc-pager">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
      <ProcessDetailDrawer
        resourceId={resourceId}
        process={selectedProcess}
        setDetailTab={setDetailTab}
        onClose={() => setSelectedProcess(null)}
        onKilled={onRefresh}
        onPortClick={openTunnelDialog}
      />
      <TunnelCreateDialog
        open={tunnelDraft != null}
        resourceId={resourceId}
        draft={tunnelDraft}
        onClose={() => setTunnelDraft(null)}
      />
    </div>
  );
}

export function OverviewDetailTab({
  profile,
  activeResource,
  setDetailTab,
}: Props) {
  const { t } = useI18n();
  const resourceId = activeResource?.id ?? null;
  const {
    phase,
    stats,
    processes,
    error,
    updatedAt,
    refreshing,
    refreshProcesses,
    refresh,
  } = useSshOverview(resourceId);

  const cpuPct = stats ? Math.round(stats.cpuUsage ?? 0) : 0;
  const memPct = stats
    ? safePercent(stats.memory.used, stats.memory.total)
    : 0;
  const diskPct = stats
    ? safePercent(stats.disk.used, stats.disk.total)
    : 0;

  const cpuDetails = stats
    ? [`${(stats.cpuUsage ?? 0).toFixed(1)}% 使用率 · ${stats.cpuCores} 核心`, `负载 ${stats.load}`]
    : [profile.cpu ?? "—"];
  const memDetails = stats
    ? [
        formatUsageBytes(stats.memory.used, stats.memory.total),
        stats.memory.total && stats.memory.total > 0
          ? `${formatBytes(stats.memory.available)} 可用`
          : "—",
      ]
    : [profile.memory ?? "—"];
  const diskDetails = stats
    ? [
        formatUsageBytes(stats.disk.used, stats.disk.total),
        stats.disk.total && stats.disk.total > 0
          ? `${formatBytes(stats.disk.available)} 可用`
          : "—",
      ]
    : [profile.disk ?? "—"];

  const hasCachedStats = stats != null;

  if ((phase === "loading" || phase === "idle") && !hasCachedStats) {
    return (
      <div className="ssh-ov ssh-ov--loading">
        <div className="ssh-ov-loading">
          <span className="ssh-ov-loading-spinner" aria-hidden />
          <p>{t("ssh.overview.loading")}</p>
        </div>
      </div>
    );
  }

  if (phase === "error" && !hasCachedStats) {
    return (
      <div className="ssh-ov ssh-ov--error">
        <div className="ssh-ov-loading">
          <p className="ssh-ov-error-text">{error ?? t("ssh.overview.loadError")}</p>
          <Button variant="secondary" size="sm" onClick={() => refresh()}>
            {t("ssh.overview.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ssh-ov">
      <div className="ssh-ov-cards">
        <StatCard
          label="CPU"
          icon={<CpuIcon />}
          percent={cpuPct}
          value={`${cpuPct}%`}
          details={cpuDetails}
          accent="var(--accent)"
        />
        <StatCard
          label="Memory"
          icon={<MemoryIcon />}
          percent={memPct}
          value={
            stats?.memory.total && stats.memory.total > 0 ? `${memPct}%` : "—"
          }
          details={memDetails}
          accent="var(--success)"
        />
        <StatCard
          label="Disk"
          icon={<DiskIcon />}
          percent={diskPct}
          value={`${diskPct}%`}
          details={diskDetails}
          accent="var(--warn)"
        />
      </div>
      <ProcessListPanel
        resourceId={resourceId}
        processes={processes}
        loading={refreshing}
        refreshing={refreshing}
        updatedAt={updatedAt}
        setDetailTab={setDetailTab}
        onRefresh={refreshProcesses}
      />
    </div>
  );
}
