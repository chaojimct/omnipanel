import { useState, useCallback } from "react";
import { DockLayout, DockPanel, DockHandle } from "../../components/dock";
import { TerminalXterm } from "../../components/terminal/TerminalXterm";

interface TermTab {
  id: string;
  label: string;
}

let tabCounter = 0;

export function TerminalPanel() {
  const [tabs, setTabs] = useState<TermTab[]>([{ id: "tab-0", label: "local" }]);
  const [activeTab, setActiveTab] = useState("tab-0");

  const addTab = useCallback(() => {
    tabCounter++;
    const id = `tab-${tabCounter}`;
    setTabs((prev) => [...prev, { id, label: `tab ${tabCounter}` }]);
    setActiveTab(id);
  }, []);

  const closeTab = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    setTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeTab === id) {
      const next = tabs[Math.max(0, idx - 1)].id;
      if (next !== id) setActiveTab(next);
    }
  }, [tabs, activeTab]);

  const setTitle = useCallback((id: string, title: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, label: title } : t))
    );
  }, []);

  return (
    <DockLayout>
      <DockPanel>
        <DockLayout direction="vertical">
          <DockPanel defaultSize={67} minSize={20}>
            <div className="term-tab-bar" style={{
              display: "flex", alignItems: "center",
              background: "var(--bg-deeper)", borderBottom: "1px solid var(--border)",
              height: 32, flexShrink: 0, padding: "0 4px", gap: 0,
            }}>
              {tabs.map((tab) => (
                <div key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={activeTab === tab.id ? "active" : ""}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 12px", fontSize: 12, cursor: "pointer",
                    borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                    color: activeTab === tab.id ? "var(--fg)" : "var(--muted)",
                    background: activeTab === tab.id ? "var(--bg)" : "transparent",
                    userSelect: "none", whiteSpace: "nowrap",
                  }}
                >
                  <span>{tab.label}</span>
                  <span onClick={(e) => closeTab(tab.id, e)}
                    style={{
                      width: 16, height: 16, display: "grid", placeItems: "center",
                      borderRadius: 2, fontSize: 11, color: "var(--meta)",
                      opacity: 0, transition: "opacity 0.12s",
                    }}
                  >✕</span>
                </div>
              ))}
              <button onClick={addTab} style={{
                width: 24, height: 24, display: "grid", placeItems: "center",
                background: "transparent", border: "none", color: "var(--muted)",
                cursor: "pointer", fontSize: 16, borderRadius: 4, marginLeft: 4,
              }}>+</button>
            </div>
            <div className="terminal-container" style={{ flex: 1, minHeight: 0, background: "#0c0c0c" }}>
              {tabs.map((tab) => (
                <div key={tab.id} style={{
                  display: activeTab === tab.id ? "flex" : "none",
                  width: "100%", height: "100%",
                }}>
                  <TerminalXterm onTitleChange={(title) => setTitle(tab.id, title)} />
                </div>
              ))}
            </div>
          </DockPanel>
          <DockHandle direction="vertical" />
          <DockPanel minSize={20}>
            <div className="term-pane-header">
              <span className="env-prod">DB</span>
              <span className="term-host-info">postgresql://db.internal:5432/app_production</span>
            </div>
            <div className="terminal-area" style={{ padding: "var(--sp-4)" }}>
              <div className="terminal-line"><span className="terminal-muted">Connected to database: postgresql://db.internal:5432/app_production</span></div>
              <div className="terminal-line"><span className="terminal-success">postgres=# SELECT version();</span></div>
              <div className="terminal-line"><span className="terminal-output">PostgreSQL 14.10 (Ubuntu 14.10-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu</span></div>
              <div className="terminal-line"><span className="terminal-success">postgres=# SELECT count(*) FROM users;</span></div>
              <div className="terminal-line"><span className="terminal-output"> count</span></div>
              <div className="terminal-line"><span className="terminal-output">-------</span></div>
              <div className="terminal-line"><span className="terminal-output"> 12847</span></div>
              <div className="terminal-line"><span className="terminal-output">(1 row)</span></div>
              <div className="terminal-line"><span className="terminal-success">postgres=# <span className="cursor-blink">{"​"}</span></span></div>
            </div>
          </DockPanel>
        </DockLayout>
      </DockPanel>
      <DockHandle />
      <DockPanel defaultSize={25} minSize={15} collapsible>
        <div className="ai-context-chips" style={{ padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--border)", display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
          <span className="context-chip"><span className="ctx-dot" style={{ background: "var(--accent)" }}></span>web-server</span>
          <span className="context-chip"><span className="ctx-dot" style={{ background: "var(--success)" }}></span>postgres-14</span>
          <span className="context-chip"><span className="ctx-dot" style={{ background: "var(--success)" }}></span>app_production</span>
        </div>
        <div className="ai-messages" style={{ flex: 1, overflowY: "auto", padding: "var(--sp-3)", display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          <div className="ai-msg assistant">
            <div className="ai-msg-body">I can help you analyze the database or suggest queries. What would you like to do?</div>
          </div>
          <div className="ai-msg user">
            <div className="ai-msg-body">Show me the top 10 tables by row count</div>
          </div>
          <div className="ai-msg assistant">
            <div className="ai-msg-body">Here's a query to find the top 10 tables by row count:

SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 10;</div>
          </div>
        </div>
        <div className="ai-input" style={{ padding: "var(--sp-3)", borderTop: "1px solid var(--border)", display: "flex", gap: "var(--sp-2)" }}>
          <input placeholder="Ask AI anything..." type="text" style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm">Send</button>
        </div>
      </DockPanel>
    </DockLayout>
  );
}
