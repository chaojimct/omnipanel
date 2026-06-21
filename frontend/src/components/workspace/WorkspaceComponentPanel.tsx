import { renderWorkspaceComponent } from "../../lib/workspaceComponentRegistry";
import { isComponentSnapshot } from "../../lib/workspaceComponentTypes";
import type { ComponentSnapshot } from "../../lib/workspaceComponentTypes";

interface WorkspaceComponentPanelProps {
  snapshot: ComponentSnapshot;
}

/** 工作区 Dock 内由 component 快照还原的面板 */
export function WorkspaceComponentPanel({ snapshot }: WorkspaceComponentPanelProps) {
  const content = renderWorkspaceComponent(snapshot.componentType, snapshot.props);
  if (!content) {
    return (
      <div className="workspace-component-panel workspace-component-panel--missing">
        <p>未知组件类型：{snapshot.componentType}</p>
      </div>
    );
  }
  return <div className="workspace-component-panel">{content}</div>;
}

export { isComponentSnapshot };
