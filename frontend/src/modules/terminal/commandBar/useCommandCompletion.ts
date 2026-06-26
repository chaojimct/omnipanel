import { useCallback, useEffect, useMemo, useState } from "react";
import type { CompletionCandidate, TerminalCompletionContext } from "./types";
import { suggestHistory } from "./providers/historyProvider";
import { suggestTemplates } from "./providers/templateProvider";
import { suggestPaths, suggestWorkspaceResources } from "./providers/pathProvider";

const PRIORITY_ORDER = { high: 0, default: 1, low: 2 } as const;

function mergeCandidates(lists: CompletionCandidate[][]): CompletionCandidate[] {
  const seen = new Set<string>();
  const merged: CompletionCandidate[] = [];
  const flat = lists.flat().sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
  );
  for (const item of flat) {
    const key = `${item.source}:${item.insertText}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 30);
}

interface UseCommandCompletionOptions {
  /** 仅在用户打开补全浮层（如按 Tab）时请求路径列表，避免每次按键打 IPC */
  fetchPaths?: boolean;
}

export function useCommandCompletion(
  ctx: TerminalCompletionContext | null,
  options: UseCommandCompletionOptions = {},
) {
  const { fetchPaths = false } = options;
  const [candidates, setCandidates] = useState<CompletionCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const ctxKey = useMemo(
    () => (ctx ? `${ctx.sessionId}:${ctx.input}:${ctx.cursor}:${fetchPaths}` : ""),
    [ctx, fetchPaths],
  );

  const refresh = useCallback(async () => {
    if (!ctx) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    try {
      const sync = [
        suggestHistory(ctx),
        suggestTemplates(ctx),
        suggestWorkspaceResources(ctx),
      ];
      const paths = fetchPaths ? await suggestPaths(ctx) : [];
      setCandidates(mergeCandidates([...sync, paths]));
    } finally {
      setLoading(false);
    }
  }, [ctx, fetchPaths]);

  useEffect(() => {
    void refresh();
  }, [ctxKey, refresh]);

  return { candidates, loading, refresh };
}

export function applyCompletionCandidate(
  input: string,
  candidate: CompletionCandidate,
): { value: string; cursor: number } {
  const { start, end } = candidate.replacement;
  const before = input.slice(0, start);
  const after = input.slice(end);
  const needsSpace = after.length > 0 && !after.startsWith(" ") ? " " : "";
  const value = `${before}${candidate.insertText}${needsSpace}${after}`;
  const cursor = before.length + candidate.insertText.length + (needsSpace ? 1 : 0);
  return { value, cursor };
}
