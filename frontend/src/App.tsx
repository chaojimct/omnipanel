import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { StatusBar } from "./components/shell/StatusBar";
import { CommandPalette } from "./components/shell/CommandPalette";
import { NotificationDrawer } from "./components/shell/NotificationDrawer";
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

  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <div className="flex-1 overflow-hidden min-h-0">
          <Outlet />
        </div>
        <StatusBar />
      </div>
      <CommandPalette />
      <NotificationDrawer />
      <WindowResize />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/terminal" element={<TerminalPanel />} />
          <Route path="/ssh" element={<SshManager />} />
          <Route path="/database" element={<DatabasePanel />} />
          <Route path="/docker" element={<DockerPanel />} />
          <Route path="/server" element={<ServerPanel />} />
          <Route path="/protocol" element={<ProtocolPanel />} />
          <Route path="/workflow" element={<WorkflowPanel />} />
          <Route path="/knowledge" element={<KnowledgePanel />} />
          <Route path="/tasks" element={<TasksPanel />} />
          <Route path="/settings" element={<SettingsPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
