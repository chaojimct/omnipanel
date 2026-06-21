import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { DockableWorkspace } from "../dock";
import { subscribeDockviewTransfer } from "../../lib/dockviewRegistry";
import type { WorkspaceInfo } from "../../stores/workspaceStore";
import {
  resolveWorkspaceActiveTabId,
  resolveWorkspaceDockPanelType,
  resolveWorkspaceTabs,
  buildDefaultWorkspaceLayout,
  useWorkspaceBottomDockStore,
} from "../../stores/workspaceBottomDockStore";
import { isWorkspaceBuiltinTab, isWorkspaceBuiltinTabId } from "../../lib/workspaceBuiltinPanels";
import { useI18n } from "../../i18n";
import { isLayoutUsable, collectPanelIds, mergePanelsIntoLayout } from "../dock/dockViewLayout";
import { getDbWorkspaceMirrorContext } from "../../stores/dbWorkspaceMirrorStore";
import { WorkspaceMirroredPanel } from "./WorkspaceMirroredPanel";
import { WorkspacePayloadPanel } from "./WorkspacePayloadPanel";
import { WorkspaceBuiltinPanel } from "./WorkspaceBuiltinPanel";
import { workspaceAddDebug } from "../../lib/workspaceAddDebug";

export interface WorkspaceDockCoreProps {
  workspace: WorkspaceInfo;
  dockScope: string;
  className?: string;
  preActions?: ReactNode;
  acceptExternalDrops?: boolean;
  tabStyle?: "topbar" | "segment";
  windowControl?: boolean;
  windowChromeVariant?: "segment" | "default";
  emptyContent?: ReactNode;
}

/**
 * 工作区 dockview 核心：读取持久化的 tabs/layout，渲染镜像与快照面板。
 */
