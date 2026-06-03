# Server 模块数据模型

本文件定义 Server 模块的数据侧设计，包括连接来源、数据采集方式、资源模型、状态枚举、前端类型建议与后端 Rust 结构草案。

参考主文档：[README.md](./README.md)

## 1. 设计原则

- 连接来源可以不同，但前端消费的资源模型必须统一
- SSH 直连采集和面板 API 采集最终映射到同一套数据结构
- 监控指标优先围绕"实时值、历史序列、告警阈值"三类场景设计
- 第一阶段允许部分字段为空，但字段名和语义要先定稳

## 2. 连接来源模型

### 2.1 来源分类

```ts
export type ServerConnectionSource =
  | "ssh-direct"
  | "1panel"
  | "baota";
```

说明：

- `ssh-direct`：通过 SSH 直连执行系统命令采集数据
- `1panel`：通过 1Panel API 获取服务器数据
- `baota`：通过宝塔面板 API 获取服务器数据

### 2.2 连接配置模型

```ts
export type ServerConnectionConfig = {
  source: ServerConnectionSource;
  sshConnectionId?: string;
  panelHost?: string;
  panelApiToken?: string;
  panelApiKey?: string;
  tlsVerify?: boolean;
};
```

### 2.3 服务器信息模型

```ts
export type ServerConnectionInfo = {
  connectionId: string;
  name: string;
  source: ServerConnectionSource;
  status: "online" | "degraded" | "offline" | "unknown";
  hostLabel: string;
  ipAddress?: string | null;
  sshPort?: number | null;
  osVersion?: string | null;
  kernelVersion?: string | null;
  hostname?: string | null;
  region?: string | null;
  environment?: "prod" | "staging" | "dev" | "local" | "unknown";
  lastCheckedAt?: string | null;
  boundDockerConnectionId?: string | null;
  warningMessage?: string | null;
};
```

## 3. 数据采集模型

### 3.1 采集方式

```ts
export type ServerDataCollectionMethod =
  | "ssh-command"
  | "panel-api";
```

### 3.2 采集命令映射（SSH 直连）

| 数据类型 | 采集命令 | 说明 |
|----------|----------|------|
| CPU 使用率 | `top -bn1 \| grep "Cpu(s)"` | 实时 CPU |
| 内存使用 | `free -m` | 内存总量/使用量 |
| 磁盘使用 | `df -h` | 各分区使用情况 |
| 网络 IO | `cat /proc/net/dev` | 网络流量统计 |
| 进程列表 | `ps aux --sort=-%cpu` | 按 CPU 排序 |
| 服务状态 | `systemctl list-units --type=service --state=running` | 运行中服务 |
| 系统日志 | `journalctl -n 100 --no-pager` | 最近日志 |
| 系统信息 | `uname -a` / `cat /etc/os-release` | OS 版本信息 |

### 3.3 面板 API 映射

| 面板 | API 端点 | 数据类型 |
|------|----------|----------|
| 1Panel | `/api/v1/monitor`* | 系统监控 |
| 1Panel | `/api/v1/containers` | Docker 容器 |
| 1Panel | `/api/v1/websites` | 网站 |
| 1Panel | `/api/v1/crons` | 计划任务 |
| 宝塔 | `/api/panel?action=getSystemTotal` | 系统总览 |
| 宝塔 | `/api/panel?action=getTaskList` | 任务列表 |

## 4. 监控数据模型

### 4.1 实时监控模型

```ts
export type ServerMetricsSnapshot = {
  connectionId: string;
  timestamp: string;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics[];
  network: NetworkMetrics[];
  load: LoadMetrics;
};

export type CpuMetrics = {
  usagePercent: number;
  userPercent: number;
  systemPercent: number;
  idlePercent: number;
  coreCount: number;
  frequencyMhz?: number | null;
  modelName?: string | null;
};

export type MemoryMetrics = {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  availableBytes: number;
  usagePercent: number;
  swapTotalBytes?: number | null;
  swapUsedBytes?: number | null;
};

export type DiskMetrics = {
  device: string;
  mountPoint: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
  filesystem: string;
};

export type NetworkMetrics = {
  interface: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors?: number | null;
  txErrors?: number | null;
};

export type LoadMetrics = {
  load1: number;
  load5: number;
  load15: number;
  runnableProcesses: number;
  totalProcesses: number;
};
```

