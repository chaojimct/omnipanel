import { useCallback, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useWorkspaceStore, type WorkspaceInfo } from "../../stores/workspaceStore";
import { useBottomPanelStore } from "../../stores/bottomPanelStore";
import { isEmbeddedWorkspaceMode } from "../../lib/workspaceMode";
import { isDashboardPath } from "../../lib/paths";
import { switchEmbeddedWorkspace } from "../../lib/workspaceNavigation";
import { useI18n } from "../../i18n";
import { WorkspacePopover } from "./WorkspacePopover";

interface WorkspaceSwitcherProps {
  /** 下拉展开方向；模块 Tab 栏使用 below，状态栏使用 above */
  placement?: "above" | "below";
  /** dock：模块 Tab 栏；statusbar：状态栏右侧 */
  variant?: "dock" | "statusbar";
  /**
   * main：主内容区顶栏（首页 / 工程工作区页），可展示并切换首页；
   * embedded：底部半屏 / taskbar 工程工作区，仅切换工程工作区，不导航。
   */
  context?: "main" | "embedded";
  /** 任务栏紧凑模式 */
  compact?: boolean;
  className?: string;
  /** 自定义选择工作区行为；未提供时按 context 默认处理 */
  onSelectWorkspace?: (ws: WorkspaceInfo) => void;
}

function WorkspaceSwitcherIcon() {
  return (
    <svg
      className="workspace-switcher-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="14"
      height="14"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 4v5" />
    </svg>
  );
}

/** 工作区切换器：点击打开下拉，选择工程工作区（或首页）。全屏切换由侧边栏 Logo 负责。 */
export function WorkspaceSwitcher({
  placement = "below",
  variant = "dock",
  context = "main",
  compact = false,
  className,
  onSelectWorkspace,
}: WorkspaceSwitcherProps) {
  const { t } = useI18n();
  const location = useLocation();
  const workspace = useWorkspaceStore((state) => state.workspace);
  const workspaceMode = useBottomPanelStore((state) => state.workspaceMode);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isEmbeddedContext = context === "embedded";
  const isBottomEmbedded =
    isEmbeddedWorkspaceMode(workspaceMode) && workspaceMode !== "hidden";
  const showHomeOption = !isEmbeddedContext;
  const isHomeRoute = isDashboardPath(location.pathname);
  const isHomeDisplay = isHomeRoute && !isEmbeddedContext;
  const displayLabel = isHomeDisplay
    ? t("shell.workspacePopover.home")
    : workspace.name;

  const handleEmbeddedSelect = useCallback(
    (ws: WorkspaceInfo) => {
      switchEmbeddedWorkspace(ws.id);
    },
    [],
  );

  const resolvedSelectWorkspace =
    onSelectWorkspace ?? (isEmbeddedContext ? handleEmbeddedSelect : undefined);

  /** 底部嵌入工作区（taskbar/缩略图/半屏）弹层向上展开，避免被屏幕底边裁切 */
  const popoverPlacement =
    isEmbeddedContext && isBottomEmbedded ? "above" : placement;

  const togglePopover = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const rootClass = [
    "workspace-switcher",
    variant === "dock" ? "drag-ignore" : "",
    isHomeDisplay ? "workspace-switcher--home" : "",
    compact ? "workspace-switcher--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const popover = open ? (
    <WorkspacePopover
      anchorRef={buttonRef}
      placement={popoverPlacement}
      onClose={() => setOpen(false)}
      onSelectWorkspace={resolvedSelectWorkspace}
      showHomeOption={showHomeOption}
    />
  ) : null;

  if (variant === "statusbar") {
    return (
      <div className={rootClass}>
        <button
          ref={buttonRef}
          type="button"
          className={`statusbar-item statusbar-button${open ? " statusbar-button--active" : ""}`}
          onClick={togglePopover}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={displayLabel}
        >
          <WorkspaceSwitcherIcon />
          <span className="statusbar-button-label">{displayLabel}</span>
          <svg
            className="statusbar-button-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="10"
            height="10"
            aria-hidden
          >
            <polyline points="6 15 12 9 18 15" />
          </svg>
        </button>
        {popover}
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <button
        ref={buttonRef}
        type="button"
        className={`workspace-switcher-trigger${open ? " is-open" : ""}`}
        onClick={togglePopover}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={displayLabel}
      >
        <WorkspaceSwitcherIcon />
        <span className="workspace-switcher-label">{displayLabel}</span>
        <svg
          className="workspace-switcher-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="10"
          height="10"
          aria-hidden
        >
          <polyline points="6 15 12 9 18 15" />
        </svg>
      </button>
      {popover}
    </div>
  );
}
