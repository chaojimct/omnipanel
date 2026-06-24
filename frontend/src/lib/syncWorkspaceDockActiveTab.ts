import { getDbWorkspaceMirrorContext } from "../stores/dbWorkspaceMirrorStore";
import type { WorkspaceDockTab } from "../stores/workspaceBottomDockStore";

/** 切换工作区 Tab 时同步来源模块侧状态（如数据库镜像 Tab） */
export function syncWorkspaceDockActiveTabSideEffects(tab: WorkspaceDockTab | undefined): void {
  if (!tab) return;
  if (tab.kind === "mirrored" && tab.originScope === "database" && tab.originPanelId) {
    getDbWorkspaceMirrorContext()?.setActiveTabId(tab.originPanelId);
  }
}
