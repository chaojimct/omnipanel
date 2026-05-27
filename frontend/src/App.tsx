import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Sidebar } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { StatusBar } from "./components/shell/StatusBar";
import { CommandPalette } from "./components/shell/CommandPalette";
import { NotificationDrawer } from "./components/shell/NotificationDrawer";
import { AiDrawer, AiPinnedPanel } from "./components/ai/AiDrawer";
import { WindowResize } from "./components/shell/WindowResize";
import { Dashboard } from "./modules/workspace/Dashboard";
import { TerminalPanel } from "./modules/terminal/TerminalPanel";
import { SshManager } from "./modules/ssh/SshManager";
import { DatabasePanel } from "./modules/database/DatabasePanel";
import { DockerPanel } from "./modules/docker/DockerPanel";
import { ServerPanel } from "./modules/server/ServerPanel";
import { ProtocolPanel } from "./modules/protocol/ProtocolPanel";
import { WorkflowPanel } from "./modules/workflow/WorkflowPanel";
import { KnowledgePanel } from "./modules/knowledge/KnowledgePanel";
import { TasksPanel } from "./modules/tasks/TasksPanel";
import { SettingsPanel } from "./modules/settings/SettingsPanel";
import { useAiStore } from "./stores/aiStore";

const routeTitles: Record<string, string> = {
  "/": "Workspace",
  "/terminal": "Terminal",
  "/ssh": "SSH Manager",
  "/database": "Database",
  "/docker": "Docker",
  "/server": "Server",
  "/protocol": "Protocol Lab",
  "/workflow": "Workflows",
  "/knowledge": "Knowledge Base",
  "/tasks": "Task Center",
  "/settings": "Settings",
};

function AppShell() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "OmniPanel";
  const isTerminal = location.pathname === "/terminal";
  const drawerOpen = useAiStore((s) => s.drawerOpen);
  const drawerMode = useAiStore((s) => s.drawerMode);
  const isPinned = drawerOpen && drawerMode === "pinned";

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <div className="content-area">
          <div className="content-routes">
            {/* TerminalPanel stays mounted to preserve PTY state */}
            <div style={{
              display: isTerminal ? "flex" : "none",
              flex: 1,
              flexDirection: "column",
              minHeight: 0,
              minWidth: 0,
            }}>
              <TerminalPanel />
            </div>
            {!isTerminal && (
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/ssh" element={<SshManager />} />
                <Route path="/database" element={<DatabasePanel />} />
                <Route path="/docker" element={<DockerPanel />} />
                <Route path="/server" element={<ServerPanel />} />
                <Route path="/protocol" element={<ProtocolPanel />} />
                <Route path="/workflow" element={<WorkflowPanel />} />
                <Route path="/knowledge" element={<KnowledgePanel />} />
                <Route path="/tasks" element={<TasksPanel />} />
                <Route path="/settings" element={<SettingsPanel />} />
              </Routes>
            )}
          </div>
          {isPinned && <AiPinnedPanel />}
        </div>
        <StatusBar />
      </div>
      <AiDrawer />
      <CommandPalette />
      <NotificationDrawer />
      <WindowResize />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
