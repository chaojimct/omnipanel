import type { TerminalBlock } from "../../../stores/blocksStore";
import { isAiThreadMessage } from "../../../stores/blocksStore";
import { isInternalHistoryCommand } from "./internalHistoryCommands";

export type CommandHistoryKind = "shell" | "ai" | "readline";

export type CommandHistoryEntry = {
  text: string;
  kind: CommandHistoryKind;
  timestamp: number;
};
export const HISTORY_PANEL_DISPLAY_LIMIT = 50;
export const HISTORY_SEARCH_DISPLAY_LIMIT = 100;

type BlockMeta = {
  kind: CommandHistoryKind;
  timestamp: number;
};

function extractAiCommandText(block: TerminalBlock): string[] {
  const results: string[] = [];
  const cmd = block.command.trim();
  if (cmd.startsWith("#")) {
    results.push(cmd);
  } else if (block.kind === "ai" && block.title?.trim()) {
    results.push(`# ${block.title.trim()}`);
  }

  for (const item of block.aiThread ?? []) {
    if (!isAiThreadMessage(item) || item.role !== "user") continue;
    const query = item.content.trim();
    if (!query) continue;
    results.push(query.startsWith("#") ? query : `# ${query}`);
  }

  return results;
}

function buildBlockMeta(blocks: TerminalBlock[]): Map<string, BlockMeta> {
  const map = new Map<string, BlockMeta>();
  for (const block of blocks) {
    if (block.kind === "ai") {
      for (const text of extractAiCommandText(block)) {
        if (isInternalHistoryCommand(text)) continue;
        const existing = map.get(text);
        if (!existing || block.timestamp >= existing.timestamp) {
          map.set(text, { kind: "ai", timestamp: block.timestamp });
        }
      }
      continue;
    }
    const cmd = block.command.trim();
    if (!cmd || cmd.startsWith("#") || isInternalHistoryCommand(cmd)) continue;
    const existing = map.get(cmd);
    if (!existing || block.timestamp >= existing.timestamp) {
      map.set(cmd, { kind: "shell", timestamp: block.timestamp });
    }
  }
  return map;
}

/** 仅依赖命令字段的指纹，忽略 output 变更 */
export function computeBlocksHistoryKey(blocks: TerminalBlock[]): string {
  if (blocks.length === 0) return "0";
  const parts: string[] = new Array(blocks.length);
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i]!;
    let part = `${block.id}\x01${block.kind ?? "shell"}\x01${block.command}\x01${block.timestamp}`;
    const thread = block.aiThread;
    if (thread && thread.length > 0) {
      for (const item of thread) {
        if (item.kind === "message" && item.role === "user") {
          part += `\x01${item.id}:${item.content}`;
        }
      }
    }
    parts[i] = part;
  }
  return parts.join("\x02");
}

export type IndexedCommandHistoryEntry = CommandHistoryEntry & {
  searchText: string;
};

/** 构建会话全量历史索引（新 → 旧），readline 应已规范化 */
export function buildHistoryIndex(
  blocks: TerminalBlock[],
  readlineCommands: string[],
): IndexedCommandHistoryEntry[] {
  const blockMeta = buildBlockMeta(blocks);
  const seen = new Set<string>();
  const entries: IndexedCommandHistoryEntry[] = [];
  const recencyBase = Date.now();

  for (let i = 0; i < readlineCommands.length; i += 1) {
    const text = readlineCommands[i]!.trim();
    if (!text || isInternalHistoryCommand(text) || seen.has(text)) continue;
    seen.add(text);
    const fromBlock = blockMeta.get(text);
    entries.push({
      text,
      kind: fromBlock?.kind ?? "readline",
      timestamp: fromBlock?.timestamp ?? recencyBase - i,
      searchText: text.toLowerCase(),
    });
  }

  for (const [text, meta] of blockMeta) {
    if (seen.has(text)) continue;
    seen.add(text);
    entries.push({
      text,
      kind: meta.kind,
      timestamp: meta.timestamp,
      searchText: text.toLowerCase(),
    });
  }

  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

export function filterHistoryIndex(
  index: IndexedCommandHistoryEntry[],
  query: string,
  displayLimit = HISTORY_PANEL_DISPLAY_LIMIT,
  searchLimit = HISTORY_SEARCH_DISPLAY_LIMIT,
): CommandHistoryEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return index.slice(0, displayLimit);
  }

  const matched: CommandHistoryEntry[] = [];
  for (let i = 0; i < index.length; i += 1) {
    const entry = index[i]!;
    if (!entry.searchText.includes(normalized)) continue;
    matched.push(entry);
    if (matched.length >= searchLimit) break;
  }
  return matched;
}
