import { useCallback, useMemo } from "react";
import { WorkspaceSwitcher } from "../shell/WorkspaceSwitcher";
import { useI18n } from "../../i18n";
import type { WorkspaceInfo } from "../../stores/workspaceStore";
import { useBottomPanelStore, useEmbeddedWorkspaceMode } from "../../stores/bottomPanelStore";
import {
  resolveWorkspaceActiveTabId,
  resolveWorkspaceTabs,
  useWorkspaceBottomDockStore,
} from "../../stores/workspaceBottomDockStore";
import { WorkspaceDockCore } from "./WorkspaceDockCore";
import { WorkspaceThumbnailStrip } from "./WorkspaceThumbnailStrip";
import { WorkspaceTaskbarStrip } from "./WorkspaceTaskbarStrip";
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
  const workspaceId = workspace.id;
  const dockScope = workspaceDockScope(workspaceId);
  const workspaceMode = useBottomPanelStore((state) => state.workspaceMode);
  const isEngineeringFullscreen = workspaceMode === "fullscreen";
  const embeddedMode = useEmbeddedWorkspaceMode();
  const handleWorkspaceChromeIcon = useBottomPanelStore(
    (state) => state.handleWorkspaceChromeIcon,
  );
  const enterWorkspaceFullscreen = useBottomPanelStore(
    (state) => state.enterWorkspaceFullscreen,
  );

  const rawTabs = useWorkspaceBottomDockStore(
    (state) => state.tabsByWorkspace[workspaceId],
  );
  const rawActiveTabId = useWorkspaceBottomDockStore(
    (state) => state.activeTabByWorkspace[workspaceId],
  );
  const setActiveTabId = useWorkspaceBottomDockStore((state) => state.setActiveTabId);

  const tabs = useMemo(
    () => resolveWorkspaceTabs(workspace, rawTabs),
    [workspace, rawTabs],
  );

  const activeTabId = useMemo(
    () => resolveWorkspaceActiveTabId(workspace, tabs, rawActiveTabId),
    [workspace, tabs, rawActiveTabId],
  );

  const handleActiveTabChange = useCallback(
    (tabId: string) => {
      setActiveTabId(workspaceId, tabId);
    },
    [setActiveTabId, workspaceId],
  );

  const enterFullscreenFromChrome = useCallback(() => {
    handleWorkspaceChromeIcon();
  }, [handleWorkspaceChromeIcon]);

  const handleTopbarDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (isEngineeringFullscreen) return;
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
      enterWorkspaceFullscreen();
    },
    [enterWorkspaceFullscreen, isEngineeringFullscreen],
  );

  const preActions = useMemo(
    () => <WorkspaceSwitcher placement="below" />,
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

  if (embeddedMode === "thumbnail") {
    return (
      <div className="workspace-panel-frame workspace-panel--thumbnail">
        <WorkspaceThumbnailStrip
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleActiveTabChange}
        />
      </div>
    );
  }

  if (embeddedMode === "taskbar") {
    return (
      <div className="workspace-panel-frame workspace-panel--taskbar">
        <div className="workspace-taskbar-bar">
          <WorkspaceTaskbarStrip
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={handleActiveTabChange}
          />
          {fullscreenButton}
        </div>
      </div>
    );
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
      {fullscreenButton}
      <WorkspaceDockCore
        workspace={workspace}
        dockScope={dockScope}
        preActions={preActions}
        windowControl={isEngineeringFullscreen}
      />
    </div>
  );
}
