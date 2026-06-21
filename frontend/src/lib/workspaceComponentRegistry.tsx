import type { ReactNode } from "react";
import { LocalFilePanel } from "@/components/files";
import { SftpPanel } from "@/components/sftp";
import { TunnelPanel } from "@/components/tunnel";
import { AdvanceTerminalMonitorStack } from "@/modules/terminal/AdvanceTerminalMonitorStack";
import { useConnectionStore } from "@/stores/connectionStore";
import {
  createWorkspaceComponentRegistry,
  getWorkspaceComponentDefinition,
  registerWorkspaceComponent,
  type WorkspaceComponentProps,
  type WorkspaceComponentRegistry,
} from "./workspaceComponentTypes";

/** 全局工作区组件注册表 */
export const workspaceComponentRegistry = createWorkspaceComponentRegistry();

function registerBuiltinWorkspaceComponents(registry: WorkspaceComponentRegistry): void {
  registerWorkspaceComponent(registry, {
    type: "files.local-panel",
    defaultLabel: "本地文件",
    previewKind: "fallback",
    render: (props) => (
      <LocalFilePanel initialPath={typeof props.initialPath === "string" ? props.initialPath : undefined} />
    ),
  });

  registerWorkspaceComponent(registry, {
    type: "terminal.side.monitor-local",
    defaultLabel: "终端监控",
    previewKind: "fallback",
    render: () => <AdvanceTerminalMonitorStack mode="local" />,
  });

  registerWorkspaceComponent(registry, {
    type: "ssh.detail.sftp",
    defaultLabel: "SFTP",
    previewKind: "fallback",
    render: (props) => {
      const resourceId = typeof props.resourceId === "string" ? props.resourceId : "";
      if (!resourceId) return null;
      return <SftpPanel resourceId={resourceId} />;
    },
  });

  registerWorkspaceComponent(registry, {
    type: "ssh.detail.tunnel",
    defaultLabel: "隧道",
    previewKind: "fallback",
    render: (props) => {
      const resourceId = typeof props.resourceId === "string" ? props.resourceId : "";
      const resource = useConnectionStore.getState().connections.find((c) => c.id === resourceId);
      if (!resource) return null;
      return <TunnelPanel activeResource={resource} />;
    },
  });

  registerWorkspaceComponent(registry, {
    type: "terminal.side.monitor-remote",
    defaultLabel: "进程监控",
    previewKind: "fallback",
    render: (props) => {
      const resourceId = typeof props.resourceId === "string" ? props.resourceId : "";
      if (!resourceId) return null;
      return (
        <AdvanceTerminalMonitorStack
          mode="remote"
          resourceId={resourceId}
          enableTunnels
        />
      );
    },
  });
}

registerBuiltinWorkspaceComponents(workspaceComponentRegistry);

export function renderWorkspaceComponent(
  componentType: string,
  props: WorkspaceComponentProps,
): ReactNode {
  const def = getWorkspaceComponentDefinition(workspaceComponentRegistry, componentType);
  if (!def) return null;
  return def.render(props);
}

export function resolveWorkspaceComponentPreviewKind(
  componentType: string,
): import("./workspaceTabPreview").WorkspacePreviewKind {
  const def = getWorkspaceComponentDefinition(workspaceComponentRegistry, componentType);
  return def?.previewKind ?? "fallback";
}

/** 模块子面板快捷注册 key：module.{moduleKey}.segment.{segmentId} */
export function moduleSegmentComponentType(moduleKey: string, segmentId: string): string {
  return `module.${moduleKey}.segment.${segmentId}`;
}
