import { sparklinePaths } from "./monitoringUtils";

type Props = {
  values: number[];
  height?: number;
  className?: string;
};

export function MonSparkline({ values, height = 28, className = "mon-sparkline" }: Props) {
  const paths = sparklinePaths(values, 200, height);
  if (!paths) {
    return <div className={className} aria-hidden />;
  }

  return (
    <div className={className}>
      <svg viewBox={`0 0 200 ${height}`} preserveAspectRatio="none" aria-hidden>
        <path className="spark-area" d={paths.area} />
        <path className="spark-line" d={paths.line} />
      </svg>
    </div>
  );
}
