import type { Connection } from "../../../../ipc/bindings";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { appConfirm } from "../../../../lib/appConfirm";
import { checkCommand } from "../../../../lib/commandGuard";

export function isProdHost(
  resource: WorkspaceResource | null | undefined,
  connection?: Connection,
): boolean {
  if (!resource) return false;
  return resource.environment === "prod" || connection?.envTag === "prod";
}

export async function confirmProdAction(
  message: string,
  resource?: WorkspaceResource | null,
  connection?: Connection,
): Promise<boolean> {
  if (!isProdHost(resource, connection)) return true;
  return appConfirm(message, "生产环境确认");
}

export async function confirmBatchCommand(
  command: string,
  hosts: WorkspaceResource[],
  connections: Connection[],
): Promise<boolean> {
  const prodHosts = hosts.filter((h) =>
    isProdHost(h, connections.find((c) => c.id === h.id)),
  );
  const risk = checkCommand(command, prodHosts.length > 0 ? "prod" : "dev");
  if (risk.level === "low" && prodHosts.length === 0) return true;

  const lines = [
    prodHosts.length > 0
      ? `将在 ${prodHosts.length} 台生产主机上执行，需二次确认。`
      : `将在 ${hosts.length} 台主机上执行命令。`,
    risk.level !== "low" ? `风险等级：${risk.level} — ${risk.matches[0]?.desc ?? "危险命令"}` : null,
    `命令：${command}`,
  ].filter(Boolean);

  return appConfirm(lines.join("\n\n"), "批量命令确认");
}