export function WorkspaceDockCore({
  workspace,
  dockScope,
  className = "workspace-panel workspace-panel-dock",
  preActions,
  acceptExternalDrops = true,
  tabStyle = "topbar",
  windowControl = false,
  windowChromeVariant = "default",
  emptyContent = <div className="dashboard dashboard-home" />,
}: WorkspaceDockCoreProps) {
  const { t } = useI18n();
  const workspaceId = workspace.id;

  const rawTabs = useWorkspaceBottomDockStore(
    (state) => state.tabsByWorkspace[workspaceId],
  );
  const savedLayout = useWorkspaceBottomDockStore(
    (state) => state.layoutByWorkspace[workspaceId] ?? null,
  );
  const rawActiveTabId = useWorkspaceBottomDockStore(
    (state) => state.activeTabByWorkspace[workspaceId],
  );
  const ensureWorkspaceData = useWorkspaceBottomDockStore(
    (state) => state.ensureWorkspaceData,
  );
  const setLayout = useWorkspaceBottomDockStore((state) => state.setLayout);
  const setActiveTabId = useWorkspaceBottomDockStore((state) => state.setActiveTabId);
  const addMirroredTab = useWorkspaceBottomDockStore((state) => state.addMirroredTab);
  const removeTab = useWorkspaceBottomDockStore((state) => state.removeTab);

  useEffect(() => {
    ensureWorkspaceData(workspaceId, workspace);
  }, [ensureWorkspaceData, workspaceId, workspace.name, workspace.description]);

  const tabs = useMemo(
    () => resolveWorkspaceTabs(workspace, rawTabs),
    [workspace, rawTabs],
  );

  useEffect(() => {
    workspaceAddDebug("WorkspaceDockCore:tabs", {
      workspaceId,
      dockScope,
      tabIds: tabs.map((t) => t.id),
      activeTabId: rawActiveTabId ?? null,
    });
  }, [workspaceId, dockScope, tabs, rawActiveTabId]);

  const activeTabId = useMemo(
    () => resolveWorkspaceActiveTabId(workspace, tabs, rawActiveTabId),
    [workspace, tabs, rawActiveTabId],
  );

  const dockTabs = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        label:
          tab.kind === "builtin" && tab.builtin
            ? t(`workspace.builtinTabs.${tab.builtin}`)
            : tab.label,
        closable: tab.closable !== false && !isWorkspaceBuiltinTab(tab),
        panelType: resolveWorkspaceDockPanelType(tab),
      })),
    [tabs, t],
  );

  const effectiveSavedLayout = tabs.length > 0 ? savedLayout : null;
  const dockRemountKey = `${workspaceId}:${dockScope}:${dockTabs.map((tab) => tab.id).join("|")}`;

  useEffect(() => {
    if (tabs.length === 0) return;
    const tabIds = tabs.map((tab) => tab.id);
    if (savedLayout && isLayoutUsable(savedLayout)) {
      const panelIds = collectPanelIds(savedLayout);
      if (tabs.every((tab) => panelIds.has(tab.id))) return;
      const merged = mergePanelsIntoLayout(savedLayout, tabIds, activeTabId);
      if (merged) {
        setLayout(workspaceId, merged);
      }
      return;
    }
    const nextLayout = buildDefaultWorkspaceLayout(workspace, tabs, activeTabId);
    setLayout(workspaceId, nextLayout);
  }, [activeTabId, savedLayout, setLayout, tabs, workspace, workspaceId]);

  useEffect(() => {
    return subscribeDockviewTransfer((meta) => {
      if (!meta.newPanelId.startsWith(`${dockScope}:`)) return;
      addMirroredTab(workspaceId, workspace, {
        id: meta.newPanelId,
        label:
          typeof meta.params?.label === "string" && meta.params.label
            ? meta.params.label
            : meta.title,
        originScope: meta.originScope,
        originPanelId: meta.originPanelId,
      });
    });
  }, [addMirroredTab, dockScope, workspaceId, workspace]);

  const renderPanel = useCallback(
    (tabId: string) => {
      const tab = tabs.find((item) => item.id === tabId);
      if (!tab) return null;
      if (tab.kind === "builtin" && tab.builtin) {
        return <WorkspaceBuiltinPanel kind={tab.builtin} />;
      }
      if (tab.kind === "payload" && tab.payload) {
        return <WorkspacePayloadPanel tab={tab} isActive={tabId === activeTabId} />;
      }
      return <WorkspaceMirroredPanel tab={tab} isActive={tabId === activeTabId} />;
    },
    [tabs, activeTabId],
  );

  const panelContentKey = useMemo(
    () => `${activeTabId}|${tabs.map((tab) => tab.id).join(",")}`,
    [activeTabId, tabs],
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      if (isWorkspaceBuiltinTabId(tabId)) return;
      removeTab(workspaceId, workspace, tabId);
    },
    [removeTab, workspace, workspaceId],
  );

  const handlePanelTransferredOut = useCallback(
    (panelId: string) => {
      removeTab(workspaceId, workspace, panelId);
    },
    [removeTab, workspace, workspaceId],
  );

  const handleActiveTabChange = useCallback(
    (tabId: string) => {
      setActiveTabId(workspaceId, tabId);
      const tab = tabs.find((item) => item.id === tabId);
      if (
        tab?.kind === "mirrored" &&
        tab.originScope === "database" &&
        tab.originPanelId
      ) {
        getDbWorkspaceMirrorContext()?.setActiveTabId(tab.originPanelId);
      }
      if (tab?.kind === "payload" && tab.payload?.module === "database") {
        getDbWorkspaceMirrorContext()?.setActiveTabId(tab.payload.id);
      }
    },
    [setActiveTabId, tabs, workspaceId],
  );

  return (
    <DockableWorkspace
      key={dockRemountKey}
      className={className}
      dockScope={dockScope}
      acceptExternalDrops={acceptExternalDrops}
      tabs={dockTabs}
      activeTabId={activeTabId}
      onActiveTabChange={handleActiveTabChange}
      onCloseTab={handleCloseTab}
      onPanelTransferredOut={handlePanelTransferredOut}
      savedLayout={effectiveSavedLayout}
      onSavedLayoutChange={(layout) => setLayout(workspaceId, layout)}
      renderPanel={renderPanel}
      panelContentKey={panelContentKey}
      tabStyle={tabStyle}
      preActions={preActions}
      windowControl={windowControl}
      windowChromeVariant={windowChromeVariant}
      enableTabGroups={false}
      emptyContent={emptyContent}
    />
  );
}
