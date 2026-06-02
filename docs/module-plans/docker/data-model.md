# Docker 模块数据模型

本文件定义 Docker 模块的数据侧设计，包括连接来源、能力探测、资源模型、状态枚举、前端类型建议与后端 Rust 结构草案。目标是让不同来源的 Docker 能力最终映射到同一套统一模型上。

参考主文档：[README.md](./README.md)

## 1. 设计原则

- 连接来源可以不同，但前端消费的资源模型必须统一
- 能力差异通过 `capabilities` 显式表达，而不是散落在页面 if/else 中
- 资源模型优先围绕“列表、详情、动作、流式会话”四类场景设计
- 第一阶段允许部分字段为空，但字段名和语义要先定稳
- 所有模型都要能承载环境标签、风险提示和审计上下文，避免生产环境操作被当作普通本地操作处理
- AI 上下文只引用经过脱敏的容器状态、日志片段、Compose 信息和宿主机关联信息，不直接暴露凭据

## 2. 连接来源模型

### 2.1 来源分类

```ts
export type DockerConnectionSource =
  | "local-engine"
  | "remote-engine"
  | "ssh-engine"
  | "panel-adapter";
```

说明：

- `local-engine`：本地 Docker Engine 或 Docker Desktop
- `remote-engine`：远程 Docker Engine API 直连
- `ssh-engine`：通过 SSH 宿主机调用 docker 命令或 socket
- `panel-adapter`：通过 1Panel、宝塔、Portainer 等面板 API 适配

### 2.2 面板类型

```ts
export type DockerPanelType = "1panel" | "baota" | "portainer";
```

### 2.3 连接配置模型

```ts
export type DockerConnectionConfig = {
  source: DockerConnectionSource;
  host?: string;
  port?: number;
  tls?: boolean;
  tlsVerify?: boolean;
  sshConnectionId?: string;
  panelConnectionId?: string;
  panelType?: DockerPanelType;
  socketPath?: string;
  apiBaseUrl?: string;
  engineVersion?: string;
  composeMode?: "docker compose" | "docker-compose" | "panel-managed" | "unknown";
  swarmEnabled?: boolean;
};
```

### 2.4 连接信息模型

```ts
export type DockerConnectionInfo = {
  connectionId: string;
  name: string;
  source: DockerConnectionSource;
  status: "online" | "degraded" | "offline";
  hostLabel: string;
  environment: "prod" | "staging" | "dev" | "local" | "unknown";
  engineVersion?: string | null;
  apiVersion?: string | null;
  composeMode?: string | null;
  swarmEnabled: boolean;
  lastCheckedAt?: string | null;
  warningMessage?: string | null;
  boundServerConnectionId?: string | null;
  boundSshConnectionId?: string | null;
};
```

`boundServerConnectionId` 与 `boundSshConnectionId` 是 Docker 模块与 Server / SSH 模块贯通上下文的关键字段。第一阶段可以为空，但数据结构必须预留，便于后续从容器异常跳转宿主机监控、终端、文件和 AI 排障。

## 3. 能力探测模型

### 3.1 设计目标

不同来源的 Docker 连接在能力上可能不完全一致。前端不应猜测能力，而应根据后端探测结果决定：

- 某个页签是否显示
- 某个动作是否可点
- 某个字段是否展示
- 某个来源是否降级为只读模式

### 3.2 能力模型

```ts
export type DockerCapabilities = {
  canOverview: boolean;
  canCompose: boolean;
  canComposeEdit: boolean;
  canComposeLogs: boolean;
  canContainerExec: boolean;
  canStreamLogs: boolean;
  canInspect: boolean;
  canManageContainers: boolean;
  canManageImages: boolean;
  canManageVolumes: boolean;
  canManageNetworks: boolean;
  canPushImages: boolean;
  canPullImages: boolean;
  canPrune: boolean;
  canEvents: boolean;
  readOnly: boolean;
  source: DockerConnectionSource;
  missingReasons?: string[];
};
```

### 3.3 前端使用规则

- `readOnly = true` 时，所有 destructive 动作显示但禁用，并说明原因
- `canCompose = false` 时，隐藏或灰置 Compose 页签
- `canContainerExec = false` 时，容器详情中不显示终端入口
- `canEvents = false` 时，总览的最近事件区块退化为“能力暂不可用”

## 4. 顶层总览模型

```ts
export type DockerOverview = {
  connection: DockerConnectionInfo;
  capabilities: DockerCapabilities;
  summary: {
    projects: number;
    containersTotal: number;
    containersRunning: number;
    containersStopped: number;
    containersUnhealthy: number;
    images: number;
    volumes: number;
    networks: number;
  };
  anomalies: DockerAnomaly[];
  recentEvents: DockerEvent[];
  quickActions: DockerQuickAction[];
};
```

