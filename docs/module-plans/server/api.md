# Server 模块接口设计

本文件定义 Server 模块的后端接口规范，包括连接管理、监控数据采集、进程服务操作、日志接口等。

参考主文档：[README.md](./README.md)

## 1. 设计原则

- RESTful 风格，使用标准 HTTP 方法
- 实时数据通过 WebSocket 传输
- SSH 直连通过命令执行接口实现
- 面板 API 通过适配器封装
- 统一错误响应格式

## 2. 基础路径

所有 Server 模块接口都以 `/api/server` 为基础路径。

## 3. 连接管理接口

### 3.1 获取所有服务器列表

**GET** `/api/server/connections`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `status` | string | 否 | 过滤状态：`all` / `online` / `offline` / `degraded` |

**成功响应** (200):

```json
{
  "connections": [
    {
      "connectionId": "conn-xxx",
      "name": "staging-api",
      "source": "ssh-direct",
      "status": "online",
      "hostLabel": "staging-api",
      "ipAddress": "192.168.1.100",
      "sshPort": 22,
      "osVersion": "Ubuntu 22.04",
      "kernelVersion": "6.8.0",
      "hostname": "staging-api",
      "environment": "staging",
      "boundDockerConnectionId": "docker-conn-xxx",
      "lastCheckedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

### 3.2 获取单个服务器详情

**GET** `/api/server/connections/{connectionId}`

**成功响应** (200):

```json
{
  "connectionId": "conn-xxx",
  "name": "staging-api",
  "source": "ssh-direct",
  "status": "online",
  "hostLabel": "staging-api",
  "ipAddress": "192.168.1.100",
  "sshPort": 22,
  "osVersion": "Ubuntu 22.04",
  "kernelVersion": "6.8.0",
  "hostname": "staging-api",
  "region": "ap-southeast-1a",
  "environment": "staging",
  "boundDockerConnectionId": "docker-conn-xxx",
  "lastCheckedAt": "2024-01-15T10:30:00Z",
  "warningMessage": null
}
```

### 3.3 创建服务器连接

**POST** `/api/server/connections`

**请求体**:

```json
{
  "name": "new-server",
  "source": "ssh-direct",
  "config": {
    "sshConnectionId": "ssh-conn-xxx"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 服务器名称 |
| `source` | string | 是 | 来源类型：`ssh-direct` / `1panel` / `baota` |
| `config` | object | 是 | 连接配置 |

**成功响应** (201):

```json
{
  "connectionId": "conn-xxx",
  "name": "new-server",
  "status": "online",
  "message": "服务器连接创建成功"
}
```

### 3.4 更新服务器连接

**PUT** `/api/server/connections/{connectionId}`

**请求体**: 同创建连接

**成功响应** (200):

```json
{
  "success": true,
  "message": "服务器连接更新成功"
}
```

### 3.5 删除服务器连接

**DELETE** `/api/server/connections/{connectionId}`

**成功响应** (200):

```json
{
  "success": true,
  "message": "服务器连接删除成功"
}
```

### 3.6 测试连接

**POST** `/api/server/connections/{connectionId}/test`

**成功响应** (200):

```json
{
  "success": true,
  "message": "连接测试成功",
  "osVersion": "Ubuntu 22.04",
  "kernelVersion": "6.8.0",
  "sshVersion": "OpenSSH_8.9"
}
```

## 4. 监控接口

### 4.1 获取实时监控快照

**GET** `/api/server/connections/{connectionId}/metrics/snapshot`

**成功响应** (200):

```json
{
  "connectionId": "conn-xxx",
  "timestamp": "2024-01-15T10:30:00Z",
  "cpu": {
    "usagePercent": 67.1,
    "userPercent": 45.2,
    "systemPercent": 21.9,
    "idlePercent": 32.9,
    "coreCount": 4,
    "frequencyMhz": 2400,
    "modelName": "Intel Xeon E5-2680"
  },
  "memory": {
    "totalBytes": 8589934592,
    "usedBytes": 6658708480,
    "freeBytes": 1342177280,
    "availableBytes": 1931226624,
    "usagePercent": 77.5,
    "swapTotalBytes": 2147483648,
    "swapUsedBytes": 0
  },
  "disks": [
    {
      "device": "/dev/sda1",
      "mountPoint": "/",
      "totalBytes": 107374182400,
      "usedBytes": 98687456256,
      "freeBytes": 8686726144,
      "usagePercent": 91.9,
      "filesystem": "ext4"
    }
  ],
  "networks": [
    {
      "interface": "eth0",
      "rxBytes": 1024000000,
      "txBytes": 512000000,
      "rxPackets": 1250000,
      "txPackets": 980000,
      "rxErrors": 0,
      "txErrors": 0
    }
  ],
  "load": {
    "load1": 2.45,
    "load5": 1.89,
    "load15": 1.52,
    "runnableProcesses": 5,
    "totalProcesses": 234
  }
}
```

### 4.2 获取监控历史数据

**GET** `/api/server/connections/{connectionId}/metrics/history`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `range` | string | 是 | 时间范围：`1h` / `6h` / `24h` / `7d` / `30d` |
| `granularity` | number | 否 | 数据粒度（秒），默认根据 range 自动 |

**成功响应** (200):

```json
{
  "connectionId": "conn-xxx",
  "range": "24h",
  "granularity": 300,
  "points": [
    {
      "timestamp": "2024-01-14T10:30:00Z",
      "cpuUsagePercent": 45.2,
      "memoryUsagePercent": 65.3,
      "diskUsagePercent": 85.1,
      "networkRxBytesPerSec": 51200,
      "networkTxBytesPerSec": 25600
    }
  ]
}
```

### 4.3 获取系统信息

**GET** `/api/server/connections/{connectionId}/system-info`

**成功响应** (200):

```json
{
  "connectionId": "conn-xxx",
  "os": {
    "name": "Ubuntu",
    "version": "22.04",
    "kernel": "6.8.0",
    "hostname": "staging-api",
    "architecture": "x86_64"
  },
  "runtime": {
    "docker": "25.0.3",
    "node": "20.15.1",
    "python": "3.12.2",
    "golang": "1.21.6"
  },
  "uptime": "2024-01-01T00:00:00Z"
}
```

## 5. 进程接口

### 5.1 获取进程列表

**GET** `/api/server/connections/{connectionId}/processes`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `sort` | string | 否 | 排序字段：`cpu` / `memory` / `name` / `pid` |
| `order` | string | 否 | 排序方向：`asc` / `desc` |
| `search` | string | 否 | 搜索关键词 |
| `limit` | number | 否 | 返回数量，默认 100 |

**成功响应** (200):

```json
{
  "processes": [
    {
      "pid": 5678,
      "name": "python3",
      "user": "deploy",
      "cpuPercent": 89.2,
      "memoryPercent": 25.0,
      "memoryRssBytes": 2147483648,
      "state": "running",
      "command": "python3 -m celery worker",
      "startTime": "2024-01-15T08:00:00Z",
      "tty": "pts/0"
    }
  ],
  "total": 234,
  "running": 120,
  "sleeping": 110,
  "zombie": 0
}
```

### 5.2 获取进程详情

**GET** `/api/server/connections/{connectionId}/processes/{pid}`

**成功响应** (200):

```json
{
  "pid": 5678,
  "name": "python3",
  "user": "deploy",
  "cpuPercent": 89.2,
  "memoryPercent": 25.0,
  "memoryRssBytes": 2147483648,
  "state": "running",
  "command": "python3 -m celery worker",
  "cwd": "/opt/app",
  "exe": "/usr/bin/python3",
  "startTime": "2024-01-15T08:00:00Z",
  "openFiles": [
    { "fd": "0", "type": "pipe", "target": "pipe:[12345]" },
    { "fd": "1", "type": "pipe", "target": "pipe:[12346]" }
  ],
  "connections": [
    { "protocol": "tcp", "local": "*:6379", "remote": "*:*", "state": "LISTEN" }
  ]
}
```

### 5.3 终止进程

**POST** `/api/server/connections/{connectionId}/processes/{pid}/kill`

**请求体**:

```json
{
  "signal": "SIGTERM"
}
```

| signal | 说明 |
|--------|------|
| `SIGTERM` | 优雅终止（默认） |
| `SIGKILL` | 强制终止 |
| `SIGINT` | 中断 |

**成功响应** (200):

```json
{
  "success": true,
  "message": "进程终止信号已发送"
}
```

## 6. 服务接口

### 6.1 获取服务列表

**GET** `/api/server/connections/{connectionId}/services`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `status` | string | 否 | 过滤状态：`all` / `active` / `inactive` / `failed` |

**成功响应** (200):

```json
{
  "services": [
    {
      "name": "nginx.service",
      "description": "A high performance web server",
      "status": "active",
      "loadState": "loaded",
      "activeState": "active",
      "subState": "running",
      "mainPid": 1234,
      "memoryUsageBytes": 46137344,
      "cpuUsagePercent": 2.1,
      "lastTriggeredAt": "2024-01-15T09:00:00Z"
    },
    {
      "name": "ml-worker.service",
      "description": "ML training worker",
      "status": "failed",
      "loadState": "loaded",
      "activeState": "failed",
      "subState": "failed",
      "mainPid": 0,
      "lastTriggeredAt": "2024-01-14T18:00:00Z"
    }
  ],
  "total": 45,
  "active": 38,
  "inactive": 5,
  "failed": 2
}
```

### 6.2 获取服务详情

**GET** `/api/server/connections/{connectionId}/services/{serviceName}`

**成功响应** (200):

```json
{
  "name": "nginx.service",
  "description": "A high performance web server",
  "status": "active",
  "loadState": "loaded",
  "activeState": "active",
  "subState": "running",
  "mainPid": 1234,
  "memoryUsageBytes": 46137344,
  "cpuUsagePercent": 2.1,
  "lastTriggeredAt": "2024-01-15T09:00:00Z",
  "journalLog": [
    { "timestamp": "2024-01-15T10:30:00Z", "level": "info", "message": "nginx started" }
  ]
}
```

### 6.3 服务操作

**POST** `/api/server/connections/{connectionId}/services/{serviceName}/actions`

**请求体**:

```json
{
  "action": "restart"
}
```

| action | 说明 |
|--------|------|
| `start` | 启动服务 |
| `stop` | 停止服务 |
| `restart` | 重启服务 |
| `reload` | 重载配置 |

**成功响应** (200):

```json
{
  "success": true,
  "message": "服务重启成功"
}
```

## 7. 日志接口

### 7.1 获取日志

**GET** `/api/server/connections/{connectionId}/logs`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `levels` | string | 否 | 日志级别过滤，逗号分隔：`info,warn,error` |
| `units` | string | 否 | 服务单元过滤 |
| `since` | string | 否 | 开始时间 ISO 字符串 |
| `until` | string | 否 | 结束时间 ISO 字符串 |
| `tail` | number | 否 | 尾部行数，默认 100 |
| `grep` | string | 否 | 关键词搜索 |

**成功响应** (200):

```json
{
  "logs": [
    {
      "id": "log-1",
      "timestamp": "2024-01-15T09:42:18.000Z",
      "hostname": "staging-api",
      "unit": "ml-worker.service",
      "pid": 5678,
      "level": "warn",
      "message": "OOM killed process 5678",
      "cursor": "s=xxx;i=12345"
    }
  ],
  "total": 100,
  "hasMore": true,
  "nextCursor": "s=xxx;i=12445"
}
```

### 7.2 日志流（WebSocket）

**WebSocket** `/api/server/connections/{connectionId}/logs/stream`

**连接参数**:

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `levels` | string | 日志级别过滤 |
| `units` | string | 服务单元过滤 |
| `grep` | string | 关键词搜索 |

**服务器推送消息格式**:

```json
{
  "type": "log",
  "data": {
    "id": "log-1",
    "timestamp": "2024-01-15T09:42:18.000Z",
    "hostname": "staging-api",
    "unit": "nginx.service",
    "pid": 1234,
    "level": "info",
    "message": "worker process started"
  }
}
```

**客户端发送控制消息**:

```json
{ "type": "control", "action": "pause" }
{ "type": "control", "action": "resume" }
{ "type": "control", "action": "disconnect" }
```

### 7.3 导出日志

**POST** `/api/server/connections/{connectionId}/logs/export`

**请求体**:

```json
{
  "levels": ["info", "warn", "error"],
  "since": "2024-01-14T00:00:00Z",
  "until": "2024-01-15T00:00:00Z",
  "format": "text"
}
```

| format | 说明 |
|--------|------|
| `text` | 纯文本格式 |
| `json` | JSON Lines 格式 |
| `csv` | CSV 格式 |

**成功响应** (200):

```json
{
  "success": true,
  "message": "日志导出任务已创建",
  "taskId": "export-task-xxx"
}
```

## 8. 面板资源接口

### 8.1 获取面板能力

**GET** `/api/server/connections/{connectionId}/panel/capabilities`

**成功响应** (200):

```json
{
  "source": "1panel",
  "version": "4.2.0",
  "canMonitor": true,
  "canContainers": true,
  "canWebsites": true,
  "canDatabases": true,
  "canCronjobs": true,
  "canSSL": true,
  "canFirewall": false,
  "canProcess": true,
  "canService": true,
  "readOnly": false
}
```

### 8.2 获取面板网站列表

**GET** `/api/server/connections/{connectionId}/panel/websites`

**成功响应** (200):

```json
{
  "websites": [
    {
      "id": "site-xxx",
      "name": "my-app",
      "domain": "my-app.example.com",
      "status": "running",
      "sslEnabled": true,
      "sslExpireAt": "2024-06-15T00:00:00Z",
      "createTime": "2024-01-01T00:00:00Z",
      "primaryDomain": "my-app.example.com",
      "aliasDomains": ["www.my-app.example.com"]
    }
  ],
  "total": 5
}
```

### 8.3 获取面板数据库列表

**GET** `/api/server/connections/{connectionId}/panel/databases`

**成功响应** (200):

```json
{
  "databases": [
    {
      "id": "db-xxx",
      "name": "myapp_db",
      "type": "mysql",
      "status": "running",
      "sizeBytes": 1073741824,
      "createTime": "2024-01-01T00:00:00Z",
      "username": "myapp"
    }
  ],
  "total": 3
}
```

### 8.4 获取面板计划任务列表

**GET** `/api/server/connections/{connectionId}/panel/cronjobs`

**成功响应** (200):

```json
{
  "cronjobs": [
    {
      "id": "cron-xxx",
      "name": "数据库备份",
      "type": "backup",
      "status": "enabled",
      "schedule": "0 2 * * *",
      "nextRunAt": "2024-01-16T02:00:00Z",
      "lastRunAt": "2024-01-15T02:00:00Z",
      "lastRunStatus": "success"
    }
  ],
  "total": 8
}
```

### 8.5 获取面板证书列表

**GET** `/api/server/connections/{connectionId}/panel/certificates`

**成功响应** (200):

```json
{
  "certificates": [
    {
      "id": "cert-xxx",
      "domain": "my-app.example.com",
      "provider": "letsencrypt",
      "expireAt": "2024-06-15T00:00:00Z",
      "autoRenew": true,
      "status": "valid",
      "issueAt": "2024-03-15T00:00:00Z"
    }
  ],
  "total": 5
}
```

## 9. SSH 命令执行接口

### 9.1 执行命令

**POST** `/api/server/connections/{connectionId}/commands/exec`

**请求体**:

```json
{
  "command": "df -h",
  "timeout": 30
}
```

**成功响应** (200):

```json
{
  "success": true,
  "stdout": "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1       100G   92G    9G  92% /",
  "stderr": "",
  "exitCode": 0,
  "duration": 120
}
```

## 10. 告警接口

### 10.1 获取告警规则列表

**GET** `/api/server/connections/{connectionId}/alerts/rules`

**成功响应** (200):

```json
{
  "rules": [
    {
      "id": "rule-xxx",
      "connectionId": "conn-xxx",
      "metric": "cpu",
      "threshold": 90,
      "condition": "gt",
      "durationSeconds": 300,
      "severity": "critical",
      "enabled": true,
      "message": "CPU 使用率持续过高"
    }
  ]
}
```

### 10.2 创建告警规则

**POST** `/api/server/connections/{connectionId}/alerts/rules`

**请求体**:

```json
{
  "metric": "cpu",
  "threshold": 90,
  "condition": "gt",
  "durationSeconds": 300,
  "severity": "critical",
  "enabled": true,
  "message": "CPU 使用率持续过高"
}
```

### 10.3 获取活跃告警

**GET** `/api/server/connections/{connectionId}/alerts`

**成功响应** (200):

```json
{
  "alerts": [
    {
      "id": "alert-xxx",
      "ruleId": "rule-xxx",
      "connectionId": "conn-xxx",
      "metric": "cpu",
      "value": 92.5,
      "threshold": 90,
      "severity": "critical",
      "message": "CPU 使用率 92.5% 超过阈值 90%",
      "triggeredAt": "2024-01-15T10:30:00Z",
      "acknowledgedAt": null,
      "resolvedAt": null
    }
  ]
}
```

## 11. 错误响应格式

所有接口返回统一的错误格式：

```json
{
  "success": false,
  "error": {
    "code": "SERVER_CONNECTION_ERROR",
    "message": "无法连接到服务器",
    "detail": "SSH 连接超时"
  }
}
```

### 错误码列表

| 错误码 | 说明 |
|--------|------|
| `SERVER_CONNECTION_ERROR` | 服务器连接失败 |
| `SERVER_AUTH_ERROR` | 认证失败 |
| `SERVER_NOT_FOUND` | 资源不存在 |
| `SERVER_INVALID_REQUEST` | 请求参数无效 |
| `SERVER_OPERATION_FAILED` | 操作执行失败 |
| `SERVER_COMMAND_TIMEOUT` | 命令执行超时 |
| `PANEL_API_ERROR` | 面板 API 调用失败 |
| `PANEL_CAPABILITY_ERROR` | 当前面板不支持此操作 |

## 12. 认证与权限

所有接口都需要认证，使用 Bearer Token：

```
Authorization: Bearer <token>
```

权限检查：
- 连接管理：需要管理员权限
- 进程/服务操作：需要服务器的写权限
- 只读连接：只能执行 GET 操作
- 高风险操作（kill、stop）需要二次确认
