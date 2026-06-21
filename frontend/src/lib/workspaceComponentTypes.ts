import type { ComponentType, ReactNode } from "react";
import type { WorkspacePreviewKind } from "./workspaceTabPreview";

/** 可序列化的工作区组件 props（JSON 兼容） */
export type WorkspaceComponentProps = Record<string, unknown>;

/** 工作区组件快照：保存渲染所需 type + props，持久化到工作区配置 */
export type ComponentSnapshot = {
  module: "component";
  id: string;
  label: string;
  componentType: string;
  props: WorkspaceComponentProps;
};

export interface WorkspaceComponentDefinition {
  type: string;
  /** 默认标题（可被快照 label 覆盖） */
  defaultLabel?: string;
  previewKind?: WorkspacePreviewKind;
  render: (props: WorkspaceComponentProps) => ReactNode;
}

export function isComponentSnapshot(
  snapshot: { module: string },
): snapshot is ComponentSnapshot {
  return snapshot.module === "component";
}

/** 根据 type + props 生成稳定 id */
export function buildComponentSnapshotId(
  componentType: string,
  props: WorkspaceComponentProps,
  explicitId?: string,
): string {
  if (explicitId) return explicitId;
  const sorted = JSON.stringify(props, Object.keys(props).sort());
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    hash = (Math.imul(31, hash) + sorted.charCodeAt(i)) | 0;
  }
  return `${componentType}:${Math.abs(hash).toString(36)}`;
}

export function buildComponentSnapshot(input: {
  componentType: string;
  label: string;
  props?: WorkspaceComponentProps;
  snapshotId?: string;
}): ComponentSnapshot {
  const props = input.props ?? {};
  return {
    module: "component",
    id: buildComponentSnapshotId(input.componentType, props, input.snapshotId),
    label: input.label,
    componentType: input.componentType,
    props,
  };
}

export type WorkspaceComponentRegistry = Map<string, WorkspaceComponentDefinition>;

export function createWorkspaceComponentRegistry(): WorkspaceComponentRegistry {
  return new Map();
}

export function registerWorkspaceComponent(
  registry: WorkspaceComponentRegistry,
  def: WorkspaceComponentDefinition,
): void {
  registry.set(def.type, def);
}

export function getWorkspaceComponentDefinition(
  registry: WorkspaceComponentRegistry,
  type: string,
): WorkspaceComponentDefinition | undefined {
  return registry.get(type);
}

export type { ComponentType };
