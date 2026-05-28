import { useEffect, useCallback, useState } from "react";
import { useTerminalStore } from "../../stores/terminalStore";
import { PaneRenderer } from "../../components/terminal/PaneRenderer";
import { TerminalSearch } from "../../components/terminal/TerminalSearch";
import { BlockContextMenu } from "../../components/terminal/BlockContextMenu";
import type { TerminalBlock } from "../../stores/blocksStore";
import type { SearchAddon } from "@xterm/addon-search";
import type { Terminal } from "@xterm/xterm";

let tabCounter = 0;

export function TerminalPanel() {
  const tabs = useTerminalStore((s) => s.tabs);
  const activeTabId = useTerminalStore((s) => s.activeTabId);
  const layout = useTerminalStore((s) => s.layout);
  const addTab = useTerminalStore((s) => s.addTab);
  const removeTab = useTerminalStore((s) => s.removeTab);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTerminal, setSearchTerminal] = useState<Terminal | null>(null);
  const [searchAddon, setSearchAddon] = useState<SearchAddon | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    block: TerminalBlock;
    position: { x: number; y: number };
  } | null>(null);

  // Initialize with one local terminal tab
  useEffect(() => {
    if (tabs.length === 0) {
      const id = `tab-${tabCounter++}`;
      addTab({ id, title: "local", type: "local" });
      setActiveTab(id);
    }
  }, []);

  const handleAddTab = useCallback(() => {
    const id = `tab-${tabCounter++}`;
    addTab({ id, title: "local", type: "local" });
    setActiveTab(id);
  }, [addTab, setActiveTab]);

  const handleCloseTab = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (tabs.length <= 1) return;
      removeTab(id);
    },
    [tabs.length, removeTab]
  );

  const handleTerminalReady = useCallback(
    (_tabId: string, terminal: Terminal, sa: SearchAddon) => {
      setSearchTerminal(terminal);
      setSearchAddon(sa);
    },
    []
  );

  const handleCommand = useCallback((_command: string) => {
    // Future: wire command detection to AI context
  }, []);

  const handleBlockRightClick = useCallback(
    (block: TerminalBlock, position: { x: number; y: number }) => {
      setContextMenu({ block, position });
    },
    []
  );

  if (!layout || tabs.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Tab bar */}
      <div
        className="term-tab-bar"
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--bg-deeper)",
          borderBottom: "1px solid var(--border)",
          height: 32,
          flexShrink: 0,
          padding: "0 4px",
          gap: 0,
        }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              fontSize: 12,
              cursor: "pointer",
              borderBottom:
                activeTabId === tab.id
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              color: activeTabId === tab.id ? "var(--fg)" : "var(--muted)",
              background: activeTabId === tab.id ? "var(--bg)" : "transparent",
              userSelect: "none",
              whiteSpace: "nowrap",
            }}
          >
            {/* Icon: local vs remote */}
            <span style={{ fontSize: 10, opacity: 0.6 }}>
              {tab.type === "remote" ? "\u2192" : "\u25b6"}
            </span>
            <span>{tab.title}</span>
            {/* Status dot */}
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  tab.status === "connected"
                    ? "var(--success)"
                    : tab.status === "connecting"
                    ? "var(--warn)"
                    : "var(--meta)",
                flexShrink: 0,
              }}
            />
            <span
              onClick={(e) => handleCloseTab(tab.id, e)}
              style={{
                width: 16,
                height: 16,
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                fontSize: 11,
                color: "var(--meta)",
                opacity: 0,
                transition: "opacity 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              \u2715
            </span>
          </div>
        ))}
        <button
          onClick={handleAddTab}
          style={{
            width: 24,
            height: 24,
            display: "grid",
            placeItems: "center",
            background: "transparent",
            border: "none",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: 16,
            borderRadius: 4,
            marginLeft: 4,
          }}
        >
          +
        </button>
        {/* Search toggle */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button
            onClick={() => setSearchVisible((v) => !v)}
            style={{
              width: 24,
              height: 24,
              display: "grid",
              placeItems: "center",
              background: searchVisible ? "var(--surface)" : "transparent",
              border: "none",
              color: searchVisible ? "var(--fg)" : "var(--muted)",
              cursor: "pointer",
              fontSize: 12,
              borderRadius: 4,
            }}
            title="Search (Ctrl+Shift+F)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchVisible && searchTerminal && searchAddon && (
        <TerminalSearch
          terminal={searchTerminal}
          searchAddon={searchAddon}
          onClose={() => setSearchVisible(false)}
        />
      )}

      {/* Terminal panes */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <PaneRenderer
          layout={layout}
          activeTabId={activeTabId}
          onTerminalReady={handleTerminalReady}
          onCommand={handleCommand}
          onBlockRightClick={handleBlockRightClick}
        />
      </div>

      {/* Block context menu */}
      {contextMenu && (
        <BlockContextMenu
          block={contextMenu.block}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
