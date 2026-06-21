import { useCallback, useEffect, type ReactNode } from "react";
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
import { WorkspacePreviewPanelTile, WorkspacePreviewPanelTileEmpty } from "./WorkspacePreviewPanelTile";

export interface WorkspacePreviewProps {
  children: ReactNode;
  className?: string;
}

/** 底部预览栏固定高度（px）：图标区 + 标签 + 工作区标题 */
export const WORKSPACE_PREVIEW_HEIGHT_PX = 180;

/**
 * 工作区预览布局骨架（CSS Grid）。
 * 上方主内容区 + 下方固定高度预览区。
 * 每个工作区一行展示最多 15 个面板（图标 + 底部标题）；非内置面板可删除。
 */
export function WorkspacePreview({ children, className }: WorkspacePreviewProps) {
  const isOpen = useWorkspacePreviewCollapseStore((state) => state.isOpen);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentId = useWorkspaceStore((state) => state.workspace.id);
  const switchWorkspace = useWorkspaceStore((state) => state.switchWorkspace);
  const tabsByWorkspace = useWorkspaceBottomDockStore((state) => state.tabsByWorkspace);
  const ensureWorkspaceData = useWorkspaceBottomDockStore(
    (state) => state.ensureWorkspaceData,
  );
  const removeTab = useWorkspaceBottomDockStore((state) => state.removeTab);

  const handleRemovePanel = useCallback(
    (workspaceId: string, tabId: string) => {
      const ws = workspaces.find((item) => item.id === workspaceId);
      if (!ws) return;
      removeTab(workspaceId, ws, tabId);
    },
    [removeTab, workspaces],
  );

  useEffect(() => {
    for (const ws of workspaces) {
      ensureWorkspaceData(ws.id, ws);
    }
  }, [workspaces, ensureWorkspaceData]);

  return (
    <div
      className={`workspace-preview${isOpen ? "" : " workspace-preview--collapsed"}${className ? ` ${className}` : ""}`}
      style={
        {
          ["--workspace-preview-height" as string]: `${WORKSPACE_PREVIEW_HEIGHT_PX}px`,
          ["--workspace-preview-columns" as string]: MAX_WORKSPACE_PANELS,
        } as React.CSSProperties
      }
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
            const slots = Array.from({ length: MAX_WORKSPACE_PANELS }, (_, index) =>
              tabs[index] ?? null,
            );
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
                <div className="workspace-preview__panels" role="list">
                  {slots.map((tab, index) =>
                    tab ? (
                      <WorkspacePreviewPanelTile
                        key={tab.id}
                        tab={tab}
                        workspaceId={ws.id}
                        onRemove={handleRemovePanel}
                      />
                    ) : (
                      <WorkspacePreviewPanelTileEmpty key={`${ws.id}-empty-${index}`} />
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
