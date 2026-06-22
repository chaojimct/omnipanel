import { useEffect, useRef } from "react";
import { relayoutDockviewInstances } from "../../lib/dockviewRegistry";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { WorkspacePanel } from "./WorkspacePanel";

/**
 * 工作区容器：按当前工作区挂载 dockview 面板。
 */
export function WorkspaceBottomHost() {
  const hostRef = useRef<HTMLDivElement>(null);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentId = useWorkspaceStore((state) => state.workspace.id);
  const current =
    workspaces.find((ws) => ws.id === currentId) ?? workspaces[0] ?? null;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let lastWidth = 0;
    let lastHeight = 0;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const { width, height } = rect;
      if (width <= 0 || height <= 0) return;
      if (Math.abs(width - lastWidth) < 1 && Math.abs(height - lastHeight) < 1) {
        return;
      }
      lastWidth = width;
      lastHeight = height;
      requestAnimationFrame(() => {
        relayoutDockviewInstances("workspace-bottom", { width, height });
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentId]);

  return (
    <div ref={hostRef} className="workspace-bottom-host">
      {current ? <WorkspacePanel workspace={current} /> : null}
    </div>
  );
}
