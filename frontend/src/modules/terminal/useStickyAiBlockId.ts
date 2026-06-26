import { useEffect, useState, type RefObject } from "react";
import type { TerminalBlock } from "../../stores/blocksStore";
import { findLastAiBlockId } from "./terminalAiDock";

type ListBlockEntry = {
  blockId: string;
  rect: DOMRect;
};

/** 列表子节点可能是 Fragment 展开的 sentinel + outer，block id 在嵌套层 */
function collectListBlockEntries(list: HTMLElement): ListBlockEntry[] {
  const entries: ListBlockEntry[] = [];
  for (const child of list.children) {
    if (!(child instanceof HTMLElement)) continue;
    const blockId =
      child.dataset.blockId ??
      child.querySelector<HTMLElement>("[data-block-id]")?.dataset.blockId;
    if (!blockId) continue;
    entries.push({ blockId, rect: child.getBoundingClientRect() });
  }
  return entries;
}

/**
 * 根据 Feed 滚动视口，解析「当前展示内容上方」的最后一条 AI 块。
 *
 * 取视口内最靠下的可见块为锚点，在其之前的时间线里找最后一条 AI。
 * 例：[AI1, shell, AI2, shell] 滚到底时锚点为底部 shell → 吸顶 AI2；
 * 向上滚到 AI1 区域时锚点可能是中间 shell → 吸顶 AI1。
 */
export function resolveStickyAiBlockId(
  container: HTMLElement,
  list: HTMLElement,
  visibleBlocks: TerminalBlock[],
): string | null {
  const containerRect = container.getBoundingClientRect();
  const viewportTop = containerRect.top;
  const viewportBottom = containerRect.bottom;

  const entries = collectListBlockEntries(list);
  if (entries.length === 0) return null;

  let anchorIndex = -1;
  for (let i = entries.length - 1; i >= 0; i--) {
    const { rect } = entries[i];
    if (rect.top < viewportBottom && rect.bottom > viewportTop) {
      anchorIndex = i;
      break;
    }
  }
  if (anchorIndex < 0) {
    anchorIndex = entries.length - 1;
  }

  let stickyAiBlockId: string | null = null;
  for (let i = 0; i <= anchorIndex; i++) {
    const id = entries[i]?.blockId;
    if (!id) continue;
    const block = visibleBlocks.find((entry) => entry.id === id);
    if (block?.kind === "ai") stickyAiBlockId = id;
  }
  return stickyAiBlockId;
}

export function useStickyAiBlockId(
  scrollRef: RefObject<HTMLElement | null>,
  listRef: RefObject<HTMLElement | null>,
  visibleBlocks: TerminalBlock[],
  activitySignature = "",
): string | null {
  const fallbackId = findLastAiBlockId(visibleBlocks);
  const [stickyAiBlockId, setStickyAiBlockId] = useState<string | null>(fallbackId);

  useEffect(() => {
    const container = scrollRef.current;
    const list = listRef.current;
    if (!container || !list) {
      setStickyAiBlockId(fallbackId);
      return;
    }

    const update = () => {
      const next = resolveStickyAiBlockId(container, list, visibleBlocks) ?? fallbackId;
      setStickyAiBlockId((prev) => (prev === next ? prev : next));
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const observer = new ResizeObserver(update);
    observer.observe(list);
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, [activitySignature, fallbackId, listRef, scrollRef, visibleBlocks]);

  return stickyAiBlockId ?? fallbackId;
}
