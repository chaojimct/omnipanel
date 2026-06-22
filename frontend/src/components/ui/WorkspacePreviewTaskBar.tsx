import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { appConfirm } from "../../lib/appConfirm";
import { isWorkspaceBuiltinTab } from "../../lib/workspaceBuiltinPanels";
import { syncWorkspaceDockActiveTabSideEffects } from "../../lib/syncWorkspaceDockActiveTab";
import { PreviewKindIcon } from "./WorkspacePreviewPanelTile";
import {
  resolveWorkspaceActiveTabId,
  resolveWorkspaceTabs,
  useWorkspaceBottomDockStore,
} from "../../stores/workspaceBottomDockStore";
import {
  resolveWorkspaceTabPreview,
  stripWorkspaceTabCopySuffix,
} from "../../lib/workspaceTabPreview";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useI18n } from "../../i18n";
import type { WorkspaceDockTab } from "../../stores/workspaceBottomDockStore";
import { WorkspaceTaskBarPanelSubWindow } from "../workspace/WorkspaceTaskBarPanelSubWindow";

function TaskBarPanelTile({
  tab,
  active,
  onSelect,
  onRemove,
}: {
  tab: WorkspaceDockTab;
  active: boolean;
  onSelect: (tabId: string) => void;
  onRemove: (tabId: string) => void;
}) {
  const { t } = useI18n();
  const preview = resolveWorkspaceTabPreview(tab);
  const displayTitle = stripWorkspaceTabCopySuffix(preview.title);
  const removable = !isWorkspaceBuiltinTab(tab);

  const handleRemove = useCallback(
    async (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      const ok = await appConfirm(
        t("shell.workspacePreview.confirmRemovePanel", { name: displayTitle }),
        t("shell.workspacePreview.confirmRemoveTitle"),
      );
      if (!ok) return;
      onRemove(tab.id);
    },
    [displayTitle, onRemove, t, tab.id],
  );

  return (
    <div className={`workspace-preview-taskbar__tile${active ? " is-active" : ""}`}>
      <div
        className={`workspace-preview-taskbar-tab${active ? " is-active" : ""}${removable ? " workspace-preview-taskbar-tab--removable" : ""}`}
        role="presentation"
      >
        <button
          type="button"
          role="tab"
          aria-selected={active}
          className="workspace-preview-taskbar-tab__main"
          onClick={() => onSelect(tab.id)}
          title={displayTitle}
        >
          <span className="workspace-preview-taskbar-tab__icon" data-kind={preview.kind}>
            <PreviewKindIcon kind={preview.kind} />
          </span>
          <span className="workspace-preview-taskbar-tab__label">{displayTitle}</span>
        </button>
        {removable ? (
          <button
            type="button"
            className="workspace-preview-taskbar-tab__close drag-ignore"
            title={t("shell.workspacePreview.removePanel")}
            aria-label={t("shell.workspacePreview.removePanel")}
            onClick={(event) => void handleRemove(event)}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** task-bar 模式：浏览器式标签页（图标左 + 标题右），可关闭非内置面板 */
export function WorkspacePreviewTaskBar() {
  const { t } = useI18n();
  const workspace = useWorkspaceStore((state) => state.workspace);
  const setActiveTabId = useWorkspaceBottomDockStore((state) => state.setActiveTabId);
  const removeTab = useWorkspaceBottomDockStore((state) => state.removeTab);
  const rawTabs = useWorkspaceBottomDockStore(
    (state) => state.tabsByWorkspace[workspace.id],
  );
  const rawActiveTabId = useWorkspaceBottomDockStore(
    (state) => state.activeTabByWorkspace[workspace.id],
  );
  const ensureWorkspaceData = useWorkspaceBottomDockStore(
    (state) => state.ensureWorkspaceData,
  );
  const [subWindowTabId, setSubWindowTabId] = useState<string | null>(null);

  useEffect(() => {
    ensureWorkspaceData(workspace.id, workspace);
  }, [ensureWorkspaceData, workspace]);

  useEffect(() => {
    setSubWindowTabId(null);
  }, [workspace.id]);

  const tabs = useMemo(
    () => resolveWorkspaceTabs(workspace, rawTabs),
    [workspace, rawTabs],
  );

  const activeTabId = useMemo(
    () => resolveWorkspaceActiveTabId(workspace, tabs, rawActiveTabId),
    [workspace, tabs, rawActiveTabId],
  );

  const subWindowTab = useMemo(
    () => tabs.find((tab) => tab.id === subWindowTabId) ?? null,
    [subWindowTabId, tabs],
  );

  useEffect(() => {
    if (subWindowTabId && !tabs.some((tab) => tab.id === subWindowTabId)) {
      setSubWindowTabId(null);
    }
  }, [subWindowTabId, tabs]);

  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTabId(workspace.id, tabId);
      syncWorkspaceDockActiveTabSideEffects(tabs.find((tab) => tab.id === tabId));
      setSubWindowTabId(tabId);
    },
    [setActiveTabId, tabs, workspace.id],
  );

  const handleCloseSubWindow = useCallback(() => {
    setSubWindowTabId(null);
  }, []);

  const handleRemoveTab = useCallback(
    (tabId: string) => {
      if (subWindowTabId === tabId) {
        setSubWindowTabId(null);
      }
      removeTab(workspace.id, workspace, tabId);
    },
    [removeTab, subWindowTabId, workspace],
  );

  return (
    <>
      <div className="workspace-preview-taskbar">
        <div className="workspace-preview-taskbar__panels" role="tablist">
          {tabs.length === 0 ? (
            <p className="workspace-preview-taskbar__empty">{t("shell.workspacePreview.noPanels")}</p>
          ) : (
            tabs.map((tab) => (
              <TaskBarPanelTile
                key={tab.id}
                tab={tab}
                active={tab.id === activeTabId}
                onSelect={handleSelectTab}
                onRemove={handleRemoveTab}
              />
            ))
          )}
        </div>
      </div>
      <WorkspaceTaskBarPanelSubWindow
        tab={subWindowTab}
        open={subWindowTab !== null}
        onClose={handleCloseSubWindow}
      />
    </>
  );
}
