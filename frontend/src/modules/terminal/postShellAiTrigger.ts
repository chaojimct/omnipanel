import { useBlocksStore, type TerminalBlock } from "../../stores/blocksStore";
import { isWarpDisplay } from "./terminalDisplayMode";
import { normalizeBlockCommand } from "./terminalOutputText";
import {
  buildPostShellAiQuery,
  shouldTriggerAiAfterShell,
} from "./commandInputRouting";
import { submitInlineFollowUp, submitInlineNaturalLanguage } from "./warpInlineAi";
import { useTerminalUiStore } from "./terminalUiStore";

type PendingUserShell = {
  command: string;
  registeredAt: number;
};

const pendingUserShells = new Map<string, PendingUserShell>();
const triggeredBlockIds = new Set<string>();

const PENDING_TTL_MS = 120_000;

function pendingKey(sessionId: string, command: string): string {
  return `${sessionId}::${normalizeBlockCommand(command)}`;
}

/** Command Bar 用户发起的 shell 命令，供结束后判断是否触发 AI */
export function registerUserShellCommand(sessionId: string, command: string): void {
  if (!isWarpDisplay(sessionId)) return;
  const normalized = normalizeBlockCommand(command);
  if (!normalized) return;

  const now = Date.now();
  for (const [key, entry] of pendingUserShells) {
    if (!key.startsWith(`${sessionId}::`) || now - entry.registeredAt < PENDING_TTL_MS) {
      continue;
    }
    pendingUserShells.delete(key);
  }

  pendingUserShells.set(pendingKey(sessionId, normalized), {
    command: normalized,
    registeredAt: now,
  });
}

function consumeUserShellCommand(sessionId: string, command: string): boolean {
  const normalized = normalizeBlockCommand(command);
  const key = pendingKey(sessionId, normalized);
  const entry = pendingUserShells.get(key);
  if (!entry) return false;
  pendingUserShells.delete(key);
  return Date.now() - entry.registeredAt <= PENDING_TTL_MS;
}

function hasRunningAi(sessionId: string): boolean {
  return useBlocksStore
    .getState()
    .getBlocks(sessionId)
    .some((block) => block.kind === "ai" && block.status === "running");
}

/** OSC 133 命令结束时尝试根据 shell 结果自动触发 AI */
export function tryPostShellAiTrigger(sessionId: string, block: TerminalBlock): void {
  if (!isWarpDisplay(sessionId)) return;
  if (block.kind === "ai") return;
  if (triggeredBlockIds.has(block.id)) return;
  if (!consumeUserShellCommand(sessionId, block.command)) return;
  if (!shouldTriggerAiAfterShell(block)) return;
  if (hasRunningAi(sessionId)) return;

  triggeredBlockIds.add(block.id);
  if (triggeredBlockIds.size > 200) {
    triggeredBlockIds.clear();
  }

  const query = buildPostShellAiQuery(block);
  const cwd = block.cwd?.trim() ?? "";
  const followUpBlockId =
    useTerminalUiStore.getState().expandedAiBlockIds[sessionId] ?? null;

  if (followUpBlockId) {
    void submitInlineFollowUp(sessionId, followUpBlockId, query, cwd);
    return;
  }

  void submitInlineNaturalLanguage(sessionId, query, cwd);
}
