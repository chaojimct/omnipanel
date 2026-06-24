import { type ReactNode } from "react";

import type { WorkspaceComponentProps as SerializableProps } from "../../lib/workspaceComponentTypes";
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
  className?: string;
  children: ReactNode;
}

/** 工作区可注册组件根节点（保留 data 属性供预览/注册表使用）。 */
export function WorkspaceComponent({
  componentType,
  className,
  children,
}: WorkspaceComponentRootProps) {
  return (
    <div
      className={cn("workspace-component-root", className)}
      data-workspace-component={componentType}
    >
      {children}
    </div>
  );
}
