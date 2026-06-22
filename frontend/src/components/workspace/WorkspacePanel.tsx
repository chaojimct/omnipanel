import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { WorkspaceSwitcher } from "../shell/WorkspaceSwitcher";
import { useI18n } from "../../i18n";
import type { WorkspaceInfo } from "../../stores/workspaceStore";
import { useBottomPanelStore, useEmbeddedWorkspaceMode } from "../../stores/bottomPanelStore";
import { toggleEngineeringWorkspaceFullscreen } from "../../lib/workspaceNavigation";
import {
  resolveWorkspaceTabs,
  useWorkspaceBottomDockStore,
} from "../../stores/workspaceBottomDockStore";
import { WorkspaceDockCore } from "./WorkspaceDockCore";
import { WorkspaceFullscreenDragHandle } from "./WorkspaceFullscreenDragHandle";

interface WorkspacePanelProps {
  workspace: WorkspaceInfo;
}

function workspaceDockScope(workspaceId: string): string {
  return `workspace-bottom-${workspaceId}`;
}

/**
 * 工程工作区 dockview：顶栏集成工作区切换 + Tab + 分屏，支持镜像拖入与快照物化。
 */
export function WorkspacePanel({ workspace }: WorkspacePanelProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const workspaceId = workspace.id;
  const dockScope = workspaceDockScope(workspaceId);
  const workspaceMode = useBottomPanelStore((state) => state.workspaceMode);
  const isEngineeringFullscreen = workspaceMode === "fullscreen";
  const embeddedMode = useEmbeddedWorkspaceMode();
  const isSplitWindow = embeddedMode === "half";
  const showWorkspaceFullscreenChrome =
    isEngineeringFullscreen || !isSplitWindow;

  const rawTabs = useWorkspaceBottomDockStore(
    (state) => state.tabsByWorkspace[workspaceId],
  );

  const tabs = useMemo(
    () => resolveWorkspaceTabs(workspace, rawTabs),
    [workspace, rawTabs],
  );

  const enterFullscreenFromChrome = useCallback(() => {
    toggleEngineeringWorkspaceFullscreen(navigate);
  }, [navigate]);

  const handleTopbarDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isSplitWindow || isEngineeringFullscreen) return;
      const target = event.target as HTMLElement;
      const inHeader = target.closest(
        ".workspace-panel-empty-topbar, .dv-tabs-and-actions-container",
      );
      if (!inHeader) return;
      if (
        target.closest(
          ".workspace-switcher, .workspace-panel-fullscreen-btn, .dv-tab, .dv-default-tab, button, [role='button'], .drag-ignore",
        )
      ) {
        return;
      }
      toggleEngineeringWorkspaceFullscreen(navigate);
    },
    [isEngineeringFullscreen, isSplitWindow, navigate],
  );

  const preActions = useMemo(
    () => <WorkspaceSwitcher placement="below" context="embedded" />,
    [],
  );

  const fullscreenButton = (
    <button
      type="button"
      className="workspace-panel-fullscreen-btn drag-ignore"
      title={
        isEngineeringFullscreen
          ? t("shell.workspacePanel.exitFullscreen")
          : t("shell.workspacePanel.fullscreen")
      }
      aria-label={
        isEngineeringFullscreen
          ? t("shell.workspacePanel.exitFullscreen")
          : t("shell.workspacePanel.fullscreen")
      }
      onClick={enterFullscreenFromChrome}
    >
      {isEngineeringFullscreen ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14" aria-hidden>
          <path d="M4 14h6v6M14 4h6v6M14 20v-6h6M4 10V4h6" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14" aria-hidden>
          <path d="M8 3H5a2 2 0 00-2 2v3" />
          <path d="M16 3h3a2 2 0 012 2v3" />
          <path d="M8 21H5a2 2 0 01-2-2v-3" />
          <path d="M16 21h3a2 2 0 002-2v-3" />
        </svg>
      )}
    </button>
  );

  if (embeddedMode === "taskbar") {
    // task-bar UI 由 WorkspacePreviewTaskBar 渲染；此处仅占位避免重复 switcher / 全屏按钮
    return null;
  }

  const frameClassName = [
    "workspace-panel-frame",
    isEngineeringFullscreen ? "workspace-panel-frame--engineering-full" : "",
    tabs.length === 0 ? "workspace-panel--empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={frameClassName}
      onDoubleClickCapture={handleTopbarDoubleClick}
    >
      {isEngineeringFullscreen ? <WorkspaceFullscreenDragHandle /> : null}
      {showWorkspaceFullscreenChrome ? fullscreenButton : null}
      <WorkspaceDockCore
        workspace={workspace}
        dockScope={dockScope}
        preActions={preActions}
        windowControl={isEngineeringFullscreen}
      />
    </div>
  );
}
