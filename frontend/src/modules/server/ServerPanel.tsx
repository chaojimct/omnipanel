import { useCallback, useEffect, useMemo, useState } from "react";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { ServerSidebar } from "../../components/workspace/ServerSidebar";
import { useConnectionStore } from "../../stores/connectionStore";
import { useServerGroupStore } from "../../stores/serverGroupStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";
import { quickInput } from "../../lib/quickInput";
import { WorkspaceEmptyPage } from "../../components/ui/WorkspaceEmptyPage";
import { CreateServerDialog, type ServerEntry } from "./CreateServerDialog";
import { ServerInstalledApps } from "./ServerInstalledApps";
import {
  connectionMatchesServerGroup,
  connectionToServerEntry,
  serverEntryToConnection,
} from "./panelConnection";

const SERVER_PATH = "/server";

export function ServerPanel() {
  const { t } = useI18n();
  const selectResource = useWorkspaceStore((s) => s.selectResource);
  const selectedServerId = useWorkspaceStore((s) => s.selectedResourceByPath[SERVER_PATH]);
  const connections = useConnectionStore((s) => s.connections);
  const saveConnection = useConnectionStore((s) => s.save);
  const removeConnection = useConnectionStore((s) => s.remove);

  const groups = useServerGroupStore((s) => s.groups);
  const activeGroupId = useServerGroupStore((s) => s.activeGroupId);
  const setActiveGroupId = useServerGroupStore((s) => s.setActiveGroupId);
  const addGroup = useServerGroupStore((s) => s.addGroup);
  const getGroupName = useServerGroupStore((s) => s.getGroupName);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerEntry | null>(null);

  const activeGroupName = useMemo(
    () => getGroupName(activeGroupId),
    [activeGroupId, getGroupName],
  );

  const groupServers = useMemo(
    () =>
      connections
        .filter((c) => c.kind === "panel" && connectionMatchesServerGroup(c, activeGroupName))
        .map(connectionToServerEntry),
    [connections, activeGroupName],
  );

  const activeServer = useMemo(() => {
    if (!selectedServerId) return null;
    return groupServers.find((s) => s.id === selectedServerId) ?? null;
  }, [selectedServerId, groupServers]);

  useEffect(() => {
    if (selectedServerId && !groupServers.some((s) => s.id === selectedServerId)) {
      const fallback = groupServers[0];
      if (fallback) {
        selectResource(fallback.id, SERVER_PATH);
      }
    }
  }, [groupServers, selectedServerId, selectResource]);

  const handleCreateServer = useCallback(
    async (entry: ServerEntry) => {
      await saveConnection(serverEntryToConnection(entry, activeGroupName));
    },
    [activeGroupName, saveConnection],
  );

  const handleUpdateServer = useCallback(
    async (entry: ServerEntry) => {
      const existing = useConnectionStore.getState().connections.find((c) => c.id === entry.id);
      const group = existing?.group ?? activeGroupName;
      await saveConnection(serverEntryToConnection(entry, group));
    },
    [activeGroupName, saveConnection],
  );

  const handleDeleteServer = useCallback(
    async (resourceId: string) => {
      await removeConnection(resourceId);
    },
    [removeConnection],
  );

  const handleSidebarCreate = useCallback(() => {
    setEditingServer(null);
    setDialogOpen(true);
  }, []);

  const handleEditServer = useCallback((server: ServerEntry) => {
    setEditingServer(server);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingServer(null);
  }, []);

  const handleCreateGroup = useCallback(async () => {
    const name = await quickInput({
      title: t("server.groups.createTitle"),
      subtitle: t("server.groups.nameLabel"),
      placeholder: t("server.groups.namePlaceholder"),
      validate: (value) => {
        if (!value.trim()) {
          return t("server.groups.nameRequired");
        }
        if (groups.some((group) => group.name === value.trim())) {
          return t("server.groups.duplicate");
        }
        return null;
      },
    });
    if (name) {
      addGroup(name);
    }
  }, [addGroup, groups, t]);

  const topbarTabs = useMemo(
    () =>
      groups.map((group) => ({
        id: group.id,
        label: group.name,
        active: group.id === activeGroupId,
      })),
    [groups, activeGroupId],
  );

  useTopbarTabs(
    topbarTabs,
    {
      onSelect: (id) => setActiveGroupId(id),
      onAdd: () => void handleCreateGroup(),
    },
    { mode: "connection", showAddTab: true, addTabTitle: t("server.groups.new") },
  );

  return (
    <>
      <SidebarWorkspace
        preset="server"
        sidebar={
          <ServerSidebar
            servers={groupServers}
            onCreateServer={handleSidebarCreate}
            onEditServer={handleEditServer}
            onDeleteServer={handleDeleteServer}
          />
        }
      >
        <div className="server-main">
          {activeServer ? (
            <ServerInstalledApps server={activeServer} />
          ) : (
            <WorkspaceEmptyPage hint={t("server.empty.description")} />
          )}
        </div>
      </SidebarWorkspace>
      <CreateServerDialog
        open={dialogOpen}
        editServer={editingServer}
        onClose={handleDialogClose}
        onCreate={handleCreateServer}
        onUpdate={handleUpdateServer}
      />
    </>
  );
}
