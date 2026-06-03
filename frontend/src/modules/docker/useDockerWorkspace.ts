import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { commands } from "../../ipc/bindings";
import type {
  DockerComposeProject,
  DockerConnectionInfo,
  DockerContainerDetail,
  DockerContainerSummary,
  DockerImageSummary,
  DockerLogLine,
  DockerOverview,
  DockerProbe,
} from "../../ipc/bindings";

export type ContainerFilter = "all" | "running" | "stopped";

export interface DockerActionResult {
  ok: boolean;
  message?: string;
}

interface DockerWorkspaceState {
  connections: DockerConnectionInfo[];
  selectedConnectionId: string | null;
  probe: DockerProbe | null;
  overview: DockerOverview | null;
  containers: DockerContainerSummary[];
  images: DockerImageSummary[];
  composeProjects: DockerComposeProject[];
  connectionsLoading: boolean;
  dataLoading: boolean;
  error: string | null;
}

/** 统一处理 typedError 结果，返回数据或抛出消息。 */
async function unwrap<T>(promise: Promise<{ status: "ok"; data: T } | { status: "error"; error: { message: string } }>): Promise<T> {
  const res = await promise;
  if (res.status === "ok") return res.data;
  throw new Error(res.error.message);
}

/**
 * Docker 工作区数据入口：统一管理连接、探测、容器/镜像/Compose 列表与生命周期动作。
 * 所有数据来自真实 IPC（omnipanel-docker），不再依赖 mock。
 */
export function useDockerWorkspace() {
  const [state, setState] = useState<DockerWorkspaceState>({
    connections: [],
    selectedConnectionId: null,
    probe: null,
    overview: null,
    containers: [],
    images: [],
    composeProjects: [],
    connectionsLoading: true,
    dataLoading: false,
    error: null,
  });

  // 用 ref 保存当前选中连接，避免闭包捕获过期值。
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = state.selectedConnectionId;

  const loadConnections = useCallback(async () => {
    setState((s) => ({ ...s, connectionsLoading: true }));
    try {
      const connections = await unwrap(commands.dockerListConnections());
      setState((s) => {
        const stillValid = connections.some((c) => c.connectionId === s.selectedConnectionId);
        return {
          ...s,
          connections,
          selectedConnectionId: stillValid ? s.selectedConnectionId : connections[0]?.connectionId ?? null,
          connectionsLoading: false,
        };
      });
    } catch (e) {
      setState((s) => ({ ...s, connectionsLoading: false, error: String(e) }));
    }
  }, []);

  /** 加载选中连接的探测、总览、容器、镜像、Compose。 */
  const loadConnectionData = useCallback(async (connectionId: string) => {
    setState((s) => ({ ...s, dataLoading: true, error: null }));

    // 先探测连通性。
    let probe: DockerProbe | null = null;
    try {
      probe = await unwrap(commands.dockerProbeConnection(connectionId));
    } catch (e) {
      setState((s) => ({
        ...s,
        probe: null,
        overview: null,
        containers: [],
        images: [],
        composeProjects: [],
        dataLoading: false,
        error: String(e),
      }));
      return;
    }

    if (selectedRef.current !== connectionId) return;

    // 把探测得到的状态/版本回填到连接列表。
    setState((s) => ({
      ...s,
      probe,
      connections: s.connections.map((c) =>
        c.connectionId === connectionId
          ? {
              ...c,
              status: probe!.status,
              engineVersion: probe!.engineVersion,
              apiVersion: probe!.apiVersion,
              warningMessage: probe!.warningMessage,
            }
          : c
      ),
    }));

    if (probe.status === "offline") {
      setState((s) => ({
        ...s,
        overview: null,
        containers: [],
        images: [],
        composeProjects: [],
        dataLoading: false,
        error: probe?.warningMessage ?? "Docker 未安装或未启动",
      }));
      return;
    }

    // 并行拉取业务数据；单项失败不阻断其余。
    const [overview, containers, images, composeProjects] = await Promise.all([
      unwrap(commands.dockerGetOverview(connectionId)).catch(() => null),
      unwrap(commands.dockerListContainers(connectionId, null)).catch(() => []),
      unwrap(commands.dockerListImages(connectionId)).catch(() => []),
      unwrap(commands.dockerListComposeProjects(connectionId)).catch(() => []),
    ]);

    if (selectedRef.current !== connectionId) return;
    setState((s) => ({
      ...s,
      overview,
      containers,
      images,
      composeProjects,
      dataLoading: false,
    }));
  }, []);

  // 初始化加载连接列表。
  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  // 选中连接变化时加载数据。
  useEffect(() => {
    if (state.selectedConnectionId) {
      void loadConnectionData(state.selectedConnectionId);
    }
  }, [state.selectedConnectionId, loadConnectionData]);

  const selectConnection = useCallback((id: string) => {
    setState((s) => (s.selectedConnectionId === id ? s : { ...s, selectedConnectionId: id }));
  }, []);

  const refresh = useCallback(() => {
    const id = selectedRef.current;
    if (id) void loadConnectionData(id);
  }, [loadConnectionData]);

  /** 仅刷新容器列表（动作后轻量刷新）。 */
  const refreshContainers = useCallback(async () => {
    const id = selectedRef.current;
    if (!id) return;
    try {
      const containers = await unwrap(commands.dockerListContainers(id, null));
      if (selectedRef.current === id) setState((s) => ({ ...s, containers }));
    } catch {
      /* 忽略，保留旧数据 */
    }
  }, []);

  const containerAction = useCallback(
    async (containerId: string, action: string): Promise<DockerActionResult> => {
      const id = selectedRef.current;
      if (!id) return { ok: false, message: "未选择连接" };
      try {
        await unwrap(commands.dockerContainerAction(id, containerId, action));
        await refreshContainers();
        return { ok: true };
      } catch (e) {
        return { ok: false, message: String(e) };
      }
    },
    [refreshContainers]
  );

  const inspect = useCallback(
    async (containerId: string): Promise<DockerContainerDetail | null> => {
      const id = selectedRef.current;
      if (!id) return null;
      try {
        return await unwrap(commands.dockerInspectContainer(id, containerId));
      } catch {
        return null;
      }
    },
    []
  );

  const removeImage = useCallback(
    async (imageId: string, force: boolean): Promise<DockerActionResult> => {
      const id = selectedRef.current;
      if (!id) return { ok: false, message: "未选择连接" };
      try {
        await unwrap(commands.dockerRemoveImage(id, imageId, force));
        const images = await unwrap(commands.dockerListImages(id)).catch(() => state.images);
        setState((s) => ({ ...s, images }));
        return { ok: true };
      } catch (e) {
        return { ok: false, message: String(e) };
      }
    },
    [state.images]
  );

  const pruneImages = useCallback(async (): Promise<DockerActionResult> => {
    const id = selectedRef.current;
    if (!id) return { ok: false, message: "未选择连接" };
    try {
      const result = await unwrap(commands.dockerPruneImages(id));
      refresh();
      const freed = (result.freedSpaceBytes ?? 0) / 1_000_000;
      return { ok: true, message: `已释放约 ${freed.toFixed(1)} MB，删除 ${result.deleted.length} 项` };
    } catch (e) {
      return { ok: false, message: String(e) };
    }
  }, [refresh]);

  const selectedConnection =
    state.connections.find((c) => c.connectionId === state.selectedConnectionId) ?? null;

  return {
    ...state,
    selectedConnection,
    selectConnection,
    refresh,
    refreshContainers,
    containerAction,
    inspect,
    removeImage,
    pruneImages,
    reloadConnections: loadConnections,
  };
}

