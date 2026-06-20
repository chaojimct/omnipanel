import { useSyncExternalStore } from "react";
import type { WorkspaceDockTab } from "../../stores/workspaceBottomDockStore";
import {
  getMirroredDbTabVersion,
  subscribeMirroredDbTab,
} from "../../stores/dbWorkspaceMirrorStore";
import { useTerminalStore } from "../../stores/terminalStore";
import {
  resolveWorkspaceTabPreview,
  type WorkspacePreviewKind,
} from "../../lib/workspaceTabPreview";

function usePreviewRevision(tab: WorkspaceDockTab): void {
  const terminalVersion = useTerminalStore((s) => {
    const id =
      tab.originScope === "terminal" && tab.originPanelId
        ? tab.originPanelId
        : tab.payload?.module === "terminal"
          ? tab.payload.id
          : null;
    if (!id) return 0;
    const t = s.tabs.find((item) => item.id === id);
    return t?.terminal ? t.terminal.buffer.active.length : 0;
  });

  useSyncExternalStore(
    (onStoreChange) => {
      const id =
        tab.originScope === "database" && tab.originPanelId
          ? tab.originPanelId
          : tab.payload?.module === "database"
            ? tab.payload.id
            : null;
      if (!id) return () => undefined;
      return subscribeMirroredDbTab(id, onStoreChange);
    },
    () => {
      const id =
        tab.originScope === "database" && tab.originPanelId
          ? tab.originPanelId
          : tab.payload?.module === "database"
            ? tab.payload.id
            : null;
      return id ? getMirroredDbTabVersion(id) : 0;
    },
    () => 0,
  );

  void terminalVersion;
}

function PreviewKindIcon({ kind }: { kind: WorkspacePreviewKind }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    width: 22,
    height: 22,
    "aria-hidden": true,
  } as const;

  if (kind === "terminal" || kind === "docker-terminal") {
    return (
      <svg {...props}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M7 9l3 3-3 3M11 15h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "database-sql") {
    return (
      <svg {...props}>
        <path d="M8 4h8l2 2v14H6V6l2-2z" />
        <path d="M14 4v4h4M8 12h8M8 16h5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "database-table") {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="14" rx="1.5" />
        <path d="M4 10h16M9 5v14M15 5v14" />
      </svg>
    );
  }
  if (kind === "docker-logs") {
    return (
      <svg {...props}>
        <path d="M12 3c4 0 7 2 7 5v8c0 3-3 5-7 5S5 19 5 16V8c0-3 3-5 7-5z" />
        <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 10h8M8 14h5" strokeLinecap="round" />
    </svg>
  );
}

export interface WorkspacePreviewPanelTileProps {
  tab: WorkspaceDockTab;
  active?: boolean;
  onClick: () => void;
}

/** Windows 任务视图风格：上方缩略图/图标，底部标题。 */
export function WorkspacePreviewPanelTile({
  tab,
  active,
  onClick,
}: WorkspacePreviewPanelTileProps) {
  usePreviewRevision(tab);
  const preview = resolveWorkspaceTabPreview(tab);

  return (
    <button
      type="button"
      className={`workspace-preview__panel-tile${active ? " workspace-preview__panel-tile--active" : ""}`}
      onClick={onClick}
      title={preview.title}
    >
      <div className="workspace-preview__panel-thumb" data-kind={preview.kind}>
        <pre className="workspace-preview__panel-thumb-lines" aria-hidden>
          {preview.lines.slice(0, 4).join("\n")}
        </pre>
        <span className="workspace-preview__panel-icon" aria-hidden>
          <PreviewKindIcon kind={preview.kind} />
        </span>
      </div>
      <span className="workspace-preview__panel-label">{preview.title}</span>
    </button>
  );
}
