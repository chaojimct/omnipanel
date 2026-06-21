import type { ModuleRouteSnapshot } from "../../lib/workspaceModuleRoutes";
import { FilesPanel } from "../../modules/files/FilesPanel";
import { KnowledgePanel } from "../../modules/knowledge/KnowledgePanel";
import { ProtocolPanel } from "../../modules/protocol/ProtocolPanel";
import { SshPanel } from "../../modules/server/SshPanel";
import { ServerPanel } from "../../modules/server/ServerPanel";
import { WorkflowPanel } from "../../modules/workflow/WorkflowPanel";

interface WorkspaceModuleRoutePanelProps {
  snapshot: ModuleRouteSnapshot;
}

/** 工作区 Dock 内嵌的整模块路由面板 */
export function WorkspaceModuleRoutePanel({ snapshot }: WorkspaceModuleRoutePanelProps) {
  switch (snapshot.moduleKey) {
    case "ssh":
      return <SshPanel />;
    case "server":
      return <ServerPanel />;
    case "files":
      return <FilesPanel />;
    case "protocol":
      return <ProtocolPanel />;
    case "workflow":
      return <WorkflowPanel />;
    case "knowledge":
      return <KnowledgePanel />;
    default:
      return null;
  }
}
