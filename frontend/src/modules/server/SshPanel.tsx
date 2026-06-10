import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { WorkspaceEmptyPage } from "../../components/ui/WorkspaceEmptyPage";
import { HostListPanel } from "../../components/workspace/HostListPanel";
import { HostDetailPanel } from "./ssh/components/HostDetailPanel";
import { useSshManager } from "./ssh/hooks/useSshManager";
import { useSshHostResources } from "../../stores/connectionStore";
import { useI18n } from "../../i18n";

export function SshPanel() {
  const { t } = useI18n();
  const sshResources = useSshHostResources();
  const ctx = useSshManager();

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
