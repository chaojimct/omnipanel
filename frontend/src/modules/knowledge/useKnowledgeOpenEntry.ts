import { useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { patchDockTabPreviewMeta } from "../../components/dock/dockTabLiveMeta";
import { useKnowledgeStore } from "../../stores/knowledgeStore";
import { useKnowledgeWorkspaceStore } from "../../stores/knowledgeWorkspaceStore";
import { isKnowledgeFolder } from "./knowledgeTree";
import {
  findPreviewDockTab,
  findTabIdForEntry,
  makeKnowledgeTabId,
  tabMatchesEntry,
  type KnowledgeDockOpenMode,
} from "./knowledgeWorkspaceTabs";

/** 知识库文档 Tab 打开/切换（侧栏与工作区共用）。 */
export function useKnowledgeOpenEntry() {
  const entries = useKnowledgeStore((s) => s.entries);
  const setSelectedEntry = useKnowledgeStore((s) => s.setSelectedEntry);

  const workspaceTabs = useKnowledgeWorkspaceStore((s) => s.workspaceTabs);
  const setWorkspaceTabs = useKnowledgeWorkspaceStore((s) => s.setWorkspaceTabs);
  const setActiveTabId = useKnowledgeWorkspaceStore((s) => s.setActiveTabId);

  const workspaceTabsRef = useRef(workspaceTabs);
  workspaceTabsRef.current = workspaceTabs;

  const activateWorkspaceTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      const tab = workspaceTabsRef.current.find((item) => item.id === tabId);
      if (tab) {
        setSelectedEntry(tab.entryId);
      }
    },
    [setActiveTabId, setSelectedEntry],
  );

  const promotePreviewTab = useCallback(
    (tabId: string) => {
      flushSync(() => {
        setWorkspaceTabs((prev) =>
          prev.map((tab) => (tab.id === tabId ? { ...tab, preview: undefined } : tab)),
        );
      });
      patchDockTabPreviewMeta(tabId, false);
    },
    [setWorkspaceTabs],
  );

  const replacePreviewDockTab = useCallback(
    (previewTabId: string, entryId: string, label: string) => {
      patchDockTabPreviewMeta(previewTabId, true);
      setWorkspaceTabs((prev) =>
        prev.map((tab) =>
          tab.id === previewTabId
            ? { id: previewTabId, entryId, label, preview: true }
            : tab,
        ),
      );
      activateWorkspaceTab(previewTabId);
      return previewTabId;
    },
    [activateWorkspaceTab, setWorkspaceTabs],
  );

  const openEntry = useCallback(
    (entryId: string, mode: KnowledgeDockOpenMode = "preview") => {
      const entry = entries.find((item) => item.id === entryId);
      if (!entry || isKnowledgeFolder(entry)) {
        return;
      }

      setSelectedEntry(entryId);
      const moduleTabs = workspaceTabsRef.current;
      const existingTabId = findTabIdForEntry(moduleTabs, entryId);
      if (existingTabId) {
        activateWorkspaceTab(existingTabId);
        if (mode === "permanent") {
          const tab = moduleTabs.find((item) => item.id === existingTabId);
          if (tab?.preview) {
            promotePreviewTab(existingTabId);
          }
        }
        return;
      }

      const previewTab = findPreviewDockTab(moduleTabs);

      if (mode === "permanent") {
        if (previewTab && tabMatchesEntry(previewTab, entryId)) {
          promotePreviewTab(previewTab.id);
          activateWorkspaceTab(previewTab.id);
          return;
        }

        const tabId = makeKnowledgeTabId();
        setWorkspaceTabs((prev) => [...prev, { id: tabId, entryId, label: entry.title }]);
        activateWorkspaceTab(tabId);
        return;
      }

      if (previewTab && tabMatchesEntry(previewTab, entryId)) {
        activateWorkspaceTab(previewTab.id);
        return;
      }

      if (previewTab) {
        replacePreviewDockTab(previewTab.id, entryId, entry.title);
        return;
      }

      const tabId = makeKnowledgeTabId();
      patchDockTabPreviewMeta(tabId, true);
      setWorkspaceTabs((prev) => [
        ...prev,
        { id: tabId, entryId, label: entry.title, preview: true },
      ]);
      activateWorkspaceTab(tabId);
    },
    [
      activateWorkspaceTab,
      entries,
      promotePreviewTab,
      replacePreviewDockTab,
      setSelectedEntry,
      setWorkspaceTabs,
    ],
  );

  return {
    openEntry,
    activateWorkspaceTab,
    promotePreviewTab,
    workspaceTabs,
  };
}
