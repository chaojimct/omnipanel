import type { NavigateFunction } from "react-router-dom";
import { defaultWorkspaceBuiltinActiveTabId } from "./workspaceBuiltinPanels";
import { useBottomPanelStore } from "../stores/bottomPanelStore";
import { DEFAULT_WORKSPACE, useWorkspaceStore } from "../stores/workspaceStore";
import { useWorkspaceBottomDockStore } from "../stores/workspaceBottomDockStore";
import { WORKSPACE_PATHS } from "./paths";
import { workspaceAddDebug } from "./workspaceAddDebug";

/** 进入默认工作区看板（主内容区路由，非底部全屏） */
export function goWorkspaceHome(): void {
  const workspaceId = DEFAULT_WORKSPACE.id;
  useWorkspaceStore.getState().switchWorkspace(workspaceId);
  useWorkspaceBottomDockStore.getState().ensureWorkspaceData(workspaceId, DEFAULT_WORKSPACE);
  useWorkspaceBottomDockStore
    .getState()
    .setActiveTabId(workspaceId, defaultWorkspaceBuiltinActiveTabId(workspaceId));
  useBottomPanelStore.getState().leaveFullscreenForFeature();
  window.dispatchEvent(
    new CustomEvent("omnipanel-navigate", {
      detail: { path: WORKSPACE_PATHS.dashboard(workspaceId) },
    }),
  );
}

/** 切换到指定工程工作区（URL 驱动，退出全屏但不进入工程全屏） */
export function navigateToWorkspace(id: string): void {
  workspaceAddDebug("navigateToWorkspace", {
    id,
    pathnameBefore: typeof window !== "undefined" ? window.location.pathname : null,
    currentWorkspaceId: useWorkspaceStore.getState().workspace.id,
  });
  useWorkspaceStore.getState().switchWorkspace(id);
  useBottomPanelStore.getState().leaveFullscreenForFeature();
  window.dispatchEvent(
    new CustomEvent("omnipanel-navigate", {
      detail: { path: WORKSPACE_PATHS.dashboard(id) },
    }),
  );
  workspaceAddDebug("navigateToWorkspace:dispatched", {
    path: WORKSPACE_PATHS.dashboard(id),
  });
}

/** 从全屏工作区离开并恢复上次记住的非全屏嵌入形态 */
export function leaveWorkspaceHomeForFeature(): void {
  useBottomPanelStore.getState().leaveFullscreenForFeature();
}

/** 侧边栏 / 命令面板：导航到功能模块，全屏时按记忆状态恢复底部工作区 */
export function navigateToFeature(path: string, navigate: NavigateFunction): void {
  const bottom = useBottomPanelStore.getState();
  if (bottom.isFullscreen) {
    bottom.leaveFullscreenForFeature();
  }
  useWorkspaceStore.getState().setActivePath(path);
  navigate(path);
}
