import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useTerminalUiStore } from "./terminalUiStore";
import {
  clampAiDockHeight,
  DEFAULT_AI_DOCK_HEIGHT,
} from "./terminalAiDock";

type AiDockResizeHandleProps = {
  sessionId: string;
};

export function AiDockResizeHandle({ sessionId }: AiDockResizeHandleProps) {
  const setAiDockHeight = useTerminalUiStore((state) => state.setAiDockHeight);
  // 用 ref 读取起始高度并挂 window 级监听，避免拖拽期间频繁重渲染打断手势。
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startHeight =
        useTerminalUiStore.getState().aiDockHeights[sessionId] ?? DEFAULT_AI_DOCK_HEIGHT;
      dragRef.current = { startY: event.clientY, startHeight };

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const next = clampAiDockHeight(drag.startHeight + (moveEvent.clientY - drag.startY));
        setAiDockHeight(sessionId, next);
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [sessionId, setAiDockHeight],
  );

  return (
    <div
      className="term-warp-ai-dock__resize"
      role="separator"
      aria-orientation="horizontal"
      aria-label="调整 AI 面板最大高度"
      onPointerDown={onPointerDown}
    />
  );
}
