import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Terminal } from "@xterm/xterm";

export interface TerminalPane {
  id: string;
  backendSessionId: string | null;
  title: string;
  type: "local" | "remote";
  resourceId: string;
  shellLabel: string;
  cwd: string;
  purpose: string;
  commandPack: string[];
  terminal: Terminal | null;
  status: "connecting" | "connected" | "disconnected";
}

export type PaneLayout =
  | { type: "leaf"; paneId: string }
  | { type: "split"; direction: "horizontal" | "vertical"; children: PaneLayout[]; sizes?: number[] };

export interface TerminalTab {
  id: string;
  title: string;
  panes: TerminalPane[];
  activePaneId: string;
  layout: PaneLayout;
}

interface CreateTabOptions {
  title?: string;
}

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string | null;

  addTab: (pane: Omit<TerminalPane, "terminal" | "status" | "backendSessionId">, options?: CreateTabOptions) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setActivePane: (tabId: string, paneId: string) => void;
  replaceTabLayout: (tabId: string, panes: TerminalPane[], layout: PaneLayout, activePaneId: string) => void;
  updateTabLayout: (tabId: string, layout: PaneLayout) => void;
  setTerminal: (paneId: string, terminal: Terminal) => void;
  setStatus: (paneId: string, status: TerminalPane["status"]) => void;
  setBackendSessionId: (paneId: string, backendSessionId: string) => void;
}

function updatePaneInTabs(
  tabs: TerminalTab[],
  paneId: string,
  updater: (pane: TerminalPane) => TerminalPane
): TerminalTab[] {
  return tabs.map((tab) => ({
    ...tab,
    panes: tab.panes.map((pane) => (pane.id === paneId ? updater(pane) : pane)),
  }));
}

export const useTerminalStore = create<TerminalState>((set) => ({
  tabs: [],
  activeTabId: null,

  addTab: (pane, options) =>
    set((state) => {
      const rootPane: TerminalPane = {
        ...pane,
        terminal: null,
        status: "connecting",
        backendSessionId: null,
      };
      const newTab: TerminalTab = {
        id: pane.id,
        title: options?.title ?? pane.title,
        panes: [rootPane],
        activePaneId: rootPane.id,
        layout: { type: "leaf", paneId: rootPane.id },
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: state.activeTabId ?? newTab.id,
      };
    }),

  removeTab: (tabId) =>
    set((state) => {
      const remaining = state.tabs.filter((tab) => tab.id !== tabId);
      const nextActiveTabId =
        state.activeTabId === tabId
          ? remaining.length > 0
            ? remaining[Math.max(remaining.length - 1, 0)].id
            : null
          : state.activeTabId;
      return { tabs: remaining, activeTabId: nextActiveTabId };
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  setActivePane: (tabId, paneId) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, activePaneId: paneId } : tab)),
    })),

  replaceTabLayout: (tabId, panes, layout, activePaneId) =>
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              panes,
              layout,
              activePaneId,
            }
          : tab
      ),
    })),

  updateTabLayout: (tabId, layout) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, layout } : tab)),
    })),

  setTerminal: (paneId, terminal) =>
    set((state) => ({
      tabs: updatePaneInTabs(state.tabs, paneId, (pane) => ({ ...pane, terminal })),
    })),

  setStatus: (paneId, status) =>
    set((state) => ({
      tabs: updatePaneInTabs(state.tabs, paneId, (pane) => ({ ...pane, status })),
    })),

  setBackendSessionId: (paneId, backendSessionId) =>
    set((state) => ({
      tabs: updatePaneInTabs(state.tabs, paneId, (pane) => ({ ...pane, backendSessionId })),
    })),
}));

export function getBackendSessionId(paneId: string): string {
  for (const tab of useTerminalStore.getState().tabs) {
    const pane = tab.panes.find((item) => item.id === paneId);
    if (pane) {
      return pane.backendSessionId ?? pane.id;
    }
  }
  return paneId;
}
