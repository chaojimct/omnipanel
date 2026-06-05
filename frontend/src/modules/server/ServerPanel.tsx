import { useCallback, useMemo, useState } from "react";
import { ServerSidebar } from "../../components/workspace/ServerSidebar";
import { type WorkspaceResource } from "../../lib/resourceRegistry";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useI18n } from "../../i18n";
import { WorkspaceEmptyPage } from "../../components/ui/WorkspaceEmptyPage";
import { CreateServerDialog, type ServerEntry } from "./CreateServerDialog";

function serverEntryToResource(entry: ServerEntry): WorkspaceResource {
  return {
    id: entry.id,
    type: "server",
    name: entry.name,
    subtitle: entry.address,
    modulePath: "/server",
    environment: "dev",
    status: "idle",
  };
}

export function ServerPanel() {
  const { t } = useI18n();
  const selectedServerId = useWorkspaceStore((s) => s.selectedResourceByPath["/server"]);

  const [servers, setServers] = useState<ServerEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerEntry | null>(null);

  const serverResources = useMemo(() => servers.map(serverEntryToResource), [servers]);

  const activeResource = useMemo(() => {
    if (selectedServerId) {
      return serverResources.find((r) => r.id === selectedServerId) ?? null;
    }
    return null;
  }, [selectedServerId, serverResources]);

  const handleCreateServer = useCallback((entry: ServerEntry) => {
    setServers((prev) => [...prev, entry]);
  }, []);

  const handleUpdateServer = useCallback((entry: ServerEntry) => {
    setServers((prev) => prev.map((s) => (s.id === entry.id ? entry : s)));
  }, []);

  const handleDeleteServer = useCallback((resourceId: string) => {
    setServers((prev) => prev.filter((s) => s.id !== resourceId));
  }, []);

  const handleSidebarCreate = useCallback(() => {
    setEditingServer(null);
    setDialogOpen(true);
  }, []);

  const handleEditServer = useCallback((resource: WorkspaceResource) => {
    const entry = servers.find((s) => s.id === resource.id);
    if (entry) {
      setEditingServer(entry);
      setDialogOpen(true);
    }
  }, [servers]);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingServer(null);
  }, []);

  return (
    <div className="server-workspace">
      <ServerSidebar
        resources={serverResources}
        onCreateServer={handleSidebarCreate}
        onEditServer={handleEditServer}
        onDeleteServer={handleDeleteServer}
      />
      <div className="server-main">
        {activeResource ? (
          <div className="server-content">
            <div className="panel" style={{ padding: "var(--sp-8)", textAlign: "center" }}>
              <h3>{activeResource.name}</h3>
              <p className="text-muted">{activeResource.subtitle}</p>
              <p style={{ marginTop: "var(--sp-4)", color: "var(--meta)" }}>
                {t("server.placeholder", { name: activeResource.name })}
              </p>
            </div>
          </div>
        ) : (
          <WorkspaceEmptyPage hint={t("server.empty.description")} />
        )}
      </div>
      <CreateServerDialog
        open={dialogOpen}
        editServer={editingServer}
        onClose={handleDialogClose}
        onCreate={handleCreateServer}
        onUpdate={handleUpdateServer}
      />
    </div>
  );
}
