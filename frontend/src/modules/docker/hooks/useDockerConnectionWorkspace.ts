import { useCallback, useEffect, useMemo } from "react";
import type { DockerConnectionInfo } from "../../../ipc/bindings";
import { useActiveResourceSelection } from "../../../hooks/useActiveResourceSelection";
import { migrateLayoutStorage } from "../../../lib/layoutMigration";
import type { DockerConnectionDockOpenMode } from "../dockerConnectionWorkspaceTabs";

const ACTIVE_CONNECTION_STORAGE_KEY = "omnipanel.docker.activeConnectionId";

export function useDockerConnectionWorkspace(connections: DockerConnectionInfo[]) {
  useEffect(() => {
    migrateLayoutStorage("docker", ["omnipanel.dockerDockLayout.v1"]);
  }, []);

  const resources = useMemo(
    () => connections.map((c) => ({ id: c.connectionId })),
    [connections],
  );

  const { activeId: activeConnectionId, setActiveId: setActiveConnectionId } =
    useActiveResourceSelection({
      storageKey: ACTIVE_CONNECTION_STORAGE_KEY,
      resources,
      defaultId: connections[0]?.connectionId ?? null,
    });

  const handleSelectConnection = useCallback(
    (connectionId: string, _mode?: DockerConnectionDockOpenMode) => {
      if (connections.some((item) => item.connectionId === connectionId)) {
        setActiveConnectionId(connectionId);
      }
      return connectionId;
    },
    [connections, setActiveConnectionId],
  );

  return {
    activeConnectionId,
    handleSelectConnection,
  };
}
