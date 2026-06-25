import { useEffect, useRef, useState } from "react";
import type { HostSystemStats } from "@/stores/sshStatsStore";
import { aggregateGpuUtilization, safePercent } from "@/stores/sshStatsStore";

const MAX_POINTS = 24;

function append(values: number[], next: number): number[] {
  return [...values.slice(-(MAX_POINTS - 1)), next];
}

export type MonitorSparklines = {
  cpu: number[];
  mem: number[];
  disk: number[];
  gpu: number[][];
};

const EMPTY: MonitorSparklines = { cpu: [], mem: [], disk: [], gpu: [] };

export function useMonitorSparklines(stats: HostSystemStats | null): MonitorSparklines {
  const [series, setSeries] = useState<MonitorSparklines>(EMPTY);
  const prevTsRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stats?.timestamp) return;
    if (prevTsRef.current === stats.timestamp) return;
    prevTsRef.current = stats.timestamp;

    const cpu = Math.round(stats.cpuUsage ?? stats.cpu?.usage ?? 0);
    const mem = safePercent(stats.memory.used, stats.memory.total);
    const disk = safePercent(stats.disk.used, stats.disk.total);
    const gpuDevices = stats.gpu?.devices ?? [];

    setSeries((prev) => ({
      cpu: append(prev.cpu, cpu),
      mem: append(prev.mem, mem),
      disk: append(prev.disk, disk),
      gpu: gpuDevices.map((d, i) => {
        const util = d.utilization != null ? Math.round(d.utilization) : 0;
        const memPct =
          d.memoryTotal && d.memoryTotal > 0 && d.memoryUsed != null
            ? safePercent(d.memoryUsed, d.memoryTotal)
            : 0;
        const val = util || memPct || aggregateGpuUtilization(stats.gpu) || 0;
        return append(prev.gpu[i] ?? [], val);
      }),
    }));
  }, [stats]);

  useEffect(() => {
    prevTsRef.current = null;
    setSeries(EMPTY);
  }, [stats?.hostId]);

  return series;
}