### 4.1 异常项模型

```ts
export type DockerAnomaly = {
  id: string;
  kind: "container" | "project" | "image" | "volume" | "network" | "connection";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  resourceId?: string | null;
  resourceName?: string | null;
  suggestedAction?: string | null;
};
```

### 4.2 快捷动作模型

```ts
export type DockerQuickAction = {
  key: "refresh" | "open-ssh" | "open-server" | "pull-image" | "prune" | "open-events";
  label: string;
  enabled: boolean;
  reason?: string | null;
};
```

## 5. Compose 资源模型

### 5.1 列表项

```ts
export type DockerProjectStatus =
  | "running"
  | "partial"
  | "stopped"
  | "degraded"
  | "unknown";

export type DockerProjectListItem = {
  id: string;
  name: string;
  status: DockerProjectStatus;
  serviceCount: number;
  containerCount: number;
  runningContainerCount: number;
  sourcePath?: string | null;
  workingDir?: string | null;
  updatedAt?: string | null;
  tags?: string[];
};
```

### 5.2 详情模型

```ts
export type DockerProjectDetail = {
  project: DockerProjectListItem;
  services: DockerProjectService[];
  containers: DockerContainerListItem[];
  composeFiles: string[];
  environmentFiles: string[];
  environment: Array<{ key: string; value: string; masked?: boolean }>;
  yamlText?: string | null;
};

export type DockerProjectService = {
  name: string;
  image?: string | null;
  replicas?: number | null;
  runningReplicas?: number | null;
  ports: string[];
  dependsOn: string[];
  status: DockerProjectStatus;
};
```

## 6. 容器资源模型

### 6.1 容器状态

```ts
export type DockerContainerLifecycle =
  | "created"
  | "running"
  | "paused"
  | "restarting"
  | "exited"
  | "dead"
  | "unknown";

export type DockerHealthStatus = "healthy" | "unhealthy" | "starting" | "none" | "unknown";
```

### 6.2 列表项

```ts
export type DockerContainerListItem = {
  id: string;
  shortId: string;
  name: string;
  image: string;
  imageId?: string | null;
  projectName?: string | null;
  serviceName?: string | null;
  lifecycle: DockerContainerLifecycle;
  health: DockerHealthStatus;
  statusText: string;
  cpuPercent?: number | null;
  memoryUsageBytes?: number | null;
  memoryLimitBytes?: number | null;
  ports: DockerPortBinding[];
  networks: string[];
  createdAt?: string | null;
  startedAt?: string | null;
  labels?: Record<string, string>;
};
```

### 6.3 详情模型

```ts
export type DockerContainerDetail = {
  container: DockerContainerListItem;
  env: Array<{ key: string; value: string; masked?: boolean }>;
  mounts: DockerMount[];
  networks: DockerContainerNetwork[];
  command?: string | null;
  entrypoint?: string | null;
  restartPolicy?: string | null;
  exitCode?: number | null;
  oomKilled?: boolean | null;
  inspectJson?: string | null;
};

export type DockerMount = {
  type: "bind" | "volume" | "tmpfs" | "npipe" | "unknown";
  source: string;
  destination: string;
  readOnly: boolean;
  volumeName?: string | null;
};

export type DockerContainerNetwork = {
  name: string;
  ipAddress?: string | null;
  gateway?: string | null;
  aliases?: string[];
};
```

### 6.4 端口模型

```ts
export type DockerPortBinding = {
  containerPort: string;
  hostIp?: string | null;
  hostPort?: string | null;
  protocol: "tcp" | "udp" | "sctp" | "unknown";
};
```

## 7. 镜像资源模型

```ts
export type DockerImageListItem = {
  id: string;
  shortId: string;
  repository: string;
  tag: string;
  digest?: string | null;
  sizeBytes?: number | null;
  createdAt?: string | null;
  usedByContainerCount?: number | null;
  dangling: boolean;
};

export type DockerImageDetail = {
  image: DockerImageListItem;
  repoTags: string[];
  repoDigests: string[];
  labels?: Record<string, string>;
  architecture?: string | null;
  os?: string | null;
  layers?: string[];
};
```

## 8. 卷资源模型

```ts
export type DockerVolumeListItem = {
  name: string;
  driver: string;
  scope?: string | null;
  mountpoint?: string | null;
  createdAt?: string | null;
  labels?: Record<string, string>;
  attachedContainerCount?: number | null;
};

export type DockerVolumeDetail = {
  volume: DockerVolumeListItem;
  options?: Record<string, string>;
  attachedContainers: Array<{ id: string; name: string; destination?: string | null }>;
};
```

## 9. 网络资源模型

