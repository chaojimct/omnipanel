import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SidebarBottom } from "./SidebarBottom";
import { WorkspacePreviewTaskBar } from "./WorkspacePreviewTaskBar";
import { WorkspaceBottomHost } from "../workspace/WorkspaceBottomHost";
import { useBottomPanelStore, useEmbeddedWorkspaceMode } from "../../stores/bottomPanelStore";
import { useWorkspacePreviewCollapseStore } from "../../stores/workspacePreviewCollapseStore";
import { relayoutDockviewInstances } from "../../lib/dockviewRegistry";
import {
  WS_HEIGHT_HIDDEN_MAX,
  WS_HEIGHT_TASKBAR_MAX,
  type WorkspaceDisplayPreference,
} from "../../lib/workspaceMode";

export type WorkspacePreviewDisplayMode = "split-window" | "task-bar";

export interface WorkspacePreviewProps {
  children: ReactNode;
  className?: string;
}

function resolveDisplayMode(
  embeddedMode: ReturnType<typeof useEmbeddedWorkspaceMode>,
  preference: WorkspaceDisplayPreference,
): WorkspacePreviewDisplayMode {
  if (embeddedMode === "hidden") return "task-bar";
  if (preference === "task-bar" || embeddedMode === "taskbar") return "task-bar";
  return "split-window";
}

function useWorkspacePreviewDockRelayout(
  bottomStackRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): void {
  useEffect(() => {
    if (!enabled) return;
    const stackEl = bottomStackRef.current;
    if (!stackEl) return;

    let lastStackW = 0;
    let lastStackH = 0;
    let raf = 0;

    const relayoutFromStack = () => {
      const stackRect = stackEl.getBoundingClientRect();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        relayoutDockviewInstances("workspace-bottom", {
          width: stackRect.width,
          height: stackRect.height,
        });
      });
    };

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width <= 0 || rect.height <= 0) return;
      if (
        Math.abs(rect.width - lastStackW) < 1 &&
        Math.abs(rect.height - lastStackH) < 1
      ) {
        return;
      }
      lastStackW = rect.width;
      lastStackH = rect.height;
      relayoutFromStack();
    });

    observer.observe(stackEl);
    relayoutFromStack();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [bottomStackRef, enabled]);
}

/**
 * 工作区预览布局：主内容 + 可拖拽底部工作区。
 * - split-window：分屏高度，dockview 展示全部面板
 * - task-bar：标签栏高度（40px），浏览器式标签页
 * 显示模式由 `workspaceDisplayPreference` 用户偏好决定，持久化于 bottomPanelStore。
 */
export function WorkspacePreview({ children, className }: WorkspacePreviewProps) {
  const isPreviewOpen = useWorkspacePreviewCollapseStore((state) => state.isOpen);
  const workspaceMode = useBottomPanelStore((state) => state.workspaceMode);
  const isFullscreen = useBottomPanelStore((state) => state.isFullscreen);
  const requestExpand = useBottomPanelStore((state) => state.requestExpand);
  const requestCollapse = useBottomPanelStore((state) => state.requestCollapse);
  const embeddedMode = useEmbeddedWorkspaceMode();
  const workspaceDisplayPreference = useBottomPanelStore(
    (state) => state.workspaceDisplayPreference,
  );

  const displayMode = resolveDisplayMode(embeddedMode, workspaceDisplayPreference);
  const isPreviewCollapsed = !isPreviewOpen;
  const isBottomPanelOpen =
    isPreviewOpen &&
    !isFullscreen &&
    workspaceMode !== "hidden" &&
    embeddedMode !== "hidden";
  const showSplitWindow = isBottomPanelOpen && displayMode === "split-window";
  const showTaskBar = isBottomPanelOpen && displayMode === "task-bar";
  const bottomStackRef = useRef<HTMLDivElement>(null);

  useWorkspacePreviewDockRelayout(bottomStackRef, showSplitWindow);

  // 首次展开后保持底部子树挂载，避免反复 mount 触发 Windows 控制台闪现
  const [keepBottomMounted, setKeepBottomMounted] = useState(
    () =>
      useWorkspacePreviewCollapseStore.getState().isOpen &&
      useBottomPanelStore.getState().workspaceMode !== "hidden",
  );

  useEffect(() => {
    if (isBottomPanelOpen) {
      setKeepBottomMounted(true);
    }
  }, [isBottomPanelOpen]);

  // 同步预览栏开关与 bottomPanelStore（layout 阶段执行，避免展开后首帧空白）
  useLayoutEffect(() => {
    if (isFullscreen) return;
    if (!isPreviewOpen && workspaceMode !== "hidden") {
      requestCollapse();
      return;
    }
    if (isPreviewOpen && workspaceMode === "hidden") {
      requestExpand();
    }
  }, [isPreviewOpen, isFullscreen, requestCollapse, requestExpand, workspaceMode]);

  const rootClass = [
    "workspace-preview",
    isPreviewCollapsed ? "workspace-preview--collapsed" : "",
    isBottomPanelOpen ? `workspace-preview--${displayMode}` : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // 保持底部子树常驻，避免展开/收起时反复 mount 触发 Windows 控制台闪现等问题
  const bottomPanel = keepBottomMounted ? (
    <div ref={bottomStackRef} className="workspace-preview__bottom-stack">
      <div
        className="workspace-preview__dock"
        data-visible={showSplitWindow ? "true" : "false"}
        aria-hidden={!showSplitWindow}
      >
        <WorkspaceBottomHost />
      </div>
      <div
        className="workspace-preview__taskbar-slot"
        data-visible={showTaskBar ? "true" : "false"}
        aria-hidden={!showTaskBar}
      >
        <WorkspacePreviewTaskBar />
      </div>
    </div>
  ) : (
    <div className="workspace-preview__bottom-stack workspace-preview__bottom-stack--placeholder" />
  );

  return (
    <SidebarBottom
      className={rootClass}
      sidebar={bottomPanel}
      bottomResizeLocked={showTaskBar}
      sidebarMinPx={
        showTaskBar ? WS_HEIGHT_TASKBAR_MAX : WS_HEIGHT_HIDDEN_MAX + 1
      }
    >
      <div className="workspace-preview__main">{children}</div>
    </SidebarBottom>
  );
}

/** task-bar 固定高度，供外部样式引用 */
export { WS_HEIGHT_TASKBAR_MAX as WORKSPACE_PREVIEW_TASKBAR_HEIGHT_PX } from "../../lib/workspaceMode";
