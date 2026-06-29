import { useCallback, useEffect } from "react";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { useActiveResourceSelection } from "../../../../hooks/useActiveResourceSelection";
import { migrateLayoutStorage } from "../../../../lib/layoutMigration";
import type { HostDockOpenMode } from "../workspaceTabs";

const ACTIVE_HOST_STORAGE_KEY = "omnipanel.ssh.activeHostId";

export function useSshHostWorkspace(sshResources: WorkspaceResource[]) {
  useEffect(() => {
    migrateLayoutStorage("ssh", ["omnipanel.sshDockLayout.v1"]);
  }, []);

  const { activeId: activeHostId, setActiveId: setActiveHostId } = useActiveResourceSelection({
    storageKey: ACTIVE_HOST_STORAGE_KEY,
    resources: sshResources,
    defaultId: sshResources[0]?.id ?? null,
  });

  const handleSelectHost = useCallback(
    (hostId: string, _mode?: HostDockOpenMode) => {
      if (sshResources.some((item) => item.id === hostId)) {
        setActiveHostId(hostId);
      }
    },
    [setActiveHostId, sshResources],
  );

  return {
    activeHostId,
    handleSelectHost,
  };
}
