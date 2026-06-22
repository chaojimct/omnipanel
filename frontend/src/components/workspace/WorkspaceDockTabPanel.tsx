import type { WorkspaceDockTab } from "../../stores/workspaceBottomDockStore";
import { WorkspaceMirroredPanel } from "./WorkspaceMirroredPanel";
import { WorkspacePayloadPanel } from "./WorkspacePayloadPanel";

interface WorkspaceDockTabPanelProps {
  tab: WorkspaceDockTab;
  isActive: boolean;
}

/** 单个工作区 Tab 的面板内容（dockview / SubWindow 共用） */
export function WorkspaceDockTabPanel({ tab, isActive }: WorkspaceDockTabPanelProps) {
  if (tab.kind === "payload" && tab.payload) {
    return <WorkspacePayloadPanel tab={tab} isActive={isActive} />;
  }
  return <WorkspaceMirroredPanel tab={tab} isActive={isActive} />;
}