```ts
export type DockerNetworkListItem = {
  id: string;
  shortId: string;
  name: string;
  driver: string;
  scope?: string | null;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  createdAt?: string | null;
  connectedContainerCount?: number | null;
};

export type DockerNetworkDetail = {
  network: DockerNetworkListItem;
  subnets: Array<{ subnet?: string | null; gateway?: string | null }>;
  labels?: Record<string, string>;
  options?: Record<string, string>;
  connectedContainers: Array<{ id: string; name: string; ipv4?: string | null; ipv6?: string | null }>;
};
```

## 10. 日志、终端、事件模型

### 10.1 日志会话

```ts
export type DockerLogsSession = {
  sessionId: string;
  scope: "container" | "project";
  connectionId: string;
  targetId: string;
  follow: boolean;
  since?: string | null;
  tail?: number | null;
};
```

### 10.2 exec 会话

```ts
export type DockerExecSession = {
  sessionId: string;
  connectionId: string;
  containerId: string;
  shell: string;
  user?: string | null;
  tty: boolean;
};
```

### 10.3 事件模型

```ts
export type DockerEvent = {
  id: string;
  time: string;
  type: "container" | "image" | "network" | "volume" | "project" | "system";
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  message: string;
  attributes?: Record<string, string>;
};
```

## 11. 动作模型

Docker 相关动作应与现有审计与风险控制体系兼容。

```ts
export type DockerActionKind =
  | "project-up"
  | "project-down"
  | "project-restart"
  | "project-pull"
  | "container-start"
  | "container-stop"
  | "container-restart"
  | "container-remove"
  | "image-pull"
  | "image-remove"
  | "image-prune"
  | "volume-remove"
  | "volume-prune"
  | "network-remove";
```

## 12. 前端状态模型建议

```ts
export type DockerWorkspaceTab =
  | "overview"
  | "compose"
  | "containers"
  | "images"
  | "volumes"
  | "networks";

export type DockerWorkspaceState = {
  activeConnectionId: string | null;
  activeTab: DockerWorkspaceTab;
  query: string;
  composeFilter?: DockerProjectStatus | "all";
  containerFilter?: DockerContainerLifecycle | "all";
  imageFilter?: "all" | "dangling" | "used";
  selectedComposeId?: string | null;
  selectedContainerId?: string | null;
  selectedImageId?: string | null;
  selectedVolumeName?: string | null;
  selectedNetworkId?: string | null;
};
```

## 13. Rust 结构草案

```rust
pub enum DockerConnectionSource {
    LocalEngine,
    RemoteEngine,
    SshEngine,
    PanelAdapter,
}

pub struct DockerCapabilities {
    pub can_overview: bool,
    pub can_compose: bool,
    pub can_compose_edit: bool,
    pub can_compose_logs: bool,
    pub can_container_exec: bool,
    pub can_stream_logs: bool,
    pub can_inspect: bool,
    pub can_manage_containers: bool,
    pub can_manage_images: bool,
    pub can_manage_volumes: bool,
    pub can_manage_networks: bool,
    pub can_push_images: bool,
    pub can_pull_images: bool,
    pub can_prune: bool,
    pub can_events: bool,
    pub read_only: bool,
}

pub struct DockerOverview {
    pub connection: DockerConnectionInfo,
    pub capabilities: DockerCapabilities,
    pub summary: DockerSummary,
    pub anomalies: Vec<DockerAnomaly>,
    pub recent_events: Vec<DockerEvent>,
}
```

第一阶段无需一次实现所有字段，但命名和整体边界应尽量保持稳定。

## 14. 字段落地策略

### 14.1 第一阶段必须稳定的字段

- 连接来源
- 能力探测结果
- 容器列表主键与状态
- Compose 项目主键与状态
- 镜像主键与基本标签
- 卷名与网络名

### 14.2 第一阶段允许为空的字段

- 容器 CPU / 内存实时统计
- Compose YAML 文本
- 镜像 layers
- 卷创建时间
- 网络高级 options

### 14.3 统一规则

- 所有 ID 字段保持字符串类型
- 时间字段优先统一为 ISO 字符串
- 大数字优先使用 `bytes` 原始值，展示格式交给前端
- 原始 inspect/json 可作为补充字段，不应替代结构化字段

## 15. 来源映射策略

### 15.1 local-engine

- 字段最完整
- 适合作为统一模型的基准来源

### 15.2 ssh-engine

- 第一阶段可通过 CLI 输出来映射
- 个别字段可能缺失，如精细统计、时间格式一致性需二次整理

### 15.3 remote-engine

- 结构接近 local-engine
- 需补充 TLS、连接状态与错误映射

### 15.4 panel-adapter

- 资源字段完整性取决于面板 API
- 必须通过 `capabilities` 明确标出缺失能力
- 不允许前端默认假设 panel-adapter 一定支持所有原生 Docker 行为
