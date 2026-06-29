import { useMemo } from "react";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { useSshConnectionStore } from "../../../../stores/sshConnectionStore";
import { useSshHostStore } from "../../../../stores/sshHostStore";

export type FleetStats = {
  total: number;
  online: number;
  offline: number;
  warning: number;
  monitoring: number;
  activeSessions: number;
};

export function useSshFleetStats(resources: WorkspaceResource[]): FleetStats {
  const statusMap = useSshConnectionStore((s) => s.statusMap);
  const sessionActiveMap = useSshConnectionStore((s) => s.sessionActiveMap);
  const hostStates = useSshHostStore((s) => s.hosts);

  return useMemo(() => {
    let online = 0;
    let offline = 0;
    let warning = 0;
    let monitoring = 0;
    let activeSessions = 0;

    for (const resource of resources) {
      const poolStatus = statusMap[resource.id]?.status;
      const status = poolStatus ?? resource.status;
      if (status === "online" || status === "connected" || status === "running") {
        online += 1;
      } else if (status === "warning") {
        warning += 1;
        online += 1;
      } else {
        offline += 1;
      }
      if (hostStates[resource.id]?.monitoring.enabled) monitoring += 1;
      if (sessionActiveMap[resource.id]) activeSessions += 1;
    }

    return {
      total: resources.length,
      online,
      offline,
      warning,
      monitoring,
      activeSessions,
    };
  }, [hostStates, resources, sessionActiveMap, statusMap]);
}
