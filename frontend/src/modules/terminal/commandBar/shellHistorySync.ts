import { setTerminalPaneSender, terminalPaneSenders } from "../terminalPaneSenders";
import { useSessionShellHistoryStore } from "./sessionShellHistoryStore";
import { fetchShellHistoryFromBackend } from "./shellHistoryFetch";

/** 文本同步标记（PTY 回显解析备用） */
export const SHELL_HISTORY_SYNC_BEGIN = "__OMNIPANEL_HIST_BEGIN__";
export const SHELL_HISTORY_SYNC_END = "__OMNIPANEL_HIST_END__";

/** 兼容旧别名触发 */
export const SHELL_HISTORY_SYNC_ALIAS = "__omnipanel_history_sync__";

/** 从 HISTFILE 同步的最大行数 */
export const SHELL_HISTORY_SYNC_MAX = 5000;

export const SHELL_HISTORY_SYNC_COMMAND = [
  `printf '${SHELL_HISTORY_SYNC_BEGIN}\\n'`,
  'f="${HISTFILE:-$HOME/.bash_history}"',
  `if [ -f "$f" ]; then tail -n ${SHELL_HISTORY_SYNC_MAX} "$f" | base64 -w0 2>/dev/null || tail -n ${SHELL_HISTORY_SYNC_MAX} "$f" | base64 | tr -d '\\n'; fi`,
  `printf '\\n${SHELL_HISTORY_SYNC_END}\\n'`,
].join("; ");

const SYNC_THROTTLE_MS = 30_000;
const SYNC_TIMEOUT_MS = 25_000;

const syncingSessions = new Set<string>();

export function isSilentHistorySyncCommand(command: string): boolean {
  const trimmed = command.trim();
  if (!trimmed) return false;
  if (trimmed === SHELL_HISTORY_SYNC_ALIAS) return true;
  if (trimmed.includes(SHELL_HISTORY_SYNC_BEGIN)) return true;
  if (trimmed.includes(SHELL_HISTORY_SYNC_END)) return true;
  if (trimmed.includes("HistoryBlobEnd") || trimmed.includes("HistoryPart=")) return true;
  if (trimmed.includes("HISTFILE") && trimmed.includes("base64")) return true;
  return false;
}

export function isSilentHistorySync(sessionId: string): boolean {
  return syncingSessions.has(sessionId);
}

export function beginSilentHistorySync(sessionId: string): void {
  syncingSessions.add(sessionId);
  window.setTimeout(() => {
    if (syncingSessions.has(sessionId)) {
      finishSilentHistorySync(sessionId);
    }
  }, SYNC_TIMEOUT_MS);
}

export function finishSilentHistorySync(sessionId: string): void {
  syncingSessions.delete(sessionId);
}

export function decodeShellHistoryOscPayload(encoded: string): string {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return encoded;
  }
}

function requestShellHistorySyncViaPty(sessionId: string): void {
  const sender = terminalPaneSenders[sessionId];
  if (!sender || syncingSessions.has(sessionId)) return;

  beginSilentHistorySync(sessionId);
  sender(SHELL_HISTORY_SYNC_COMMAND);
}

/** 拉取 shell 历史：优先 SFTP 直读，失败再走 PTY 静默同步 */
export function requestShellHistorySync(sessionId: string): void {
  const syncedAt = useSessionShellHistoryStore.getState().getSyncedAt(sessionId);
  const existingCount = useSessionShellHistoryStore.getState().getCommands(sessionId).length;
  if (
    syncedAt > 0 &&
    Date.now() - syncedAt < SYNC_THROTTLE_MS &&
    existingCount >= 20
  ) {
    return;
  }

  void fetchShellHistoryFromBackend(sessionId).then((ok) => {
    if (!ok) {
      requestShellHistorySyncViaPty(sessionId);
    }
  });
}

/** 带重试的历史同步 */
export function requestShellHistorySyncWithRetry(
  sessionId: string,
  maxAttempts = 4,
  intervalMs = 1500,
): void {
  let attempt = 0;

  const run = () => {
    if (attempt >= maxAttempts) return;
    attempt += 1;

    const prev = useSessionShellHistoryStore.getState().getCommands(sessionId).length;
    requestShellHistorySync(sessionId);

    window.setTimeout(() => {
      const next = useSessionShellHistoryStore.getState().getCommands(sessionId).length;
      if (next > prev) return;
      run();
    }, intervalMs * 3);
  };

  run();
}

/** useTerminal 初始化 PTY 发送器时注册，避免 TerminalView effect 竞态导致 sender 为空 */
export function registerShellHistoryPtySender(
  sessionId: string,
  sender: ((cmd: string) => void) | null,
): void {
  setTerminalPaneSender(sessionId, sender);
}
