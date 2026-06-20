import { useAiStore } from "../../stores/aiStore";
import { AiAssistantShell } from "./assistant-ui/AiAssistantShell";
import { AiRuntimeProvider } from "./assistant-ui/AiRuntimeProvider";

export function AiDockView() {
  const drawerOpen = useAiStore((s) => s.drawerOpen);

  return (
    <div className={`ai-dockview${drawerOpen ? " open" : ""}`}>
      <AiRuntimeProvider>
        <AiAssistantShell showDockHeader />
      </AiRuntimeProvider>
    </div>
  );
}
