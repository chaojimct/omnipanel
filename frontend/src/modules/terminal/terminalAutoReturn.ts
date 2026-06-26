import { useBlocksStore } from "../../stores/blocksStore";
import { useTerminalUiStore } from "./terminalUiStore";

/** top/vim/less 等 TUI 进入/退出 alternate screen 的 CSI 序列 */
const ALT_SCREEN_ENTER_RE = /\x1b\[\?(?:1049|1047|47)h/g;
const ALT_SCREEN_EXIT_RE = /\x1b\[\?(?:1049|1047|47)l/g;
const ALT_SCREEN_COMMAND_RE = /^(vim|vi|nano|top|htop|less|more)\b/i;

const AUTO_RETURN_GRACE_MS = 600;

const armedAt = new Map<string, number>();
const sawAltEnter = new Map<string, boolean>();
const altScreenActive = new Map<string, boolean>();
const returnTimers = new Map<string, ReturnType<typeof setTimeout>>();

function shouldWatch(sessionId: string): boolean {
  const ui = useTerminalUiStore.getState();
  return (
    ui.shouldAutoReturnToCommandBar(sessionId) &&
    ui.getInputMode(sessionId) === "interactive"
  );
}

export function armAutoReturn(sessionId: string): void {
  armedAt.set(sessionId, Date.now());
  sawAltEnter.set(sessionId, false);
  altScreenActive.delete(sessionId);
  const pending = returnTimers.get(sessionId);
  if (pending) clearTimeout(pending);
  returnTimers.delete(sessionId);
}

function scheduleAutoReturn(sessionId: string): void {
  const armed = armedAt.get(sessionId);
  if (armed && Date.now() - armed < AUTO_RETURN_GRACE_MS) return;

  const pending = returnTimers.get(sessionId);
  if (pending) clearTimeout(pending);
  returnTimers.set(
    sessionId,
    setTimeout(() => {
      returnTimers.delete(sessionId);
      if (!shouldWatch(sessionId)) return;
      if (altScreenActive.get(sessionId)) return;
      useTerminalUiStore.getState().returnToCommandBar(sessionId);
    }, 180),
  );
}

/** 在剥离 ANSI 之前扫描原始输出，检测 TUI 退出 */
export function trackTerminalOutputForAutoReturn(
  sessionId: string,
  bytes: Uint8Array,
): void {
  if (bytes.length === 0 || !shouldWatch(sessionId)) return;
  if (!armedAt.has(sessionId)) return;

  const text = new TextDecoder().decode(bytes);

  if (ALT_SCREEN_ENTER_RE.test(text)) {
    sawAltEnter.set(sessionId, true);
    altScreenActive.set(sessionId, true);
    ALT_SCREEN_ENTER_RE.lastIndex = 0;
  }
  if (ALT_SCREEN_EXIT_RE.test(text)) {
    ALT_SCREEN_EXIT_RE.lastIndex = 0;
    if (!sawAltEnter.get(sessionId)) return;
    altScreenActive.set(sessionId, false);
    scheduleAutoReturn(sessionId);
  }
}

/** OSC 133 命令结束时的兜底（无 alternate screen 的交互命令，如 python） */
export function tryAutoReturnAfterBlockEnd(
  sessionId: string,
  blockId: string,
): void {
  if (!shouldWatch(sessionId)) return;
  if (altScreenActive.get(sessionId)) return;

  const armed = armedAt.get(sessionId);
  if (!armed) return;

  const block = useBlocksStore
    .getState()
    .getBlocks(sessionId)
    .find((item) => item.id === blockId);
  if (!block || block.timestamp < armed - 50) return;

  const command = block.command.trim();
  if (ALT_SCREEN_COMMAND_RE.test(command) && !sawAltEnter.get(sessionId)) {
    return;
  }

  scheduleAutoReturn(sessionId);
}

export function clearAutoReturnTracking(sessionId: string): void {
  armedAt.delete(sessionId);
  sawAltEnter.delete(sessionId);
  altScreenActive.delete(sessionId);
  const pending = returnTimers.get(sessionId);
  if (pending) clearTimeout(pending);
  returnTimers.delete(sessionId);
}
