import { useWorkspaceStore } from "../../stores/workspaceStore";
import { WorkspacePanel } from "./WorkspacePanel";

/**
 * 工作区容器：按当前工作区挂载 dockview 面板。
 */
export function WorkspaceBottomHost() {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentId = useWorkspaceStore((state) => state.workspace.id);
  const current =
    workspaces.find((ws) => ws.id === currentId) ?? workspaces[0] ?? null;

  return (
    <div className="workspace-bottom-host">
      {current ? <WorkspacePanel workspace={current} /> : null}
    </div>
  );
}
