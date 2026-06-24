import type { ModuleKey } from "./paths";
import { buildModuleRouteSnapshot } from "./workspaceModuleRoutes";
import type { WorkspaceInfo } from "../stores/workspaceStore";
import { useWorkspaceStore } from "../stores/workspaceStore";
import type {
  WorkspaceTabSnapshot,
  TerminalTabSnapshot,
  DbTabSnapshot,
  DockerTabSnapshot,
} from "../stores/workspaceTabStore";
import {
  useWorkspaceBottomDockStore,
  type WorkspaceDockTab,
} from "../stores/workspaceBottomDockStore";
import { useBottomPanelStore } from "../stores/bottomPanelStore";
import { resolveResourceById } from "../stores/connectionStore";
import {
  useTerminalStore,
  createTerminalTabId,
  type TerminalTab,
} from "../stores/terminalStore";
import { disposeTabBackendSessions } from "../hooks/useTerminal";
import { clearPaneBackendPending } from "../hooks/useTerminal";
import { clearTerminalPaneSender } from "../modules/terminal/terminalPaneSenders";
import type { DbWorkspaceTab } from "../modules/database/workspaceTabs";
import {
  buildComponentSnapshot,
  type ComponentSnapshot,
} from "./workspaceComponentTypes";
import { getWorkspaceComponentDefinition } from "./workspaceComponentTypes";
import { workspaceComponentRegistry } from "./workspaceComponentRegistry";
import { syncWorkspaceDockActiveTabSideEffects } from "./syncWorkspaceDockActiveTab";

// --- Snapshot factories ---

export function terminalTabToSnapshot(tab: TerminalTab): TerminalTabSnapshot {
  const resource = resolveResourceById(tab.session.resourceId);
  return {
    module: "terminal",
    id: tab.id,
    label: resource?.name ?? tab.title ?? tab.session.shellLabel,
    sessionType: tab.session.type,
    resourceId: tab.session.resourceId,
    shellLabel: tab.session.shellLabel,
    cwd: tab.session.cwd,
    purpose: tab.session.purpose,
  };
}

/** Ctrl+点击 / 添加入工作区：复制终端会话为独立 Tab（新 id、新后端连接） */
export function copyTerminalTabToWorkspaceSnapshot(
  source: TerminalTab,
): TerminalTabSnapshot {
  const resource = resolveResourceById(source.session.resourceId);
  return {
    module: "terminal",
    id: createTerminalTabId(),
    label: resource?.name ?? source.title ?? source.session.shellLabel,
    sessionType: source.session.type,
    resourceId: source.session.resourceId,
    shellLabel: source.session.shellLabel,
    cwd: source.session.cwd,
    purpose: source.session.purpose,
  };
}

/** 移动终端会话到工作区（保持原 id 和连接，但会从原面板隐藏） */
export function moveTerminalTabToWorkspaceSnapshot(
  source: TerminalTab,
): TerminalTabSnapshot {
  const resource = resolveResourceById(source.session.resourceId);
  return {
    module: "terminal",
    id: source.id,
    label: resource?.name ?? source.title ?? source.session.shellLabel,
    sessionType: source.session.type,
    resourceId: source.session.resourceId,
    shellLabel: source.session.shellLabel,
    cwd: source.session.cwd,
    purpose: source.session.purpose,
  };
}

export function dbTabToSnapshot(
  tab: DbWorkspaceTab,
  tabMode?: "data" | "sql",
): DbTabSnapshot {
  return {
    module: "database",
    id: tab.id,
    label: tab.label,
    tab,
    tabMode,
  };
}

export function dockerTabToSnapshot(
  subTab: "logs" | "terminal",
  connectionId: string,
  containerId: string,
  containerName: string,
): DockerTabSnapshot {
  return {
    module: "docker",
    id: `docker:${subTab}:${containerId}:${Date.now()}`,
    label: `${containerName} · ${subTab === "logs" ? "日志" : "终端"}`,
    subTab,
    connectionId,
    containerId,
    containerName,
  };
}

