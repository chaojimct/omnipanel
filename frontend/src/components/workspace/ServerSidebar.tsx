import { useMemo, useState } from "react";
import {
  type EnvironmentTag,
  type WorkspaceResource,
} from "../../lib/resourceRegistry";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useI18n } from "../../i18n";
import { ContextMenu, type ContextMenuItem } from "../ui/ContextMenu";

const SERVER_PATH = "/server";

interface ServerSidebarProps {
  resources: WorkspaceResource[];
  onCreateServer?: () => void;
  onEditServer?: (resource: WorkspaceResource) => void;
  onDeleteServer?: (resourceId: string) => void;
}

function statusDotClass(status: WorkspaceResource["status"]) {
  if (status === "warning") return "warning";
  if (status === "offline") return "offline";
  return "online";
}

export function ServerSidebar({ resources, onCreateServer, onEditServer, onDeleteServer }: ServerSidebarProps) {
  const { t } = useI18n();
  const selectedResourceByPath = useWorkspaceStore((s) => s.selectedResourceByPath);
  const selectResource = useWorkspaceStore((s) => s.selectResource);
  const activeServerId = selectedResourceByPath[SERVER_PATH];

  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [ctxResource, setCtxResource] = useState<WorkspaceResource | null>(null);

  const grouped = useMemo(() => {
    const order: EnvironmentTag[] = ["prod", "staging", "dev", "local", "unknown"];
    return order
      .map((env) => ({
        env,
        label: t(`env.${env}`),
        items: resources.filter((r) => r.environment === env),
      }))
      .filter((g) => g.items.length > 0);
  }, [resources, t]);

  const selectServer = (resource: WorkspaceResource) => {
    selectResource(resource.id, SERVER_PATH);
  };

  const handleContextMenu = (e: React.MouseEvent, resource: WorkspaceResource) => {
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
    setCtxResource(resource);
  };

  const ctxItems: ContextMenuItem[] = [
    {
      id: "edit",
      label: t("server.sidebar.edit"),
      onClick: () => ctxResource && onEditServer?.(ctxResource),
    },
    {
      id: "delete",
      label: t("server.sidebar.delete"),
      danger: true,
      onClick: () => ctxResource && onDeleteServer?.(ctxResource.id),
    },
  ];

  return (
    <div className="server-sidebar">
      <div className="server-sidebar-header">
        <span>{t("server.sidebar.title")}</span>
        <span className="badge badge-muted">{resources.length}</span>
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
      {grouped.length === 0 ? (
        <div className="empty-state compact">{t("common.noResources")}</div>
      ) : (
        grouped.map((group) => (
          <div key={group.env} className="server-group">
            <div className="server-group-title">{group.label}</div>
            {group.items.map((server) => (
              <button
                key={server.id}
                type="button"
                className={`server-item${activeServerId === server.id ? " active" : ""}`}
                onClick={() => selectServer(server)}
                onContextMenu={(e) => handleContextMenu(e, server)}
              >
                <span className={`status-dot ${statusDotClass(server.status)}`} />
                <span className="server-name">{server.name}</span>
                <span className={`env-tag env-${server.environment}`}>
                  {t(`env.${server.environment}`)}
                </span>
              </button>
            ))}
          </div>
        ))
      )}
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
