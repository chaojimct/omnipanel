import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  useTerminalStore,
  type TerminalTab,
} from "../../stores/terminalStore";
import { disposeTabBackendSessions } from "../../hooks/useTerminal";
import { clearPaneBackendPending } from "../../hooks/useTerminal";
import {
  resolveResourceById,
} from "../../stores/connectionStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useI18n } from "../../i18n";
import { LOCAL_TERMINAL_RESOURCE_ID } from "./paneResource";
import { TerminalTabDockPane } from "./TerminalTabDockPane";
import { clearTerminalPaneSender } from "./terminalPaneSenders";
import { DockableWorkspace } from "../../components/dock";
import { useTerminalDockLayoutStore } from "../../stores/terminalDockLayoutStore";
import { useWorkspaceBottomDockStore } from "../../stores/workspaceBottomDockStore";

function tabLabel(tab: TerminalTab, fallbackName?: string) {
  const resource = resolveResourceById(tab.session.resourceId);
  return resource?.name ?? tab.title ?? fallbackName ?? tab.session.resourceId;
}

export function TerminalPanel() {
  const { t } = useI18n();
  const location = useLocation();
  const isActiveRoute = location.pathname === "/terminal";
  const tabs = useTerminalStore((state) => state.tabs);
  const activeTabId = useTerminalStore((state) => state.activeTabId);
  const removeTab = useTerminalStore((state) => state.removeTab);
  const setActiveTab = useTerminalStore((state) => state.setActiveTab);
  const openOrFocusLocalTab = useTerminalStore((state) => state.openOrFocusLocalTab);
  const addLocalTerminalTab = useTerminalStore((state) => state.addLocalTerminalTab);

  const workspaceActiveResourceId = useWorkspaceStore(
    (state) => state.activeResourceId,
  );
  const workspaceActiveResource =
    resolveResourceById(workspaceActiveResourceId) ??
    resolveResourceById(LOCAL_TERMINAL_RESOURCE_ID);
  const selectResource = useWorkspaceStore((state) => state.selectResource);

  const dockLayout = useTerminalDockLayoutStore((s) => s.savedLayout);
  const setDockLayout = useTerminalDockLayoutStore((s) => s.setSavedLayout);
  const isOriginDocked = useWorkspaceBottomDockStore((s) => s.isOriginDocked);

  // 进入模块时若没有任何 Tab，则自动建一个本地终端
  useEffect(() => {
    if (tabs.length === 0) {
      const id = openOrFocusLocalTab(workspaceActiveResource?.name ?? "本地终端");
      setActiveTab(id);
      return;
    }
    if (!activeTabId || !tabs.some((tab) => tab.id === activeTabId)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTabId, openOrFocusLocalTab, setActiveTab, workspaceActiveResource?.name]);

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null,
    [tabs, activeTabId],
  );

  // 同步 workspace 资源选中（仅当面板处于激活路由时）
  useEffect(() => {
    if (!isActiveRoute || !activeTab?.session.resourceId) return;
    if (activeTab.session.resourceId !== workspaceActiveResourceId) {
      selectResource(activeTab.session.resourceId);
    }
  }, [
    activeTab?.session.resourceId,
    isActiveRoute,
    selectResource,
    workspaceActiveResourceId,
  ]);

  const handleCloseTab = useCallback(
    (id: string) => {
      clearTerminalPaneSender(id);
      clearPaneBackendPending(id);
      disposeTabBackendSessions(id);
      removeTab(id);
    },
    [removeTab],
  );

  /** 通过 dockview containerApi.addPanel 创建本地终端面板 */
  const createPanelRequest = useCallback(() => {
    const name = workspaceActiveResource?.name ?? "本地终端";
    const id = addLocalTerminalTab(name);
    setActiveTab(id);
    return { id, title: name };
  }, [addLocalTerminalTab, setActiveTab, workspaceActiveResource?.name]);

  const dockTabs = useMemo(
    () =>
      tabs
        .filter((tab) => !isOriginDocked("terminal", tab.id))
        .map((tab) => ({
          id: tab.id,
          label: tabLabel(tab),
          panelType: "terminal",
          closable: true,
        })),
    [tabs, isOriginDocked],
  );

  const renderDockPanel = useCallback(
    (tabId: string) => (
      <TerminalTabDockPane
        tabId={tabId}
        isActive={tabId === activeTabId}
        onActivate={() => setActiveTab(tabId)}
      />
    ),
    [activeTabId, setActiveTab],
  );

  return (
    <DockableWorkspace
      className="term-dock-workspace"
      dockScope="terminal"
      tabs={dockTabs}
      activeTabId={activeTabId ?? ""}
      onActiveTabChange={setActiveTab}
      onCloseTab={handleCloseTab}
      createPanelRequest={createPanelRequest}
      savedLayout={dockLayout}
      onSavedLayoutChange={setDockLayout}
      renderPanel={renderDockPanel}
      emptyContent={t("terminal.newSession.local")}
    />
  );
}