### 4.2 历史数据模型

```ts
export type ServerMetricsHistoryPoint = {
  timestamp: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  diskUsagePercent: number;
  networkRxBytesPerSec?: number | null;
  networkTxBytesPerSec?: number | null;
};

export type ServerMetricsHistory = {
  connectionId: string;
  range: "24h" | "7d" | "30d";
  points: ServerMetricsHistoryPoint[];
  granularity: number;
};
```

### 4.3 告警模型

```ts
export type ServerAlertRule = {
  id: string;
  connectionId: string;
  metric: "cpu" | "memory" | "disk" | "load";
  threshold: number;
  condition: "gt" | "lt" | "eq";
  durationSeconds: number;
  severity: "info" | "warning" | "critical";
  enabled: boolean;
  message?: string | null;
};

export type ServerAlert = {
  id: string;
  ruleId: string;
  connectionId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: "info" | "warning" | "critical";
  message: string;
  triggeredAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
};
```

## 5. 进程资源模型

### 5.1 进程状态

```ts
export type ProcessState =
  | "running"
  | "sleeping"
  | "disk-sleep"
  | "zombie"
  | "stopped"
  | "tracing-stop"
  | "paging"
  | "dead"
  | "wake-kill"
  | "waking"
  | "idle"
  | "unknown";
```

### 5.2 进程列表项

```ts
export type ProcessListItem = {
  pid: number;
  name: string;
  user: string;
  cpuPercent: number;
  memoryPercent: number;
  memoryRssBytes: number;
  state: ProcessState;
  command: string;
  startTime?: string | null;
  tty?: string | null;
};
```

### 5.3 进程统计

```ts
export type ProcessStats = {
  connectionId: string;
  timestamp: string;
  totalCount: number;
  runningCount: number;
  sleepingCount: number;
  zombieCount: number;
  topCpuProcesses: ProcessListItem[];
  topMemoryProcesses: ProcessListItem[];
};
```

## 6. 服务资源模型

### 6.1 服务状态

```ts
export type ServiceStatus =
  | "active"
  | "inactive"
  | "failed"
  | "activating"
  | "deactivating"
  | "unknown";
```

### 6.2 服务单元

```ts
export type ServiceUnit = {
  name: string;
  description?: string | null;
  status: ServiceStatus;
  loadState?: string | null;
  activeState?: string | null;
  subState?: string | null;
  mainPid?: number | null;
  memoryUsageBytes?: number | null;
  cpuUsagePercent?: number | null;
  lastTriggeredAt?: string | null;
};
```

## 7. 日志资源模型

### 7.1 日志级别

```ts
export type LogLevel = "emerg" | "alert" | "crit" | "error" | "warn" | "notice" | "info" | "debug";
```

### 7.2 日志条目

```ts
export type LogEntry = {
  id: string;
  timestamp: string;
  hostname?: string | null;
  unit?: string | null;
  pid?: number | null;
  level: LogLevel;
  message: string;
  cursor?: string | null;
};

export type LogFilter = {
  levels?: LogLevel[];
  units?: string[];
  since?: string | null;
  until?: string | null;
  cursor?: string | null;
  grep?: string | null;
};
```

### 7.3 日志会话

```ts
export type LogSession = {
  sessionId: string;
  connectionId: string;
  filter: LogFilter;
  follow: boolean;
  createdAt: string;
};
```

## 8. 面板资源模型

### 8.1 面板能力探测

