import type { WorkspaceDockTab } from "../stores/workspaceBottomDockStore";

const BUILTIN_TAB_ID_RE = /^ws-builtin:([^:]+):(board|ai)$/;

export function isWorkspaceBuiltinTabId(tabId: string): boolean {
  return BUILTIN_TAB_ID_RE.test(tabId);
}

/** 旧版内置 Tab（看板 / AI 助手）或 welcome 占位 */
export function isWorkspaceBuiltinTab(tab: WorkspaceDockTab): boolean {
  return tab.kind === "builtin" || isWorkspaceBuiltinTabId(tab.id);
}

/** 移除旧版内置看板 / AI 助手 Tab，仅保留用户添加的面板 */
export function normalizeWorkspaceTabs(tabs: WorkspaceDockTab[] | undefined): WorkspaceDockTab[] {
  const legacyTabs = (tabs ?? []) as Array<WorkspaceDockTab | { kind: "welcome" }>;
  return legacyTabs.filter(
    (tab) =>
      tab.kind !== "welcome" &&
      tab.kind !== "builtin" &&
      !isWorkspaceBuiltinTabId(tab.id),
  ) as WorkspaceDockTab[];
}

export function defaultWorkspaceActiveTabId(tabs: WorkspaceDockTab[]): string {
  return tabs[0]?.id ?? "";
}
