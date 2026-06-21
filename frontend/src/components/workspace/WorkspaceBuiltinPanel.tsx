import { HomeBoardView } from "../../modules/workspace/HomeBoardView";
import { AiAssistantShell } from "../ai/assistant-ui/AiAssistantShell";
import { AiRuntimeProvider } from "../ai/assistant-ui/AiRuntimeProvider";
import type { WorkspaceBuiltinPanelKind } from "../../lib/workspaceBuiltinPanels";

interface WorkspaceBuiltinPanelProps {
  kind: WorkspaceBuiltinPanelKind;
}

/** 工作区内置面板：看板 / AI 助手 */
export function WorkspaceBuiltinPanel({ kind }: WorkspaceBuiltinPanelProps) {
  if (kind === "board") {
    return <HomeBoardView />;
  }

  return (
    <div className="home-workspace-ai-pane">
      <AiRuntimeProvider>
        <AiAssistantShell showDockHeader />
      </AiRuntimeProvider>
    </div>
  );
}
