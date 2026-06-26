import { commands } from "../../../ipc/bindings";
import { isOpenSshHostId } from "../../../lib/sshConfigHosts";
import { findTerminalPane } from "../../../stores/terminalStore";
import { useConnectionStore } from "../../../stores/connectionStore";
import { normalizeHistoryCommands } from "./internalHistoryCommands";
import { useSessionShellHistoryStore } from "./sessionShellHistoryStore";

const inflightFetches = new Set<string>();
const FETCH_THROTTLE_MS = 15_000;

/** useTerminal 连接建立时写入，避免 store 未及时同步 backendSessionId */
const runtimeBackendIds = new Map<string, string>();

export function registerRuntimeBackendSession(
  sessionId: string,
  backendId: string | null,
): void {
  if (backendId) runtimeBackendIds.set(sessionId, backendId);
  else runtimeBackendIds.delete(sessionId);
}

function resolveBackendSessionId(sessionId: string): string | null {
  const pane = findTerminalPane(sessionId);
  if (pane?.backendSessionId) return pane.backendSessionId;
  return runtimeBackendIds.get(sessionId) ?? null;
}

/** 解析 bash 历史文件（含 HISTTIMEFORMAT 时间戳行） */
export function parseBashHistoryContent(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#\d+$/.test(line)) continue;
    lines.push(line);
  }
  return lines;
}

function resolveSshUsername(resourceId: string): string {
  if (!resourceId) return "root";
  const conn = useConnectionStore.getState().connections.find((c) => c.id === resourceId);
  if (conn?.config) {
    try {
      const cfg = JSON.parse(conn.config) as { user?: string };
      if (cfg.user?.trim()) return cfg.user.trim();
    } catch {
      // ignore
    }
  }
  if (isOpenSshHostId(resourceId)) return "root";
  return "root";
}

function buildHistoryPaths(user: string, cwd: string): string[] {
  const paths: string[] = [];
  const add = (p: string) => {
    if (!paths.includes(p)) paths.push(p);
  };
  if (user === "root") add("/root/.bash_history");
  add(`/home/${user}/.bash_history`);
  const home = user === "root" ? "/root" : `/home/${user}`;
  add(`${home}/.bash_history`);
  if (cwd.startsWith("/")) {
    add(`${cwd.replace(/\/$/, "")}/.bash_history`);
  }
  return paths;
}

/**
 * 通过 SSH SFTP 直接读取远端 .bash_history（不依赖 PTY 回显解析）。
 */
export async function fetchShellHistoryFromBackend(sessionId: string): Promise<boolean> {
  if (inflightFetches.has(sessionId)) return false;

  const pane = findTerminalPane(sessionId);
  if (!pane || pane.type !== "remote") return false;

  const backendId = resolveBackendSessionId(sessionId);
  if (!backendId) return false;

  const syncedAt = useSessionShellHistoryStore.getState().getSyncedAt(sessionId);
  const existingCount = useSessionShellHistoryStore.getState().getCommands(sessionId).length;
  if (
    syncedAt > 0 &&
    Date.now() - syncedAt < FETCH_THROTTLE_MS &&
    existingCount >= 20
  ) {
    return existingCount > 0;
  }

  inflightFetches.add(sessionId);
  const user = resolveSshUsername(pane.resourceId);
  const paths = buildHistoryPaths(user, pane.cwd ?? "");

  try {
    for (const remotePath of paths) {
      try {
        const res = await commands.sftpDownload(backendId, remotePath);
        if (res.status !== "ok" || !res.data?.length) continue;

        const text = new TextDecoder().decode(new Uint8Array(res.data));
        const lines = parseBashHistoryContent(text);
        if (lines.length === 0) continue;

        const commandsList = normalizeHistoryCommands([...lines].reverse());
        if (commandsList.length === 0) continue;

        useSessionShellHistoryStore.getState().setCommands(sessionId, commandsList);
        return true;
      } catch {
        continue;
      }
    }
    return false;
  } finally {
    inflightFetches.delete(sessionId);
  }
}
