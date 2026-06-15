import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { WorkspaceEmptyPage } from "../../components/ui/WorkspaceEmptyPage";
import { HostListPanel } from "../../components/workspace/HostListPanel";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { usePersistedModuleTab } from "../../hooks/usePersistedModuleTab";
import { useI18n } from "../../i18n";
import { HostDetailPanel } from "./ssh/components/HostDetailPanel";
import { KeysModuleView } from "./ssh/components/KeysModuleView";
import { TunnelsModuleView } from "./ssh/components/TunnelsModuleView";
import { useSshManager } from "./ssh/hooks/useSshManager";
import { useSshHostResources } from "../../stores/connectionStore";

type SshWorkspaceTab = "hosts" | "tunnels" | "keys";
const SSH_WORKSPACE_TABS: SshWorkspaceTab[] = ["hosts", "tunnels", "keys"];

export function SshPanel() {
  const { t } = useI18n();
  const location = useLocation();
  const isActiveRoute = location.pathname === "/ssh";
  const [workspaceTab, setWorkspaceTab] = usePersistedModuleTab("ssh-workspace", "hosts", SSH_WORKSPACE_TABS);
  const sshResources = useSshHostResources();
  const ctx = useSshManager();

  const topbarTabs = useMemo(
    () => [
      { id: "hosts", label: t("ssh.tabs.hosts"), active: workspaceTab === "hosts" },
      { id: "tunnels", label: t("ssh.tabs.tunnels"), active: workspaceTab === "tunnels" },
      { id: "keys", label: t("ssh.tabs.keys"), active: workspaceTab === "keys" },
    ],
    [workspaceTab, t],
  );

  useTopbarTabs(
    topbarTabs,
    {
      onSelect: (id) => setWorkspaceTab(id as SshWorkspaceTab),
    },
    { mode: "segment", enabled: isActiveRoute },
  );

  if (workspaceTab === "tunnels") {
    return <TunnelsModuleView sshResources={ctx.sshResources} />;
  }

  if (workspaceTab === "keys") {
    return <KeysModuleView />;
  }

  return (
    <SidebarWorkspace preset="host" sidebar={<HostListPanel resources={sshResources} />}>
      {ctx.activeResource ? (
        <HostDetailPanel {...ctx} />
      ) : (
        <WorkspaceEmptyPage prompt={t("ssh.empty.selectHost")} />
      )}
    </SidebarWorkspace>
  );
}
