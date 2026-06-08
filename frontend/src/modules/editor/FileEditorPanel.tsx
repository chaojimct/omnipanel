import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../../i18n";
import Editor from "@monaco-editor/react";

interface FileContent {
  path: string;
  content: string;
  language: string;
  size: number;
  modified: string | null;
}

interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  modified: boolean;
}

const STYLE = {
  panel: { display: "flex", flexDirection: "column" as const, height: "100%", background: "var(--bg, #1a1a2e)" },
  tabBar: {
    display: "flex", alignItems: "center", background: "var(--bg-secondary, #16162a)",
    borderBottom: "1px solid var(--border, #333)", height: 36, overflow: "hidden" as const,
  },
  tab: (active: boolean) => ({
    display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: "100%",
    background: active ? "var(--bg, #1a1a2e)" : "transparent",
    borderBottom: active ? "2px solid var(--accent, #7c5cfc)" : "2px solid transparent",
    color: active ? "var(--text, #e0e0e0)" : "var(--text-dim, #888)",
    cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" as const, userSelect: "none" as const,
    borderRight: "1px solid var(--border, #333)",
  }),
  dot: { width: 6, height: 6, borderRadius: "50%", background: "var(--accent, #7c5cfc)" },
  closeBtn: {
    background: "none", border: "none", color: "inherit", cursor: "pointer",
    fontSize: 14, padding: "0 2px", lineHeight: 1, opacity: 0.6,
  },
  toolbar: {
    display: "flex", alignItems: "center", gap: 8, padding: "4px 12px",
    background: "var(--bg-secondary, #16162a)", borderBottom: "1px solid var(--border, #333)",
    fontSize: 12, color: "var(--text-dim, #888)",
  },
  btn: {
    padding: "3px 10px", background: "var(--bg-tertiary, #222)", border: "1px solid var(--border, #444)",
    color: "var(--text, #e0e0e0)", borderRadius: 4, cursor: "pointer", fontSize: 11,
  },
  empty: {
    flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center",
    justifyContent: "center", color: "var(--text-dim, #666)", gap: 12,
  },
};

export function FileEditorPanel() {
  const { t } = useI18n();
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const openFile = useCallback(async (path: string) => {
    // Check if already open
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    try {
      const fc = await invoke<FileContent>("editor_open_file", { path });
      const name = path.split(/[/\\]/).pop() || path;
      const id = `editor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newTab: EditorTab = {
        id, path, name, content: fc.content, originalContent: fc.content,
        language: fc.language, modified: false,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(id);
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  }, [tabs]);

  const saveFile = useCallback(async () => {
    if (!activeTab) return;
    try {
      await invoke("editor_save_file", { path: activeTab.path, content: activeTab.content });
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, originalContent: t.content, modified: false }
            : t
        )
      );
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }, [activeTab, activeTabId]);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        if (next.length === 0) setActiveTabId(null);
        else setActiveTabId(next[Math.min(idx, next.length - 1)].id);
      }
      return next;
    });
  }, [activeTabId]);

  const handleContentChange = useCallback((value: string | undefined) => {
    if (!activeTabId || value === undefined) return;
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, content: value, modified: value !== t.originalContent }
          : t
      )
    );
  }, [activeTabId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (activeTabId) closeTab(activeTabId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveFile, closeTab, activeTabId]);

  // Hidden file input for native file picker
  const handleFilePick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      // @ts-ignore - webkitRelativePath or path from Tauri
      const path = file.webkitRelativePath || (file as any).path || file.name;
      await openFile(path);
    }
    e.target.value = "";
  }, [openFile]);

  return (
    <div style={STYLE.panel}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {/* Tab bar */}
      <div style={STYLE.tabBar}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={STYLE.tab(tab.id === activeTabId)}
            onClick={() => setActiveTabId(tab.id)}
            title={tab.path}
          >
            {tab.modified && <span style={STYLE.dot} />}
            <span>{tab.name}</span>
            <button
              style={STYLE.closeBtn}
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              title="Close"
            >
              ×
            </button>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button style={STYLE.btn} onClick={handleFilePick} title="Open file">
          📂 Open
        </button>
      </div>

      {/* Toolbar */}
      {activeTab && (
        <div style={STYLE.toolbar}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
            {activeTab.path}
          </span>
          <span>{activeTab.language}</span>
          {activeTab.modified && (
            <span style={{ color: "var(--accent, #7c5cfc)" }}>● Modified</span>
          )}
          <button style={STYLE.btn} onClick={saveFile}>💾 Save</button>
          <button style={STYLE.btn} onClick={() => activeTabId && closeTab(activeTabId)}>
            ✕ Close
          </button>
        </div>
      )}

      {/* Editor area */}
      {activeTab ? (
        <Editor
          height="100%"
          language={activeTab.language}
          value={activeTab.content}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            lineNumbers: "on",
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
          }}
        />
      ) : (
        <div style={STYLE.empty}>
          <span style={{ fontSize: 48 }}>📝</span>
          <span>Open a file to start editing</span>
          <button style={{ ...STYLE.btn, padding: "8px 24px", fontSize: 13 }} onClick={handleFilePick}>
            📂 Open File
          </button>
        </div>
      )}
    </div>
  );
}
