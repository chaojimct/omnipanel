import { useAiStore } from "../../stores/aiStore";
import { RightSidebarWorkspace } from "../ui/RightSidebarWorkspace";
import { AiSessionList, AiPanelBody } from "./AiDrawer";

export function AiDockView() {
  const drawerOpen = useAiStore((s) => s.drawerOpen);

  return (
    <div className={`ai-dockview${drawerOpen ? " open" : ""}`}>
      <RightSidebarWorkspace
        preset="ai"
        className="ai-dockview-content"
        sidebar={<AiSessionList rail="right" />}
      >
        <AiPanelBody />
      </RightSidebarWorkspace>
    </div>
  );
}
