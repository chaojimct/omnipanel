import type { TerminalSessionInfo } from "../../../stores/terminalStore";
import type { WorkspaceResource } from "../../../lib/resourceRegistry";
import type { TerminalBlock } from "../../../stores/blocksStore";

export interface TerminalModuleContext {
  activeTabId: string | null;
  session: TerminalSessionInfo | null;
  resource: WorkspaceResource | null;
  recentBlocks: TerminalBlock[];
  lastError: TerminalBlock | null;
}

export function isTerminalModuleContextEmpty(ctx: TerminalModuleContext): boolean {
  return !ctx.activeTabId || !ctx.session;
}

export function buildTerminalModuleContext(input: {
  activeTabId: string | null;
  session: TerminalSessionInfo | null;
  resource: WorkspaceResource | null;
  blocks: TerminalBlock[];
}): TerminalModuleContext {
  const sessionBlocks = input.activeTabId
    ? input.blocks.filter((b) => b.sessionId === input.activeTabId)
    : [];
  let lastError: TerminalBlock | null = null;
  for (let i = sessionBlocks.length - 1; i >= 0; i -= 1) {
    const block = sessionBlocks[i];
    if (block.status === "failed" || (block.exitCode !== null && block.exitCode !== 0 && block.exitCode !== 130 && block.exitCode !== 141)) {
      lastError = block;
      break;
    }
  }
  return {
    activeTabId: input.activeTabId,
    session: input.session,
    resource: input.resource,
    recentBlocks: sessionBlocks.slice(-8),
    lastError,
  };
}
