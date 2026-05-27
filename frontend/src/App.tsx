import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./components/shell/Sidebar";
import { Topbar } from "./components/shell/Topbar";
import { StatusBar } from "./components/shell/StatusBar";
import { CommandPalette } from "./components/shell/CommandPalette";
import { NotificationDrawer } from "./components/shell/NotificationDrawer";
import { WindowResize } from "./components/shell/WindowResize";
import { Dashboard } from "./components/panels/Dashboard";
import { TerminalPanel } from "./components/panels/TerminalPanel";
import { SshManager } from "./components/panels/SshManager";
import { DatabasePanel } from "./components/panels/DatabasePanel";
import { DockerPanel } from "./components/panels/DockerPanel";
import { ServerPanel } from "./components/panels/ServerPanel";
import { ProtocolPanel } from "./components/panels/ProtocolPanel";
import { WorkflowPanel } from "./components/panels/WorkflowPanel";
import { KnowledgePanel } from "./components/panels/KnowledgePanel";
import { TasksPanel } from "./components/panels/TasksPanel";
import { SettingsPanel } from "./components/panels/SettingsPanel";

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
