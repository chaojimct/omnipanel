import { useEffect } from "react";

import { useI18n } from "../../i18n";
import { useAiStore, type AgentMcpConnection } from "../../stores/aiStore";
import { commands } from "../../ipc/bindings";

function ConnectionChip({ connection }: { connection: AgentMcpConnection }) {
  const { t } = useI18n();
  const title = t("ai.mcp.serviceTitle", {
    name: connection.serviceName,
    count: connection.toolCount,
  });

  return (
    <span
      className={`ai-mcp-chip${connection.builtin ? " ai-mcp-chip--builtin" : ""}${connection.toolCount === 0 ? " ai-mcp-chip--empty" : ""}`}
      title={title}
    >
      {connection.serviceName}
      {connection.builtin ? (
        <span className="ai-mcp-chip-badge">{t("ai.mcp.builtin")}</span>
      ) : null}
      <span className="ai-mcp-chip-count">{connection.toolCount}</span>
    </span>
  );
}

export function AiMcpConnections() {
  const { t } = useI18n();
  const drawerOpen = useAiStore((s) => s.drawerOpen);
  const connections = useAiStore((s) => s.connectedMcpServices);
  const setConnectedMcpServices = useAiStore((s) => s.setConnectedMcpServices);

  useEffect(() => {
    if (!drawerOpen) return;
    void (async () => {
      try {
        const listResult = await commands.mcpListServices();
        if (listResult.status !== "ok") return;
        const running = listResult.data.filter((s) => s.status === "running");
        const connections: AgentMcpConnection[] = [];
        for (const service of running) {
          const toolsResult = await commands.mcpListServiceTools(service.id);
          const toolCount =
            toolsResult.status === "ok" ? toolsResult.data.length : 0;
          connections.push({
            serviceId: service.id,
            serviceName: service.name,
            builtin: service.builtin,
            toolCount,
          });
        }
        setConnectedMcpServices(connections);
      } catch {
        /* ignore */
      }
    })();
  }, [drawerOpen, setConnectedMcpServices]);

  return (
    <div className="ai-mcp-connections">
      <span className="ai-mcp-connections-label">{t("ai.mcp.label")}</span>
      {connections.length === 0 ? (
        <span className="ai-mcp-connections-empty">{t("ai.mcp.none")}</span>
      ) : (
        <div className="ai-mcp-connections-list">
          {connections.map((connection) => (
            <ConnectionChip key={connection.serviceId} connection={connection} />
          ))}
        </div>
      )}
    </div>
  );
}
