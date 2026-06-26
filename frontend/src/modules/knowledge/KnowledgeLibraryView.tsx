import { useEffect } from "react";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { useKnowledgeStore } from "../../stores/knowledgeStore";
import { KnowledgeSidebar } from "./KnowledgeSidebar";
import { KnowledgeLibraryWorkspace } from "./KnowledgeLibraryWorkspace";

export function KnowledgeLibraryView() {
  const loadEntries = useKnowledgeStore((s) => s.loadEntries);
  const error = useKnowledgeStore((s) => s.error);
  const clearError = useKnowledgeStore((s) => s.clearError);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  return (
    <div className="knowledge-panel">
      {error && (
        <div className="knowledge-error knowledge-error--floating">
          <span>{error}</span>
          <button type="button" onClick={clearError}>×</button>
        </div>
      )}
      <SidebarWorkspace
        preset="schema"
        sidebarMinPx={240}
        sidebarMaxPx={420}
        sidebar={<KnowledgeSidebar />}
      >
        <KnowledgeLibraryWorkspace />
      </SidebarWorkspace>
    </div>
  );
}