```ts
export type PanelCapabilities = {
  source: ServerConnectionSource;
  version?: string | null;
  canMonitor: boolean;
  canContainers: boolean;
  canWebsites: boolean;
  canDatabases: boolean;
  canCronjobs: boolean;
  canSSL: boolean;
  canFirewall: boolean;
  canProcess: boolean;
  canService: boolean;
  readOnly: boolean;
  missingReasons?: string[];
};
```

### 8.2 网站资源

```ts
export type PanelWebsite = {
  id: string;
  name: string;
  domain: string;
  status: "running" | "stopped" | "unknown";
  sslEnabled: boolean;
  sslExpireAt?: string | null;
  createTime?: string | null;
  primaryDomain?: string | null;
  aliasDomains?: string[];
  remark?: string | null;
};
```

### 8.3 数据库资源

```ts
export type PanelDatabase = {
  id: string;
  name: string;
  type: "mysql" | "postgresql" | "mongodb" | "redis" | "unknown";
  status: "running" | "stopped" | "unknown";
  sizeBytes?: number | null;
  createTime?: string | null;
  username?: string | null;
};
```

### 8.4 计划任务资源

```ts
export type PanelCronjob = {
  id: string;
  name: string;
  type: "backup" | "shell" | "url" | "log" | "unknown";
  status: "enabled" | "disabled" | "unknown";
  schedule: string;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  lastRunStatus?: "success" | "failed" | "unknown" | null;
};
```

### 8.5 SSL 证书资源

```ts
export type PanelCertificate = {
  id: string;
  domain: string;
  provider: "letsencrypt" | "buypass" | "paid" | "selfsigned" | "unknown";
  expireAt: string;
  autoRenew: boolean;
  status: "valid" | "expiring" | "expired" | "unknown";
  issueAt?: string | null;
};
```

## 9. 前端状态模型

```ts
export type ServerWorkspaceTab =
  | "monitor"
  | "processes"
  | "services"
  | "logs"
  | "files"
  | "panel";

export type ServerWorkspaceState = {
  activeConnectionId: string | null;
  activeTab: ServerWorkspaceTab;
  monitorRange: "1h" | "6h" | "24h" | "7d" | "30d";
  processQuery: string;
  processSortBy: "cpu" | "memory" | "name" | "pid";
  processSortOrder: "asc" | "desc";
  logFilter: LogFilter;
  logFollow: boolean;
  selectedServiceName?: string | null;
  selectedPanelResourceType?: "websites" | "databases" | "cronjobs" | "certificates" | null;
};
```

## 10. Rust 结构草案

```rust
pub enum ServerConnectionSource {
    SshDirect,
    Panel1Panel,
    PanelBaota,
}

pub struct ServerConnectionInfo {
    pub connection_id: String,
    pub name: String,
    pub source: ServerConnectionSource,
    pub status: ConnectionStatus,
    pub host_label: String,
}

pub struct CpuMetrics {
    pub usage_percent: f64,
    pub user_percent: f64,
    pub system_percent: f64,
    pub idle_percent: f64,
    pub core_count: u32,
}

pub struct MemoryMetrics {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub available_bytes: u64,
    pub usage_percent: f64,
}

pub struct ServerMetricsSnapshot {
    pub connection_id: String,
    pub timestamp: String,
    pub cpu: CpuMetrics,
    pub memory: MemoryMetrics,
    pub disks: Vec<DiskMetrics>,
    pub networks: Vec<NetworkMetrics>,
}
```

## 11. 字段落地策略

### 11.1 第一阶段必须稳定的字段

- 连接来源和基本信息
- 实时 CPU/内存/磁盘/网络指标
- 进程列表主键和状态
- 服务列表主键和状态
- 日志条目时间和消息

### 11.2 第一阶段允许为空的字段

- 历史监控数据
- 告警规则和告警记录
- 面板资源（网站、数据库、证书）
- 进程详细内存/CPU 统计
- 网络错误计数

### 11.3 统一规则

- 所有 ID 字段保持字符串类型
- 时间字段优先统一为 ISO 字符串
- 大数字优先使用原始字节值，展示格式交给前端
- 百分比统一为 0-100 范围
