import { ComposeStackIcon, DockerWhaleIcon, ImageLayersIcon } from "./icons";

export type DockerStatIcon = "running" | "stopped" | "images" | "compose";

export function DockerStatCard({
  color,
  value,
  label,
  icon,
}: {
  color: string;
  value: number;
  label: string;
  icon: DockerStatIcon;
}) {
  const bg = `var(--${color}-soft)`;
  const fg = `var(--${color})`;
  const icons = {
    running: <DockerWhaleIcon />,
    stopped: <DockerWhaleIcon />,
    images: <ImageLayersIcon />,
    compose: <ComposeStackIcon />,
  };
  return (
    <div className="docker-stat">
      <div className="stat-icon" style={{ background: bg, color: fg }}>
        {icons[icon]}
      </div>
      <div className="stat-info">
        <span className="stat-val">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export interface DockerStatsBarProps {
  running: number;
  stopped: number;
  images: number;
  compose: number;
  labels: {
    running: string;
    stopped: string;
    images: string;
    compose: string;
  };
}

export function DockerStatsBar({
  running,
  stopped,
  images,
  compose,
  labels,
}: DockerStatsBarProps) {
  return (
    <div className="docker-stats docker-overview-stats">
      <DockerStatCard color="success" value={running} label={labels.running} icon="running" />
      <DockerStatCard color="muted" value={stopped} label={labels.stopped} icon="stopped" />
      <DockerStatCard color="accent" value={images} label={labels.images} icon="images" />
      <DockerStatCard color="warn" value={compose} label={labels.compose} icon="compose" />
    </div>
  );
}
