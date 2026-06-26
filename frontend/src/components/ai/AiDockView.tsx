import { useAiStore } from "../../stores/aiStore";
import { AiAssistantShell } from "./assistant-ui/AiAssistantShell";

export function AiDockView() {
  const drawerOpen = useAiStore((s) => s.drawerOpen);

  return (
    <div className={`ai-dockview${drawerOpen ? " open" : ""}`}>
      <AiAssistantShell showDockHeader />
    </div>
  );
}