/**
 * 容器日志流：开始跟随后通过 `docker-log` 事件累积行，`docker-log-end` 结束。
 * 组件卸载或切换容器时自动停止后端流。
 */
export function useContainerLogStream(
  connectionId: string | null,
  containerId: string | null,
  active: boolean,
  follow: boolean,
  tail = 200
) {
  const [lines, setLines] = useState<DockerLogLine[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !connectionId || !containerId) return;

    let disposed = false;
    let unlistenLog: (() => void) | null = null;
    let unlistenEnd: (() => void) | null = null;

    setLines([]);
    setError(null);
    setStreaming(true);

    const start = async () => {
      try {
        unlistenLog = await listen<{ streamId: string; stream: string; message: string }>(
          "docker-log",
          (event) => {
            if (event.payload.streamId !== streamIdRef.current) return;
            setLines((prev) => {
              const next = [...prev, { stream: event.payload.stream, message: event.payload.message }];
              return next.length > 2000 ? next.slice(next.length - 2000) : next;
            });
          }
        );
        unlistenEnd = await listen<{ streamId: string; error: string | null }>(
          "docker-log-end",
          (event) => {
            if (event.payload.streamId !== streamIdRef.current) return;
            setStreaming(false);
            if (event.payload.error) setError(event.payload.error);
          }
        );

        const res = await commands.dockerStreamContainerLogs(connectionId, containerId, tail, follow);
        if (res.status === "ok") {
          if (disposed) {
            void commands.dockerStopLogStream(res.data);
          } else {
            streamIdRef.current = res.data;
          }
        } else {
          setError(res.error.message);
          setStreaming(false);
        }
      } catch (e) {
        setError(String(e));
        setStreaming(false);
      }
    };

    void start();

    return () => {
      disposed = true;
      if (streamIdRef.current) {
        void commands.dockerStopLogStream(streamIdRef.current);
        streamIdRef.current = null;
      }
      unlistenLog?.();
      unlistenEnd?.();
    };
  }, [connectionId, containerId, active, follow, tail]);

  return { lines, streaming, error };
}
