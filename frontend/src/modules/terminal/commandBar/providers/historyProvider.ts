import { useBlocksStore } from "../../../../stores/blocksStore";
import type { CompletionCandidate, TerminalCompletionContext } from "../types";
import { buildReplacementRange, parseCommandLineForCompletion } from "../parseCommandLine";

export function suggestHistory(ctx: TerminalCompletionContext): CompletionCandidate[] {
  const parsed = parseCommandLineForCompletion(ctx.input, ctx.cursor);
  const token = parsed.activeToken;
  if (!token || token.kind === "path" || token.kind === "resource") return [];

  const prefix = token.text.toLowerCase();
  const blocks = useBlocksStore.getState().getBlocks(ctx.sessionId);
  const seen = new Set<string>();
  const candidates: CompletionCandidate[] = [];

  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const cmd = blocks[i].command.trim();
    if (!cmd || seen.has(cmd)) continue;
    if (prefix && !cmd.toLowerCase().startsWith(prefix)) continue;
    seen.add(cmd);
    const replacement = buildReplacementRange(token, ctx.cursor);
    candidates.push({
      id: `history:${cmd}`,
      label: cmd,
      insertText: cmd,
      description: "历史命令",
      source: "history",
      priority: "default",
      replacement,
    });
    if (candidates.length >= 20) break;
  }

  return candidates;
}
