import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SerializedDockview } from "dockview-core";
import type { KnowledgeWorkspaceTab } from "../modules/knowledge/knowledgeWorkspaceTabs";

interface KnowledgeWorkspaceStore {
  workspaceTabs: KnowledgeWorkspaceTab[];
  activeTabId: string | null;
  dockLayout: SerializedDockview | null;

  setWorkspaceTabs: (
    tabs:
      | KnowledgeWorkspaceTab[]
      | ((prev: KnowledgeWorkspaceTab[]) => KnowledgeWorkspaceTab[]),
  ) => void;
  setActiveTabId: (tabId: string | null) => void;
  setDockLayout: (layout: SerializedDockview | null) => void;
  removeTab: (tabId: string) => void;
}

export const useKnowledgeWorkspaceStore = create<KnowledgeWorkspaceStore>()(
  persist(
    (set) => ({
      workspaceTabs: [],
      activeTabId: null,
      dockLayout: null,

      setWorkspaceTabs: (tabs) =>
        set((state) => ({
          workspaceTabs: typeof tabs === "function" ? tabs(state.workspaceTabs) : tabs,
        })),

      setActiveTabId: (tabId) => set({ activeTabId: tabId }),

      setDockLayout: (layout) => set({ dockLayout: layout }),

      removeTab: (tabId) =>
        set((state) => {
          const nextTabs = state.workspaceTabs.filter((tab) => tab.id !== tabId);
          const nextActive =
            state.activeTabId === tabId
              ? nextTabs[nextTabs.length - 1]?.id ?? null
              : state.activeTabId;
          return { workspaceTabs: nextTabs, activeTabId: nextActive };
        }),
    }),
    {
      name: "omnipanel-knowledge-workspace",
      partialize: (state) => ({
        workspaceTabs: state.workspaceTabs.filter((tab) => !tab.preview),
        activeTabId: state.activeTabId,
        dockLayout: state.dockLayout,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (
          state.activeTabId &&
          !state.workspaceTabs.some((tab) => tab.id === state.activeTabId)
        ) {
          state.activeTabId = state.workspaceTabs.at(-1)?.id ?? null;
        }
      },
    },
  ),
);
