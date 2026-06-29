import { useCallback, useEffect } from "react";
import { useActiveResourceSelection } from "../../../../hooks/useActiveResourceSelection";
import { migrateLayoutStorage } from "../../../../lib/layoutMigration";
import type { ServerEntry } from "../serverConnection";
import type { ServerPanelDockOpenMode } from "../serverPanelWorkspaceTabs";

const ACTIVE_SERVER_STORAGE_KEY = "omnipanel.server.activeServerId";

export function useServerPanelWorkspace(servers: ServerEntry[]) {
  useEffect(() => {
    migrateLayoutStorage("server", ["omnipanel.serverDockLayout.v1"]);
  }, []);

  const { activeId: activeServerId, setActiveId: setActiveServerId } = useActiveResourceSelection({
    storageKey: ACTIVE_SERVER_STORAGE_KEY,
    resources: servers,
    defaultId: servers[0]?.id ?? null,
  });

  const handleSelectServer = useCallback(
    (serverId: string, _mode?: ServerPanelDockOpenMode) => {
      if (servers.some((item) => item.id === serverId)) {
        setActiveServerId(serverId);
      }
      return serverId;
    },
    [servers, setActiveServerId],
  );

  return {
    activeServerId,
    handleSelectServer,
  };
}
