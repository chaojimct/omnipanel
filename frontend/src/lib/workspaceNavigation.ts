import type { NavigateFunction } from "react-router-dom";
import { useBottomPanelStore } from "../stores/bottomPanelStore";
import { DEFAULT_WORKSPACE, useWorkspaceStore } from "../stores/workspaceStore";
import { DASHBOARD_PATH, WORKSPACE_PATHS } from "./paths";

/** 进入看板首页（/dashboard） */
export function goWorkspaceHome(): void {
  useWorkspaceStore.getState().switchWorkspace(DEFAULT_WORKSPACE.id);
  useBottomPanelStore.getState().leaveFullscreenForFeature();
  window.dispatchEvent(
    new CustomEvent("omnipanel-navigate", {
      detail: { path: DASHBOARD_PATH },
    }),
  );
}

/** 切换到指定工程工作区（URL 驱动，退出全屏但不进入工程全屏） */
export function navigateToWorkspace(id: string): void {
  useWorkspaceStore.getState().switchWorkspace(id);
  useBottomPanelStore.getState().leaveFullscreenForFeature();
  window.dispatchEvent(
    new CustomEvent("omnipanel-navigate", {
      detail: { path: WORKSPACE_PATHS.detail(id) },
    }),
  );
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
