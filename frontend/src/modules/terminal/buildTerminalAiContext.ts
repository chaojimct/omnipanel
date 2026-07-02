import { getResourceById } from "../../lib/resourceRegistry";
import { useSshStatsStore } from "../../stores/sshStatsStore";
import { useTerminalStore } from "../../stores/terminalStore";
import {
  buildSessionMetaLine,
  inferShellLabel,
  parseSshSubtitle,
  resolveOsLabel,
} from "./terminalSessionDisplay";

/** 为 ACP client-tools prompt 构建终端环境上下文块。 */
export function buildTerminalAiContextAppend(sessionId: string): string | null {
  const tab = useTerminalStore.getState().tabs.find((t) => t.id === sessionId);
  if (!tab) return null;

  const session = tab.session;
  const resource = getResourceById(session.resourceId);
  const stats = useSshStatsStore.getState().statsMap[session.resourceId] ?? null;

  const shell = inferShellLabel(session, resource);
  const os = resolveOsLabel(resource, stats);
  const meta = buildSessionMetaLine(session, resource, stats);
  const ssh = parseSshSubtitle(resource?.subtitle);

  const lines = ["[Terminal Context]"];
  lines.push(`- Session type: ${session.type}`);
  if (ssh.user || ssh.host) {
    const host = [ssh.user, ssh.host].filter(Boolean).join("@");
    const port = ssh.port ? `:${ssh.port}` : "";
    lines.push(`- Host: ${host}${port}`);
  } else if (resource?.name) {
    lines.push(`- Resource: ${resource.name}`);
  }
  if (session.cwd?.trim()) {
    lines.push(`- Working directory: ${session.cwd.trim()}`);
  }
  lines.push(`- Shell: ${shell}`);
  if (os) lines.push(`- OS: ${os}`);
  if (meta && meta !== shell) {
    lines.push(`- Environment: ${meta}`);
  }
  lines.push(
    "- IMPORTANT: Commands run in THIS terminal session. Use shell syntax matching the OS/shell above (e.g. `date` on Linux/bash, `Get-Date` on Windows PowerShell only).",
  );

  return lines.join("\n");
}