/** 工作区 Dock 中 payload 面板的稳定 id */
export function payloadDockTabId(snapshot: WorkspaceTabSnapshot): string {
  if (snapshot.module === "route") {
    return `ws-payload:${snapshot.id}`;
  }
  if (snapshot.module === "component") {
    return `ws-payload:component:${snapshot.id}`;
  }
  return `ws-payload:${snapshot.module}:${snapshot.id}`;
}

/** 展开底部工作区并激活指定 Dock Tab（不跳转路由） */
function activateWorkspaceDockTab(workspaceId: string, tab: WorkspaceDockTab): void {
  const bottom = useBottomPanelStore.getState();
  if (!bottom.isFullscreen && bottom.workspaceMode === "hidden") {
    bottom.requestExpand();
  }

  const applyActivation = () => {
    const dockStore = useWorkspaceBottomDockStore.getState();
    dockStore.setActiveTabId(workspaceId, tab.id);
    syncWorkspaceDockActiveTabSideEffects(tab);
    window.dispatchEvent(
      new CustomEvent("omnipanel-workspace-dock-activate", {
        detail: { workspaceId, tabId: tab.id },
      }),
    );
  };

  const needsExpand = !bottom.isFullscreen && bottom.workspaceMode === "hidden";
  // 展开动画 / 挂载完成后再激活，避免 Dock 未挂载时丢失 focus
  if (needsExpand) {
    requestAnimationFrame(() => requestAnimationFrame(applyActivation));
  } else {
    queueMicrotask(applyActivation);
  }
}

function resolveActiveTerminalTab(): TerminalTab | undefined {
  const store = useTerminalStore.getState();
  const moduleTabs = store.tabs.filter((tab) => !tab.workspaceOnly);
  if (store.activeTabId) {
    const active = moduleTabs.find((tab) => tab.id === store.activeTabId);
    if (active) return active;
  }
  return moduleTabs[0];
}

/** 确保终端 store 中存在快照对应的 Tab，供工作区 payload 渲染 */
export function ensureTerminalTabFromSnapshot(snapshot: TerminalTabSnapshot): string {
  const store = useTerminalStore.getState();
  const existing = store.tabs.find((tab) => tab.id === snapshot.id);
  if (existing) return existing.id;
  store.addTab({
    id: snapshot.id,
    title: snapshot.label,
    workspaceOnly: true,
    session: {
      type: snapshot.sessionType,
      resourceId: snapshot.resourceId,
      shellLabel: snapshot.shellLabel,
      cwd: snapshot.cwd,
      purpose: snapshot.purpose,
      commandPack: [],
    },
  });
  return snapshot.id;
}

/** 关闭工作区 Dock 中的终端 payload 时释放独立会话 */
export function cleanupWorkspaceDockTab(tab: WorkspaceDockTab | undefined): void {
  if (!tab || tab.kind !== "payload" || !tab.payload) return;
  if (tab.payload.module === "database") {
    const dbTabId = tab.payload.id;
    // We cannot call DatabasePanel directly, but we can update the store to close it.
    // Actually, closeWorkspaceTab is in DatabasePanel.
    // Let's dispatch an event to DatabasePanel to close it globally
    window.dispatchEvent(new CustomEvent("omnipanel:close-db-workspace-tab", { detail: dbTabId }));
    return;
  }

  if (!tab) return;
  if (tab.kind !== "payload" || tab.payload?.module !== "terminal") return;
  const terminalId = tab.payload.id;
  const terminalTab = useTerminalStore.getState().tabs.find((item) => item.id === terminalId);
  if (!terminalTab?.workspaceOnly) return;
  clearTerminalPaneSender(terminalId);
  clearPaneBackendPending(terminalId);
  disposeTabBackendSessions(terminalId);
  useTerminalStore.getState().removeTab(terminalId);
}

function resolveWorkspaceInfo(workspaceId: string): WorkspaceInfo | null {
  return (
    useWorkspaceStore.getState().workspaces.find((ws) => ws.id === workspaceId) ?? null
  );
}

/**
 * 统一入口：将来源快照物化为工程工作区 Dock Tab。
 *
 * 注意：这里不再写 workspaceTabStore。workspaceTabStore 只保留给终端/数据库
 * 模块自身在「切换工作区」时恢复模块内 Tab，避免 Dock Tab 和模块 Tab 状态串台。
 */
