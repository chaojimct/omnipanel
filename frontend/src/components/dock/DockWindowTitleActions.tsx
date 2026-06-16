import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef } from "react";
import { WinControls } from "../shell/WinControls";

/** 嵌入 dockview 首个 panel 组 tab 栏右侧：拖拽空白条 + 窗口控制按钮 */
export function DockWindowTitleActions() {
  const spacerDragRef = useRef<{ startX: number; startY: number } | null>(null);

  const onSpacerMouseDown = useCallback((e: React.MouseEvent) => {
    spacerDragRef.current = { startX: e.clientX, startY: e.clientY };
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const s = spacerDragRef.current;
      if (!s) return;
      if (Math.abs(e.clientX - s.startX) > 3 || Math.abs(e.clientY - s.startY) > 3) {
        spacerDragRef.current = null;
        getCurrentWindow().startDragging();
      }
    };
    const onMouseUp = () => {
      spacerDragRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  const handleDoubleClick = async (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest(".win-controls")) return;
    const win = getCurrentWindow();
    if (await win.isFullscreen()) {
      await win.setFullscreen(false);
    } else {
      await win.toggleMaximize();
    }
  };

  return (
    <div
      className="dock-window-title-actions drag-ignore"
      data-tauri-drag-region="false"
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="dock-window-drag-spacer"
        data-tauri-drag-region
        onMouseDown={onSpacerMouseDown}
      />
      <WinControls />
    </div>
  );
}
