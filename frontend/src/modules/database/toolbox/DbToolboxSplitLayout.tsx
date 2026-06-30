import { useCallback, useRef, type ReactNode } from "react";

import {
  DB_TOOLBOX_SYNC_SPLIT_KEY,
  DB_TOOLBOX_SYNC_SPLIT_MAX,
  DB_TOOLBOX_SYNC_SPLIT_MIN,
  getDbToolboxSyncSourceRatio,
  usePanelLayoutStore,
} from "../../../stores/panelLayoutStore";

interface DbToolboxSplitLayoutProps {
  source: ReactNode;
  target: ReactNode;
}

export function DbToolboxSplitLayout({ source, target }: DbToolboxSplitLayoutProps) {
  const splitRatios = usePanelLayoutStore((s) => s.splitRatios);
  const setSplitRatio = usePanelLayoutStore((s) => s.setSplitRatio);
  const sourceRatio = getDbToolboxSyncSourceRatio(splitRatios);

  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateRatioFromPointer = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(
        DB_TOOLBOX_SYNC_SPLIT_MAX,
        Math.max(DB_TOOLBOX_SYNC_SPLIT_MIN, percent),
      );
      setSplitRatio(DB_TOOLBOX_SYNC_SPLIT_KEY, Math.round(clamped * 10) / 10);
    },
    [setSplitRatio],
  );

  const handleDividerPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleDividerPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      updateRatioFromPointer(event.clientX);
    },
    [updateRatioFromPointer],
  );

  const handleDividerPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div ref={containerRef} className="db-toolbox-split">
      <div className="db-toolbox-split__source" style={{ width: `${sourceRatio}%` }}>
        {source}
      </div>
      <div
        className="db-toolbox-split__divider"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(sourceRatio)}
        aria-valuemin={DB_TOOLBOX_SYNC_SPLIT_MIN}
        aria-valuemax={DB_TOOLBOX_SYNC_SPLIT_MAX}
        tabIndex={0}
        onPointerDown={handleDividerPointerDown}
        onPointerMove={handleDividerPointerMove}
        onPointerUp={handleDividerPointerUp}
        onPointerCancel={handleDividerPointerUp}
      />
      <div className="db-toolbox-split__target">{target}</div>
    </div>
  );
}
