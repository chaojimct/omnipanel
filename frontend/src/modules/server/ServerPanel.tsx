import { useCallback, useMemo } from "react";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { HostListPanel } from "../../components/workspace/HostListPanel";
import { HostDetailPanel } from "./ssh/components/HostDetailPanel";
import { useSshManager } from "./ssh/hooks/useSshManager";
import { useConnectionStore, useSshHostResources } from "../../stores/connectionStore";
import { useServerViewStore } from "../../stores/serverViewStore";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";
import { WorkspaceEmptyPage } from "../../components/ui/WorkspaceEmptyPage";
import { ServerInstalledApps } from "./panel/ServerInstalledApps";
import { SERVER_VIEW_TABS } from "./panel/constants";
import { connectionToServerEntry } from "./panel/panelConnection";
import { findPanelForSsh } from "./panel/serverConnection";

export function ServerPanel() {
  const { t } = useI18n();
  const connections = useConnectionStore((s) => s.connections);
  const sshResources = useSshHostResources();
  const ctx = useSshManager();
  const viewTab = useServerViewStore((s) => s.viewTab);
  const setViewTab = useServerViewStore((s) => s.setViewTab);

  const activePanelServer = useMemo(() => {
    const sshId = ctx.activeResource?.id;
    if (!sshId) return null;
    const panel = findPanelForSsh(connections, sshId);
    return panel ? connectionToServerEntry(panel) : null;
  }, [connections, ctx.activeResource?.id]);

  const topbarTabs = useMemo(
    () =>
      SERVER_VIEW_TABS.map((tab) => ({
        id: tab,
        label: t(`server.tabs.${tab}`),
        active: viewTab === tab,
      })),
    [viewTab, t],
  );

  useTopbarTabs(topbarTabs, { onSelect: (id) => setViewTab(id as typeof viewTab) }, {
    mode: "segment",
  });

  const panelEmptyHint = useCallback(() => {
    if (!ctx.activeResource) {
      return t("server.empty.selectServer");
    }
    return t("server.empty.noPanelConfig");
  }, [ctx.activeResource, t]);

  return (
    <SidebarWorkspace
      preset="host"
      sidebar={<HostListPanel resources={sshResources} />}
    >
      {viewTab === "panel" ? (
        <div className="server-main">
          {activePanelServer ? (
            <ServerInstalledApps server={activePanelServer} />
          ) : (
              <WorkspaceEmptyPage prompt={panelEmptyHint()} />
          )}
        </div>
      ) : (
        <HostDetailPanel {...ctx} />
      )}
    </SidebarWorkspace>
  );
}
