import { useLayoutEffect, type RefObject } from "react";

/** 稳定空数组，避免 `?? []` 每次 render 产生新引用 */
export const EMPTY_SCHEMA_SYNC_TABLE_NAMES: string[] = [];

function querySyncRow(container: HTMLElement, tableName: string): HTMLElement | null {
  return container.querySelector(
    `[data-schema-sync-row="${CSS.escape(tableName)}"]`,
  ) as HTMLElement | null;
}

interface RowPair {
  source: HTMLElement | null;
  target: HTMLElement | null;
}

function collectRowPairs(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  tableNames: string[],
): RowPair[] {
  return tableNames.map((name) => ({
    source: querySyncRow(sourceEl, name),
    target: querySyncRow(targetEl, name),
  }));
}

function clearPairHeights(pairs: RowPair[]) {
  for (const { source, target } of pairs) {
    if (source) source.style.minHeight = "";
    if (target) target.style.minHeight = "";
  }
}

function syncPairHeights(pairs: RowPair[]) {
  for (const { source, target } of pairs) {
    if (!source && !target) {
      continue;
    }
    if (source) source.style.minHeight = "0";
    if (target) target.style.minHeight = "0";
    const height = Math.max(source?.offsetHeight ?? 0, target?.offsetHeight ?? 0);
    if (height <= 0) {
      continue;
    }
    const px = `${height}px`;
    if (source && source.style.minHeight !== px) {
      source.style.minHeight = px;
    }
    if (target && target.style.minHeight !== px) {
      target.style.minHeight = px;
    }
  }
}

/**
 * 结构同步对齐模式下，按表名配对两侧「已展开」行并同步最小高度。
 * 仅监听展开行，避免大库打开任务时 ResizeObserver 风暴。
 */
export function useSchemaRowHeightSync(
  sourceListRef: RefObject<HTMLDivElement | null>,
  targetListRef: RefObject<HTMLDivElement | null>,
  tableNames: readonly string[],
  enabled: boolean,
  syncKey: string,
) {
  const tableNamesKey = tableNames.join("\0");

  useLayoutEffect(() => {
    if (!enabled || tableNames.length === 0) {
      return;
    }
    const sourceEl = sourceListRef.current;
    const targetEl = targetListRef.current;
    if (!sourceEl || !targetEl) {
      return;
    }

    const pairs = collectRowPairs(sourceEl, targetEl, [...tableNames]);
    if (pairs.every((pair) => !pair.source && !pair.target)) {
      return;
    }

    let frame = 0;
    let running = false;

    const runSync = () => {
      if (running) {
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        running = true;
        syncPairHeights(pairs);
        running = false;
      });
    };

    runSync();

    const observer = new ResizeObserver(runSync);
    for (const { source, target } of pairs) {
      if (source) observer.observe(source);
      if (target) observer.observe(target);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      clearPairHeights(pairs);
    };
  }, [sourceListRef, targetListRef, enabled, syncKey, tableNamesKey]);
}
