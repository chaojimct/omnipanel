import { useRef } from "react";
import { useSshStats } from "../../../../stores/sshStatsStore";

type Props = {
  activeResource: { id: string } | null;
};

const MAX_POINTS = 120;

type Point = { ts: number; value: number };

type StatsLike = { cpuUsage: number; memory: { used: number; total: number } };

function useSeries(
  resourceId: string | null,
  extract: (s: StatsLike) => number,
) {
  const stats = useSshStats(resourceId);
  const ref = useRef<Point[]>([]);
  if (stats) {
    const v = extract(stats);
    const ts = stats.timestamp * 1000;
    const last = ref.current[ref.current.length - 1];
    if (!last || last.ts !== ts) {
      ref.current = [...ref.current.slice(-(MAX_POINTS - 1)), { ts, value: v }];
    }
  }
  return ref.current;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function AreaChart({ data, label, color, unit, max }: { data: Point[]; label: string; color: string; unit: string; max: number }) {
  if (data.length < 2) {
    return (
      <div className="monitor-chart">
        <div className="monitor-chart-header">
          <span className="monitor-chart-label">{label}</span>
          <span className="monitor-chart-value">—</span>
        </div>
        <div className="monitor-chart-empty">等待数据…</div>
      </div>
    );
  }

  const w = 480;
  const h = 120;
  const pad = { t: 8, r: 8, b: 24, l: 36 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;

  const latest = data[data.length - 1].value;
  const len = data.length;

  const points = data.map((d, i) => ({
    x: pad.l + (len > 1 ? (i / (len - 1)) * cw : cw / 2),
    y: pad.t + ch - (d.value / max) * ch,
  }));

  const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${lineD} L${points[points.length - 1].x},${pad.t + ch} L${points[0].x},${pad.t + ch} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => pad.t + ch * (1 - f));
  const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const idx = Math.round(f * (data.length - 1));
    return data[idx]?.ts ?? 0;
  });

  return (
    <div className="monitor-chart">
      <div className="monitor-chart-header">
        <span className="monitor-chart-label">{label}</span>
        <span className="monitor-chart-value" style={{ color }}>{latest.toFixed(1)}{unit}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="monitor-chart-svg">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {gridLines.map((y, i) => (
          <line key={`g${i}`} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" strokeWidth="0.5" />
        ))}
        {gridLines.map((y, i) => {
          const val = Math.round(max * (1 - i * 0.25));
          return <text key={`v${i}`} x={pad.l - 4} y={y + 3} textAnchor="end" fill="var(--meta)" fontSize="8">{val}</text>;
        })}
        {timeTicks.map((ts, i) => {
          const x = pad.l + (i / 4) * cw;
          return <text key={`t${i}`} x={x} y={h - 4} textAnchor="middle" fill="var(--meta)" fontSize="7">{fmtTime(ts)}</text>;
        })}
        <path d={areaD} fill={`url(#grad-${label})`} />
        <path d={lineD} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2.5" fill={color} />
      </svg>
    </div>
  );
}

export function MonitoringDetailTab({ activeResource }: Props) {
  const rid = activeResource?.id ?? null;
  const cpuSeries = useSeries(rid, (s) => s.cpuUsage);
  const memSeries = useSeries(rid, (s) => (s.memory.used / (s.memory.total || 1)) * 100);
  const netSeries = useSeries(rid, () => 0);

  return (
    <div className="monitor-panel">
      <div className="monitor-chart-row">
        <AreaChart data={cpuSeries} label="CPU" color="var(--accent)" unit="%" max={100} />
        <AreaChart data={memSeries} label="Memory" color="var(--success)" unit="%" max={100} />
      </div>
      <AreaChart data={netSeries} label="Network" color="var(--warn)" unit="" max={100} />
    </div>
  );
}