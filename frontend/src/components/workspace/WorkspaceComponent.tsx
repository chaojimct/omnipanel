import { type MouseEvent, type ReactNode, useCallback } from "react";

import { useCtrlKeyHeld } from "../../hooks/useCtrlKeyHeld";
import { isPointerCopyModifier } from "../../lib/platform";
import { addComponentToWorkspace } from "../../lib/workspaceTabActions";
import type { WorkspaceComponentProps as SerializableProps } from "../../lib/workspaceComponentTypes";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { cn } from "../../lib/utils";

export interface WorkspaceComponentRootProps {
  /** 注册表中的组件类型 id */
  componentType: string;
  /** 加入工作区后的面板标题 */
  label: string;
  /** 可序列化 props，写入工作区配置并在工作区中还原渲染 */
  props?: SerializableProps;
  /** 可选：固定快照 id（同 props 去重） */
  snapshotId?: string;
  /** 加入工作区后是否跳转到工作区详情页，默认 false（Ctrl+点击仅写入底部工作区） */
  navigateOnAdd?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 工作区可添加组件根节点。
 * 包裹此组件的 UI 在 Ctrl+点击时会将 componentType + props 写入当前工作区配置。
 */
export function WorkspaceComponent({
  componentType,
  label,
  props: componentProps,
  snapshotId,
  navigateOnAdd = false,
  className,
  children,
}: WorkspaceComponentRootProps) {
  const workspaceId = useWorkspaceStore((state) => state.workspace.id);
  const ctrlHeld = useCtrlKeyHeld();

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isPointerCopyModifier(event)) return;
      event.preventDefault();
      event.stopPropagation();
      addComponentToWorkspace(
        workspaceId,
        {
          componentType,
          label,
          props: componentProps,
          snapshotId,
        },
        { activate: navigateOnAdd },
      );
    },
    [componentProps, componentType, label, navigateOnAdd, snapshotId, workspaceId],
  );

  return (
    <div
      className={cn(
        "workspace-component-root",
        ctrlHeld && "workspace-component-root--copy-ready",
        className,
      )}
      data-workspace-component={componentType}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
