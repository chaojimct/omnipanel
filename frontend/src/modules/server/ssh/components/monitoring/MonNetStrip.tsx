import { useI18n } from "@/i18n";
import type { HostSystemStats } from "@/stores/sshStatsStore";
import { formatCompactCount, formatRate } from "./monitoringUtils";

type Props = {
  stats: HostSystemStats;
  netUpRate: number | null;
  netDownRate: number | null;
  diskReadRate: number | null;
  diskWriteRate: number | null;
  processCount: number;
};

function rateParts(bytesPerSec: number | null): { value: string; unit: string } {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec)) {
    return { value: "—", unit: "" };
  }
  const full = formatRate(bytesPerSec);
  const match = full.match(/^([\d.]+)\s*(.+)$/);
  if (!match) return { value: full, unit: "" };
  return { value: match[1], unit: match[2] };
}

function RateCell({ rate }: { rate: number | null }) {
  const { value, unit } = rateParts(rate);
  return (
    <div className="net-val">
      {value}
      {unit && <span style={{ fontSize: 10, fontWeight: 400 }}> {unit}</span>}
    </div>
  );
}

export function MonNetStrip({
  stats,
  netUpRate,
  netDownRate,
  diskReadRate,
  diskWriteRate,
  processCount,
}: Props) {
  const { t } = useI18n();
  const iface = stats.network?.interface ?? "—";
  const connections = stats.network?.connections;

  const diskTotalRate =
    diskReadRate != null && diskWriteRate != null
      ? diskReadRate + diskWriteRate
      : null;
  const diskIopsApprox =
    diskTotalRate != null ? Math.max(1, Math.round(diskTotalRate / 4096)) : null;

  return (
    <div className="mon-net-strip">
      <div className="mon-net-item">
        <div className="net-label">{t("ssh.monitor.netUp")}</div>
        <RateCell rate={netUpRate} />
        <div className="net-sub">{iface}</div>
      </div>
      <div className="mon-net-item">
        <div className="net-label">{t("ssh.monitor.netDown")}</div>
        <RateCell rate={netDownRate} />
        <div className="net-sub">
          {connections != null
            ? t("ssh.monitor.connections", { count: connections })
            : "—"}
        </div>
      </div>
      <div className="mon-net-item">
        <div className="net-label">{t("ssh.monitor.diskIo")}</div>
        <div className="net-val">
          {diskIopsApprox ?? "—"}
          {diskIopsApprox != null && (
            <span style={{ fontSize: 10, fontWeight: 400 }}> IOPS</span>
          )}
        </div>
        <div className="net-sub">
          {diskReadRate != null && diskWriteRate != null
            ? t("ssh.monitor.diskIoRw", {
                read: formatRate(diskReadRate),
                write: formatRate(diskWriteRate),
              })
            : "—"}
        </div>
      </div>
      <div className="mon-net-item">
        <div className="net-label">{t("ssh.monitor.processesShort")}</div>
        <div className="net-val">{formatCompactCount(processCount)}</div>
        <div className="net-sub">{t("ssh.monitor.processesRunning")}</div>
      </div>
    </div>
  );
}
