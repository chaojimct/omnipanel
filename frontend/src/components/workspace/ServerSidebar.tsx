import { useMemo, useState } from "react";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useI18n } from "../../i18n";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";
import type { ServerEntry } from "../../modules/server/CreateServerDialog";

const SERVER_PATH = "/server";

interface ServerSidebarProps {
  servers: ServerEntry[];
  onCreateServer?: () => void;
  onEditServer?: (server: ServerEntry) => void;
  onDeleteServer?: (serverId: string) => void;
}

export function ServerSidebar({ servers, onCreateServer, onEditServer, onDeleteServer }: ServerSidebarProps) {
  const { t } = useI18n();
  const selectedResourceByPath = useWorkspaceStore((s) => s.selectedResourceByPath);
  const selectResource = useWorkspaceStore((s) => s.selectResource);
  const activeServerId = selectedResourceByPath[SERVER_PATH];

  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [ctxServer, setCtxServer] = useState<ServerEntry | null>(null);

  const sortedServers = useMemo(
    () => [...servers].sort((a, b) => a.name.localeCompare(b.name)),
    [servers],
  );

  const selectServer = (server: ServerEntry) => {
    selectResource(server.id, SERVER_PATH);
  };

  const handleContextMenu = (e: React.MouseEvent, server: ServerEntry) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setCtxServer(server);
  };

  const ctxItems: ContextMenuItem[] = [
    {
      id: "edit",
      label: t("server.sidebar.edit"),
      onClick: () => ctxServer && onEditServer?.(ctxServer),
    },
    {
      id: "delete",
      label: t("server.sidebar.delete"),
      danger: true,
      onClick: () => ctxServer && onDeleteServer?.(ctxServer.id),
    },
  ];

  return (
    <div className="server-sidebar">
      <div className="server-sidebar-header">
        <span>{t("server.sidebar.title")}</span>
        <span className="badge badge-muted">{servers.length}</span>
        <button
          type="button"
          className="btn btn-ghost btn-icon server-sidebar-add"
          title={t("server.sidebar.addServer")}
          onClick={onCreateServer}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
      <div className="server-sidebar-body">
        {sortedServers.length === 0 ? (
          <div className="empty-state compact">{t("common.noResources")}</div>
        ) : (
          sortedServers.map((server) => (
            <button
              key={server.id}
              type="button"
              className={`server-item${activeServerId === server.id ? " active" : ""}`}
              onClick={() => selectServer(server)}
              onContextMenu={(e) => handleContextMenu(e, server)}
            >
              <div className="server-item__main">
                <div className="server-item__row1">
                  <span className="server-item__name">{server.name}</span>
                  <span
                    className={`badge badge-muted server-item__type-tag server-item__type-tag--${server.serviceType === "bt" ? "bt" : "onepanel"}`}
                  >
                    {t(`server.serviceType.${server.serviceType}`)}
                  </span>
                </div>
                <div className="server-item__address">{server.address}</div>
              </div>
            </button>
          ))
        )}
      </div>
      {ctxPos && (
        <ContextMenu
          items={ctxItems}
          position={ctxPos}
          onClose={() => setCtxPos(null)}
        />
      )}
    </div>
  );
}
