import { GAUGE_CIRCUMFERENCE, gaugeOffset } from "./monitoringUtils";

type Props = {
  percent: number;
  display?: string;
  color?: string;
  accentVar?: string;
};

export function MonGauge({ percent, display, color, accentVar = "var(--card-accent)" }: Props) {
  const pctColor = color ?? accentVar;
  const label = display ?? `${Math.round(percent)}%`;

  return (
    <div className="mon-gauge">
      <svg viewBox="0 0 56 56" aria-hidden>
        <circle className="mon-gauge-track" cx="28" cy="28" r="24" />
        <circle
          className="mon-gauge-fill"
          cx="28"
          cy="28"
          r="24"
          stroke={pctColor}
          strokeDasharray={GAUGE_CIRCUMFERENCE.toFixed(2)}
          strokeDashoffset={gaugeOffset(percent).toFixed(2)}
        />
      </svg>
      <span className="mon-gauge-val" style={{ color: pctColor }}>
        {label}
      </span>
    </div>
  );
}
