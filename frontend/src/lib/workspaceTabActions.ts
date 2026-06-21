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
import { useWorkspaceBottomDockStore } from "../stores/workspaceBottomDockStore";
import { WORKSPACE_PATHS } from "./paths";
import { navigateToWorkspace } from "./workspaceNavigation";
import { useTerminalStore } from "../stores/terminalStore";
import type { TerminalTab } from "../stores/terminalStore";
import type { DbWorkspaceTab } from "../modules/database/workspaceTabs";
import { workspaceAddDebug } from "./workspaceAddDebug";
import {
  buildComponentSnapshot,
  type ComponentSnapshot,
} from "./workspaceComponentTypes";
import { getWorkspaceComponentDefinition } from "./workspaceComponentTypes";
import { workspaceComponentRegistry } from "./workspaceComponentRegistry";

// --- Snapshot factories ---

export function terminalTabToSnapshot(tab: TerminalTab): TerminalTabSnapshot {
  return {
    module: "terminal",
    id: tab.id,
    label: tab.title,
    sessionType: tab.session.type,
    resourceId: tab.session.resourceId,
    shellLabel: tab.session.shellLabel,
    cwd: tab.session.cwd,
    purpose: tab.session.purpose,
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
    id: `docker:${subTab}:${containerId}`,
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

function isViewingWorkspaceDetail(workspaceId: string): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname === WORKSPACE_PATHS.dashboard(workspaceId);
}

/** 确保终端 store 中存在快照对应的 Tab，供工作区 payload 渲染 */
export function ensureTerminalTabFromSnapshot(snapshot: TerminalTabSnapshot): string {
  const store = useTerminalStore.getState();
  const existing = store.tabs.find((tab) => tab.id === snapshot.id);
  if (existing) return existing.id;
  store.addTab({
    id: snapshot.id,
    title: snapshot.label,
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

function resolveWorkspaceInfo(workspaceId: string): WorkspaceInfo | null {
  return (
    useWorkspaceStore.getState().workspaces.find((ws) => ws.id === workspaceId) ?? null
  );
}

/**
 * 统一入口：将来源快照物化为工程工作区 Dock Tab。
 *
 * 注意：这里不写 workspaceTabStore。workspaceTabStore 只保留给终端/数据库
 * 模块自身在“切换工作区”时恢复模块内 Tab，避免 Dock Tab 和模块 Tab 状态串台。
 */
export function addSnapshotToWorkspace(
  workspaceId: string,
  snapshot: WorkspaceTabSnapshot,
  options?: { activate?: boolean },
): void {
  workspaceAddDebug("addSnapshotToWorkspace:enter", {
    workspaceId,
    snapshotModule: snapshot.module,
    snapshotId: snapshot.id,
    snapshotLabel: snapshot.label,
    pathname: typeof window !== "undefined" ? window.location.pathname : null,
    options,
  });

  const workspace = resolveWorkspaceInfo(workspaceId);
  if (!workspace) {
    workspaceAddDebug("addSnapshotToWorkspace:abort", {
      reason: "workspace_not_found",
      workspaceId,
      knownWorkspaces: useWorkspaceStore.getState().workspaces.map((ws) => ws.id),
    });
    return;
  }

  const dockStore = useWorkspaceBottomDockStore.getState();
  const tabsBefore = dockStore.tabsByWorkspace[workspaceId]?.map((t) => t.id) ?? [];
  dockStore.ensureWorkspaceData(workspaceId, workspace);
  const tabsAfterEnsure = useWorkspaceBottomDockStore.getState().tabsByWorkspace[workspaceId]?.map((t) => t.id) ?? [];
  if (tabsAfterEnsure.join("|") !== tabsBefore.join("|")) {
    workspaceAddDebug("addSnapshotToWorkspace:ensureWorkspaceData_changed_tabs", {
      tabsBefore,
      tabsAfterEnsure,
    });
  }

  const payloadId = payloadDockTabId(snapshot);
  dockStore.addPayloadTab(workspaceId, workspace, {
    id: payloadId,
    label: snapshot.label,
    payload: snapshot,
    panelType:
      snapshot.module === "route"
        ? snapshot.moduleKey
        : snapshot.module === "component"
          ? snapshot.componentType
          : snapshot.module,
  });

  const after = useWorkspaceBottomDockStore.getState();
  const tabsAfter = after.tabsByWorkspace[workspaceId]?.map((t) => t.id) ?? [];
  const activeTab = after.activeTabByWorkspace[workspaceId] ?? null;
  workspaceAddDebug("addSnapshotToWorkspace:after_addPayloadTab", {
    payloadId,
    tabsAfter,
    activeTab,
    tabAdded: tabsAfter.includes(payloadId),
  });

  if (options?.activate === false) {
    workspaceAddDebug("addSnapshotToWorkspace:skip_navigate", { reason: "activate_false" });
    return;
  }

  const onWorkspaceDetail = isViewingWorkspaceDetail(workspaceId);
  if (onWorkspaceDetail) {
    workspaceAddDebug("addSnapshotToWorkspace:skip_navigate", {
      reason: "already_on_workspace_detail",
      pathname: window.location.pathname,
    });
    return;
  }

  workspaceAddDebug("addSnapshotToWorkspace:navigate", { workspaceId });
  navigateToWorkspace(workspaceId);
}

/** 将模块路由面板加入工作区（侧边栏 Ctrl+点击、模块内 Ctrl+复制）— 情况 1：顶级路由面板 */
export function addModuleRouteToWorkspace(
  workspaceId: string,
  moduleKey: ModuleKey,
  label: string,
  options?: { segmentTabId?: string; activate?: boolean },
): void {
  workspaceAddDebug("addModuleRouteToWorkspace:enter", {
    workspaceId,
    moduleKey,
    label,
    segmentTabId: options?.segmentTabId,
  });
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
    workspaceAddDebug("addComponentToWorkspace:abort", {
      reason: "unknown_component_type",
      componentType: input.componentType,
    });
    return;
  }
  const snapshot: ComponentSnapshot = buildComponentSnapshot({
    componentType: input.componentType,
    label: input.label || def.defaultLabel || input.componentType,
    props: input.props,
    snapshotId: input.snapshotId,
  });
  workspaceAddDebug("addComponentToWorkspace:enter", {
    workspaceId,
    componentType: input.componentType,
    snapshotId: snapshot.id,
  });
  addSnapshotToWorkspace(workspaceId, snapshot, options);
}
