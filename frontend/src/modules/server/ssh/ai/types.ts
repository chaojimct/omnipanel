import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import type { SshHostContext } from "../hooks/useSshHostContext";
import { formatUptime } from "../components/monitoring/monitoringUtils";

export type SshModuleContext = {
  resource: WorkspaceResource | null;
  hostContext: SshHostContext | null;
};

export function isSshModuleContextEmpty(ctx: SshModuleContext): boolean {
  return !ctx.resource;
}

export function buildSshAiContextText(
  resource: WorkspaceResource,
  context: SshHostContext,
): string {
  const lines = [
    "## SSH 主机上下文",
    `- 主机：${resource.name}`,
    `- 地址：${resource.subtitle}`,
    `- 环境：${resource.environment}${context.envTag ? ` (${context.envTag})` : ""}`,
    `- 状态：${resource.status}`,
  ];

  if (context.osInfo) lines.push(`- 系统：${context.osInfo}`);
  if (context.uptimeSecs != null) {
    lines.push(`- 运行时长：${formatUptime(context.uptimeSecs)}`);
  }
  if (context.cpuLabel) lines.push(`- CPU：${context.cpuLabel}`);
  if (context.memoryLabel) lines.push(`- 内存：${context.memoryLabel}`);
  if (context.diskLabel) lines.push(`- 磁盘：${context.diskLabel}`);
  if (context.dockerConnection) {
    lines.push(
      `- Docker：${context.dockerConnection.containersRunning}/${context.dockerConnection.containersTotal} 容器运行中`,
    );
  }
  if (context.panelServiceLabel) lines.push(`- 面板：${context.panelServiceLabel}`);
  lines.push(`- 隧道：${context.activeTunnelCount}/${context.tunnelCount} 活跃`);
  if (context.openSessionCount > 0) {
    lines.push(`- 终端会话：${context.openSessionCount} 个打开`);
  }

  return lines.join("\n");
}
