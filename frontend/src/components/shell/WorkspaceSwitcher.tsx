import { useRef, useState } from "react";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { WorkspacePopover } from "./WorkspacePopover";

interface WorkspaceSwitcherProps {
  /** 下拉展开方向；模块 Tab 栏使用 below，状态栏使用 above */
  placement?: "above" | "below";
  /** dock：模块 Tab 栏；statusbar：状态栏右侧 */
  variant?: "dock" | "statusbar";
  className?: string;
}

/**
 * 工程工作区切换器：当前工作区名称 + 下拉列表（切换 / 新建 / 删除）。
 * 用于首页 ModuleSegmentDock 前缀操作区与状态栏右侧。
 */
export function WorkspaceSwitcher({
  placement = "below",
  variant = "dock",
  className,
}: WorkspaceSwitcherProps) {
  const workspace = useWorkspaceStore((state) => state.workspace);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const rootClass = [
    "workspace-switcher",
    variant === "dock" ? "drag-ignore" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const popover = open ? (
    <WorkspacePopover
      anchorRef={buttonRef}
      placement={placement}
      onClose={() => setOpen(false)}
    />
  ) : null;

  if (variant === "statusbar") {
    return (
      <div className={rootClass}>
        <button
          ref={buttonRef}
          type="button"
          className={`statusbar-item statusbar-button${open ? " statusbar-button--active" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          title={workspace.name}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" aria-hidden>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 4v5" />
          </svg>
          <span className="statusbar-button-label">{workspace.name}</span>
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
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={workspace.name}
      >
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
        <span className="workspace-switcher-label">{workspace.name}</span>
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