export function addSnapshotToWorkspace(
  workspaceId: string,
  snapshot: WorkspaceTabSnapshot,
  options?: { activate?: boolean },
): void {
  const workspace = resolveWorkspaceInfo(workspaceId);
  if (!workspace) {
    return;
  }

  const dockStore = useWorkspaceBottomDockStore.getState();
  dockStore.ensureWorkspaceData(workspaceId, workspace);

  const payloadId = payloadDockTabId(snapshot);
  const addedTab = dockStore.addPayloadTab(workspaceId, workspace, {
    id: payloadId,
    label: snapshot.label,
    payload: snapshot,
    originScope:
      snapshot.module === "database" || snapshot.module === "terminal" || snapshot.module === "docker"
        ? snapshot.module
        : undefined,
    originPanelId:
      snapshot.module === "database" || snapshot.module === "terminal" || snapshot.module === "docker"
        ? snapshot.id
        : undefined,
    panelType:
      snapshot.module === "route"
        ? snapshot.moduleKey
        : snapshot.module === "component"
          ? snapshot.componentType
          : snapshot.module,
  });

  if (options?.activate === false) {
    return;
  }

  activateWorkspaceDockTab(workspaceId, addedTab);
}

/** 侧边栏 Ctrl+点击：优先加入当前模块上下文（如终端会话），否则加入模块路由面板 */
export function addModulePanelToWorkspace(
  workspaceId: string,
  moduleKey: ModuleKey,
  label: string,
  options?: { segmentTabId?: string; activate?: boolean },
): void {
  if (moduleKey === "terminal") {
    const activeTab = resolveActiveTerminalTab();
    if (activeTab) {
      addSnapshotToWorkspace(
        workspaceId,
        copyTerminalTabToWorkspaceSnapshot(activeTab),
        options,
      );
      return;
    }
  }

  addModuleRouteToWorkspace(workspaceId, moduleKey, label, options);
}

/** 将模块路由面板加入工作区（侧边栏 Ctrl+点击、模块内 Ctrl+复制）— 情况 1：顶级路由面板 */
export function addModuleRouteToWorkspace(
  workspaceId: string,
  moduleKey: ModuleKey,
  label: string,
  options?: { segmentTabId?: string; activate?: boolean },
): void {
  addSnapshotToWorkspace(
    workspaceId,
    buildModuleRouteSnapshot(moduleKey, label, {
      segmentTabId: options?.segmentTabId,
    }),
    { activate: options?.activate },
  );
}

/** 将可序列化组件/子面板加入工作区 — 情况 2 & 3：componentType + props */
export function addComponentToWorkspace(
  workspaceId: string,
  input: {
    componentType: string;
    label: string;
    props?: Record<string, unknown>;
    snapshotId?: string;
  },
  options?: { activate?: boolean },
): void {
  const def = getWorkspaceComponentDefinition(workspaceComponentRegistry, input.componentType);
  if (!def) {
    return;
  }
  const snapshot: ComponentSnapshot = buildComponentSnapshot({
    componentType: input.componentType,
    label: input.label || def.defaultLabel || input.componentType,
    props: input.props,
    snapshotId: input.snapshotId,
  });
  addSnapshotToWorkspace(workspaceId, snapshot, options);
}

/** 工程工作区已有数据库面板时，将表数据 Tab 同步到底部 Dock 并激活 */
export function syncDatabaseTableTabToWorkspace(
  tab: DbWorkspaceTab,
  tabMode: "data" | "sql" = "data",
): void {
  const workspaceId = useWorkspaceStore.getState().workspace.id;
  const dockTabs = useWorkspaceBottomDockStore.getState().tabsByWorkspace[workspaceId] ?? [];
  const hasDatabaseDockPanel = dockTabs.some(
    (item) =>
      (item.kind === "payload" && item.payload?.module === "database") ||
      (item.kind === "mirrored" && item.originScope === "database"),
  );
  if (!hasDatabaseDockPanel) {
    return;
  }
  addSnapshotToWorkspace(workspaceId, dbTabToSnapshot(tab, tabMode), { activate: true });
}
