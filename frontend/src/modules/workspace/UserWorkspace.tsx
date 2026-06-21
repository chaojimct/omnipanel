import { useEffect, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { WorkspaceSwitcher } from "../../components/shell/WorkspaceSwitcher";
import { WorkspaceEmptyPage } from "../../components/ui/WorkspaceEmptyPage";
import { WorkspaceDockCore } from "../../components/workspace/WorkspaceDockCore";
import { useBottomPanelStore } from "../../stores/bottomPanelStore";
import { useI18n } from "../../i18n";
import { isWorkspacePath } from "../../lib/paths";
import { useWorkspaceStore } from "../../stores/workspaceStore";

function userWorkspaceDockScope(workspaceId: string): string {
  return `workspace-user-${workspaceId}`;
}

/**
 * 用户工作区页面：/workspace/:workspaceId
 * 使用 dockview 展示当前工作区下已添加的面板（数据来自 workspaceBottomDockStore）。
 */
export function UserWorkspace() {
  const { t } = useI18n();
  const location = useLocation();
  const params = useParams<{ workspaceId: string }>();
  const switchWorkspace = useWorkspaceStore((state) => state.switchWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isBottomFullscreen = useBottomPanelStore((state) => state.isFullscreen);
  const isActiveRoute = isWorkspacePath(location.pathname);

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === params.workspaceId) ?? null,
    [workspaces, params.workspaceId],
  );

  useEffect(() => {
    const id = params.workspaceId;
    if (id) switchWorkspace(id);
  }, [params.workspaceId, switchWorkspace]);

  const preActions = useMemo(() => <WorkspaceSwitcher placement="below" />, []);

  if (!workspace) {
    return (
      <WorkspaceEmptyPage
        title={t("workspace.detail.notFoundTitle")}
        prompt={t("workspace.detail.notFoundPrompt")}
        className="user-workspace-overview"
      />
    );
  }

  if (!isActiveRoute || isBottomFullscreen) {
    return null;
  }

  return (
    <div className="user-workspace user-workspace-module-dock">
      <WorkspaceDockCore
        workspace={workspace}
        dockScope={userWorkspaceDockScope(workspace.id)}
        className="user-workspace-dock workspace-panel workspace-panel-dock module-root-dock"
        preActions={preActions}
        windowControl
        windowChromeVariant="default"
        emptyContent={
          <WorkspaceEmptyPage
            title={workspace.name}
            prompt={t("workspace.detail.emptyPanelsHint")}
            className="user-workspace-overview"
          />
        }
      />
    </div>
  );
}
