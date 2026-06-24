import type { ReactNode } from "react";
import type { SerializedDockview } from "dockview-core";
import { useDbWorkspaceActiveTab } from "../../contexts/DbWorkspaceContext";
import { DockableWorkspace, type DockableTab } from "../../components/dock";

export interface DatabaseWorkspaceDockProps {
  workspaceInitialized: boolean;
  dockTabs: DockableTab[];
  onCloseTab: (tabId: string) => void;
  dockLayout: SerializedDockview | null;
  onDockLayoutChange: (layout: SerializedDockview | null) => void;
  renderDockPanel: (tabId: string) => ReactNode;
  softRefreshKey?: string;
  panelContentKeysByTab?: Record<string, string>;
  onTabContextMenu: (event: React.MouseEvent, tabId: string, index: number) => void;
  onCtrlCopyTab: (tabId: string) => void;
  recentClosedActionItems: Array<{ id: string; label: string; meta: string; onClick: () => void }>;
  emptyPrompt: string;
  recentClosedTitle: string;
}

interface DatabaseWorkspaceEmptyProps {
  prompt: string;
  recentClosedTitle: string;
  recentClosedActionItems: Array<{ id: string; label: string; meta: string; onClick: () => void }>;
}

function DatabaseWorkspaceEmpty({
  prompt,
  recentClosedTitle,
  recentClosedActionItems,
}: DatabaseWorkspaceEmptyProps) {
  return (
    <div className="db-workspace-empty">
      <div className="db-workspace-empty__card">
        <div className="db-workspace-empty__icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <ellipse cx="12" cy="5" rx="7" ry="3" />
            <path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
            <path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
          </svg>
        </div>
        <p className="db-workspace-empty__prompt">{prompt}</p>
        {recentClosedActionItems.length > 0 ? (
          <div className="db-workspace-empty__recent">
            <div className="db-workspace-empty__recent-title">{recentClosedTitle}</div>
            <div className="db-workspace-empty__recent-list">
              {recentClosedActionItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="db-workspace-empty__recent-item"
                  onClick={item.onClick}
                >
                  <span>{item.label}</span>
                  <small>{item.meta}</small>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** 数据库模块右侧 Dock 工作区（表 / SQL / 设计器等 Tab）。 */
export function DatabaseWorkspaceDock({
  workspaceInitialized,
  dockTabs,
  onCloseTab,
  dockLayout,
  onDockLayoutChange,
  renderDockPanel,
  softRefreshKey,
  panelContentKeysByTab,
  onTabContextMenu,
  onCtrlCopyTab,
  recentClosedActionItems,
  emptyPrompt,
  recentClosedTitle,
}: DatabaseWorkspaceDockProps) {
  const { activeTabId, setActiveTabId } = useDbWorkspaceActiveTab();

  if (!workspaceInitialized) {
    return null;
  }

  return (
    <DockableWorkspace
      className="db-workspace"
      dockScope="database"
      defaultHeaderPosition="top"
      enableTabGroups={false}
      tabs={dockTabs}
      activeTabId={activeTabId}
      onActiveTabChange={setActiveTabId}
      onCloseTab={onCloseTab}
      savedLayout={dockLayout}
      onSavedLayoutChange={onDockLayoutChange}
      renderPanel={renderDockPanel}
      softRefreshKey={softRefreshKey}
      panelContentKeysByTab={panelContentKeysByTab}
      onTabContextMenu={onTabContextMenu}
      onCtrlCopyTab={onCtrlCopyTab}
      windowControl={false}
      emptyContent={
        <DatabaseWorkspaceEmpty
          prompt={emptyPrompt}
          recentClosedTitle={recentClosedTitle}
          recentClosedActionItems={recentClosedActionItems}
        />
      }
    />
  );
}
