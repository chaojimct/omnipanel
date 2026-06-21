import type { WorkspaceDockTab } from "../stores/workspaceBottomDockStore";

export type WorkspaceBuiltinPanelKind = "board" | "ai";

const BUILTIN_TAB_ID_RE = /^ws-builtin:([^:]+):(board|ai)$/;

export function workspaceBuiltinTabId(
  workspaceId: string,
  kind: WorkspaceBuiltinPanelKind,
): string {
  return `ws-builtin:${workspaceId}:${kind}`;
}

export function isWorkspaceBuiltinTabId(tabId: string): boolean {
  return BUILTIN_TAB_ID_RE.test(tabId);
}

export function parseWorkspaceBuiltinTabId(
  tabId: string,
): WorkspaceBuiltinPanelKind | null {
  const match = BUILTIN_TAB_ID_RE.exec(tabId);
  return match ? (match[2] as WorkspaceBuiltinPanelKind) : null;
}

export function isWorkspaceBuiltinTab(tab: WorkspaceDockTab): boolean {
  return tab.kind === "builtin" || isWorkspaceBuiltinTabId(tab.id);
}

export function createWorkspaceBuiltinTab(
  workspaceId: string,
  kind: WorkspaceBuiltinPanelKind,
): WorkspaceDockTab {
  const labels: Record<WorkspaceBuiltinPanelKind, string> = {
    board: "看板",
    ai: "AI 助手",
  };
  return {
    id: workspaceBuiltinTabId(workspaceId, kind),
    label: labels[kind],
    kind: "builtin",
    panelType: kind,
    builtin: kind,
    closable: false,
  };
}

/** 保证每个工作区前两位为不可关闭的内置看板 / AI 助手面板 */
export function mergeWorkspaceBuiltinTabs(
  workspaceId: string,
  tabs: WorkspaceDockTab[],
): WorkspaceDockTab[] {
  const custom = tabs.filter((tab) => !isWorkspaceBuiltinTabId(tab.id));
  const builtins: WorkspaceBuiltinPanelKind[] = ["board", "ai"];
  const mergedBuiltins = builtins.map((kind) => {
    const existing = tabs.find((tab) => tab.id === workspaceBuiltinTabId(workspaceId, kind));
    if (existing) {
      return {
        ...existing,
        kind: "builtin" as const,
        builtin: kind,
        panelType: kind,
        closable: false,
      };
    }
    return createWorkspaceBuiltinTab(workspaceId, kind);
  });
  return [...mergedBuiltins, ...custom];
}

export function defaultWorkspaceBuiltinActiveTabId(workspaceId: string): string {
  return workspaceBuiltinTabId(workspaceId, "board");
}
