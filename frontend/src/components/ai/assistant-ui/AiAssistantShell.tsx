import {
  AiAssistantHeaderLeft,
  AiAssistantHeaderRight,
} from "./AiAssistantHeaderActions";
import { AiAssistantBody } from "./AiAssistantBody";
import { AiConversationTitle } from "./AiConversationTitle";

export interface AiAssistantShellProps {
  showDockHeader?: boolean;
}

export function AiAssistantShell({ showDockHeader }: AiAssistantShellProps) {
  return (
    <div className="ai-assistant-shell aui-shell">
      {showDockHeader ? (
        <div className="ai-panel-header">
          <AiConversationTitle as="h3" className="ai-panel-header-title" />
          <AiAssistantHeaderLeft />
          <AiAssistantHeaderRight />
        </div>
      ) : null}
      <AiAssistantBody />
    </div>
  );
}
