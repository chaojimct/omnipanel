import { useCallback, useEffect, type ReactNode } from "react";
import { useI18n } from "../../i18n";
import { useBottomPanelStore } from "../../stores/bottomPanelStore";
import {
  MAX_WORKSPACE_PANELS,
  resolveWorkspaceTabs,
  useWorkspaceBottomDockStore,
} from "../../stores/workspaceBottomDockStore";
import { useWorkspacePreviewCollapseStore } from "../../stores/workspacePreviewCollapseStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import {
  buildMockWorkspacePreviewPanels,
  WORKSPACE_PREVIEW_USE_MOCK_PANELS,
} from "../../lib/workspacePreviewMockPanels";
import { WorkspacePreviewPanelTile } from "./WorkspacePreviewPanelTile";

export interface WorkspacePreviewProps {
  children: ReactNode;
  className?: string;
}

/** 底部预览栏固定高度（px） */
export const WORKSPACE_PREVIEW_HEIGHT_PX = 180;

/**
 * 工作区预览布局骨架（CSS Grid）。
 * 上方主内容区 + 下方固定高度预览区。
 * 每个工作区一行展示最多 10 个面板（Windows 风格：图标/缩略图 + 底部标题）。
 */
export function WorkspacePreview({ children, className }: WorkspacePreviewProps) {
  const { t } = useI18n();
  const isOpen = useWorkspacePreviewCollapseStore((state) => state.isOpen);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentId = useWorkspaceStore((state) => state.workspace.id);
  const switchWorkspace = useWorkspaceStore((state) => state.switchWorkspace);
  const tabsByWorkspace = useWorkspaceBottomDockStore((state) => state.tabsByWorkspace);
  const activeTabByWorkspace = useWorkspaceBottomDockStore(
    (state) => state.activeTabByWorkspace,
  );
  const ensureWorkspaceData = useWorkspaceBottomDockStore(
    (state) => state.ensureWorkspaceData,
  );
  const setActiveTabId = useWorkspaceBottomDockStore((state) => state.setActiveTabId);
  const enterWorkspaceFullscreen = useBottomPanelStore(
    (state) => state.enterWorkspaceFullscreen,
  );

  useEffect(() => {
    for (const ws of workspaces) {
      ensureWorkspaceData(ws.id, ws);
    }
  }, [workspaces, ensureWorkspaceData]);

  const handlePanelSelect = useCallback(
    (workspaceId: string, tabId: string) => {
      const ws = workspaces.find((item) => item.id === workspaceId);
      if (!ws) return;
      switchWorkspace(workspaceId);
      setActiveTabId(workspaceId, tabId);
      enterWorkspaceFullscreen();
    },
    [workspaces, switchWorkspace, setActiveTabId, enterWorkspaceFullscreen],
  );

  return (
    <div
      className={`workspace-preview${isOpen ? "" : " workspace-preview--collapsed"}${className ? ` ${className}` : ""}`}
    >
      <div className="workspace-preview__main">{children}</div>
      <div className="workspace-preview__sidebar" hidden={!isOpen}>
        <div className="workspace-preview__zones">
          {workspaces.map((ws) => {
            const tabs = WORKSPACE_PREVIEW_USE_MOCK_PANELS
              ? buildMockWorkspacePreviewPanels(ws.id)
              : resolveWorkspaceTabs(ws, tabsByWorkspace[ws.id]).slice(
                  0,
                  MAX_WORKSPACE_PANELS,
                );
            const realActiveTabId = activeTabByWorkspace[ws.id] ?? "";
            const isCurrent = ws.id === currentId;

            return (
              <section
                key={ws.id}
                className={`workspace-preview__zone${isCurrent ? " workspace-preview__zone--current" : ""}`}
                aria-label={ws.name}
              >
                <button
                  type="button"
                  className="workspace-preview__zone-header"
                  onClick={() => switchWorkspace(ws.id)}
                  title={ws.description || ws.name}
                >
                  <span className="workspace-preview__zone-name">{ws.name}</span>
                  <span className="workspace-preview__zone-count">
                    {tabs.length}/{MAX_WORKSPACE_PANELS}
                  </span>
                </button>
                {tabs.length > 0 ? (
                  <div className="workspace-preview__panels" role="list">
                    {tabs.map((tab, index) => (
                      <WorkspacePreviewPanelTile
                        key={tab.id}
                        tab={tab}
                        active={
                          isCurrent &&
                          (WORKSPACE_PREVIEW_USE_MOCK_PANELS
                            ? index === 2
                            : tab.id === realActiveTabId)
                        }
                        onClick={() => {
                          if (WORKSPACE_PREVIEW_USE_MOCK_PANELS) {
                            switchWorkspace(ws.id);
                            return;
                          }
                          handlePanelSelect(ws.id, tab.id);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="workspace-preview__panels-empty">
                    {t("shell.workspacePreview.noPanels")}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
