# Docker 模块 IPC 设计

本文件定义 Docker 模块的前后端契约，包括 Tauri IPC 命令、事件流、资源操作和错误模型。

参考主文档：[README.md](./README.md)

## 1. 设计原则

- OmniPanel 桌面端不为 Docker 模块新增独立 HTTP 服务，前端统一通过 `tauri-specta` 生成的 typed client 调用 Tauri commands
- `src-tauri` 只做参数桥接、状态注入和事件 emit，Docker 业务逻辑放在 `crates/omnipanel-docker`
- 命令返回 `Result<T, OmniError>`，前端按统一错误结构展示可理解提示
- 支持批量操作和分页
- 实时数据通过 Tauri event 传输，日志、拉取进度、exec 输出都复用事件流
- 统一错误响应格式
- 支持能力探测
- 高风险动作必须进入统一动作确认与审计体系

## 2. 命令命名约定

所有 Docker IPC 命令统一使用 `docker_` 前缀，返回类型必须派生 `Serialize`、`Deserialize`、`specta::Type`。

| 资源域 | 命令示例 | 说明 |
|--------|----------|------|
| 连接 | `docker_list_connections` / `docker_probe_connection` | 连接列表、能力探测 |
| 总览 | `docker_get_overview` | 连接状态、资源统计、异常、最近事件 |
| 容器 | `docker_list_containers` / `docker_inspect_container` / `docker_container_action` | 容器列表、详情、生命周期 |
| 日志 | `docker_stream_container_logs` / `docker_stop_log_stream` | 容器日志流 |
| 终端 | `docker_create_exec_session` / `docker_exec_write` / `docker_exec_resize` / `docker_exec_close` | 容器 exec 会话 |
| 镜像 | `docker_list_images` / `docker_pull_image` / `docker_remove_image` / `docker_prune_images` | 镜像管理 |
| Compose | `docker_list_compose_projects` / `docker_compose_action` | Compose 项目识别与项目级操作 |
| 卷/网络 | `docker_list_volumes` / `docker_list_networks` | 资源查看与清理 |

> 下文保留按“连接、总览、Compose、容器、镜像、卷、网络”的分组方式描述请求/响应语义；实现时以 Tauri command 名称为准，而不是 `/api/docker/...` HTTP 路径。

## 3. 连接管理接口

### 3.1 获取所有连接列表

**命令**：`docker_list_connections`

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
      "name": "本地 Docker",
      "source": "local-engine",
      "status": "online",
      "hostLabel": "localhost",
      "environment": "local",
      "engineVersion": "24.0.6",
      "apiVersion": "1.43",
      "swarmEnabled": false,
      "lastCheckedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

### 3.2 获取单个连接详情

**命令**：`docker_get_connection`

**成功响应** (200):

```json
{
  "connectionId": "conn-xxx",
  "name": "远程主机",
  "source": "ssh-engine",
  "status": "online",
  "hostLabel": "prod-server-01",
  "environment": "prod",
  "engineVersion": "23.0.6",
  "apiVersion": "1.42",
  "swarmEnabled": true,
  "composeMode": "docker compose",
  "capabilities": {
    "canOverview": true,
    "canCompose": true,
    "canComposeEdit": true,
    "canContainerExec": true,
    "canStreamLogs": true,
    "canInspect": true,
    "canManageContainers": true,
    "canManageImages": true,
    "canManageVolumes": true,
    "canManageNetworks": true,
    "canPushImages": true,
    "canPullImages": true,
    "canPrune": true,
    "canEvents": true,
    "readOnly": false
  },
  "warningMessage": null
}
```

### 3.3 创建新连接

**命令**：复用统一连接模型 `conn_save`，Docker 模块只负责探测和资源访问。

**请求体**:

```json
{
  "name": "新连接",
  "source": "remote-engine",
  "config": {
    "host": "192.168.1.100",
    "port": 2376,
    "tls": true,
    "tlsVerify": true
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 连接名称 |
| `source` | string | 是 | 来源类型：`local-engine` / `remote-engine` / `ssh-engine` / `panel-adapter` |
| `config` | object | 是 | 连接配置，根据 source 不同结构不同 |

**成功响应** (201):

```json
{
  "connectionId": "conn-xxx",
  "name": "新连接",
  "status": "online",
  "message": "连接创建成功"
}
```

### 3.4 更新连接配置

**命令**：复用统一连接模型 `conn_save`。

**请求体**: 同创建连接

**成功响应** (200):

```json
{
  "success": true,
  "message": "连接更新成功"
}
```

### 3.5 删除连接

**命令**：复用统一连接模型 `conn_delete`。

**成功响应** (200):

```json
{
  "success": true,
  "message": "连接删除成功"
}
```

### 3.6 测试连接

**命令**：`docker_probe_connection`

**成功响应** (200):

```json
{
  "success": true,
  "message": "连接测试成功",
  "engineVersion": "24.0.6",
  "apiVersion": "1.43"
}
```

## 4. 总览接口

### 4.1 获取连接总览

**命令**：`docker_get_overview`

**成功响应** (200):

```json
{
  "connection": {
    "connectionId": "conn-xxx",
    "name": "本地 Docker",
    "status": "online"
  },
  "summary": {
    "projects": 5,
    "containersTotal": 12,
    "containersRunning": 10,
    "containersStopped": 2,
    "containersUnhealthy": 0,
    "images": 25,
    "volumes": 8,
    "networks": 5
  },
  "anomalies": [
    {
      "id": "anomaly-1",
      "kind": "container",
      "severity": "warning",
      "title": "容器已停止",
      "message": "容器 nginx-proxy 意外停止",
      "resourceId": "container-xxx",
      "resourceName": "nginx-proxy",
      "suggestedAction": "检查容器日志或重启容器"
    }
  ],
  "recentEvents": [
    {
      "id": "event-1",
      "time": "2024-01-15T10:30:00Z",
      "type": "container",
      "action": "start",
      "actorId": "container-xxx",
      "actorName": "nginx",
      "message": "容器 nginx 已启动"
    }
  ],
  "quickActions": [
    {
      "key": "refresh",
      "label": "刷新",
      "enabled": true
    }
  ]
}
```

## 5. Compose 接口

### 5.1 获取 Compose 项目列表

**命令**：`docker_list_compose_projects`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `status` | string | 否 | 过滤状态：`all` / `running` / `stopped` / `partial` / `degraded` |
| `search` | string | 否 | 搜索关键词 |

**成功响应** (200):

```json
{
  "projects": [
    {
      "id": "project-xxx",
      "name": "my-app",
      "status": "running",
      "serviceCount": 3,
      "containerCount": 4,
      "runningContainerCount": 4,
      "sourcePath": "/opt/app/docker-compose.yml",
      "updatedAt": "2024-01-15T09:00:00Z"
    }
  ],
  "total": 5
}
```

### 5.2 获取 Compose 项目详情

**命令**：`docker_get_compose_project`

**成功响应** (200):

```json
{
  "project": {
    "id": "project-xxx",
    "name": "my-app",
    "status": "running",
    "serviceCount": 3,
    "containerCount": 4,
    "runningContainerCount": 4,
    "sourcePath": "/opt/app/docker-compose.yml",
    "updatedAt": "2024-01-15T09:00:00Z"
  },
  "services": [
    {
      "name": "web",
      "image": "nginx:latest",
      "replicas": 2,
      "runningReplicas": 2,
      "ports": ["80:80"],
      "dependsOn": ["api"],
      "status": "running"
    }
  ],
  "containers": [],
  "composeFiles": ["docker-compose.yml"],
  "environmentFiles": [".env"],
  "environment": [
    { "key": "APP_ENV", "value": "production", "masked": false }
  ],
  "yamlText": "version: '3.8'\nservices:\n  web:\n    image: nginx:latest"
}
```

### 5.3 创建 Compose 项目

**命令**：`docker_create_compose_project`

**请求体**:

```json
{
  "name": "new-project",
  "yamlText": "version: '3.8'\nservices:\n  web:\n    image: nginx:latest",
  "workingDir": "/opt/new-project",
  "environment": [
    { "key": "APP_ENV", "value": "development" }
  ]
}
```

**成功响应** (201):

```json
{
  "projectId": "project-xxx",
  "name": "new-project",
  "message": "Compose 项目创建成功"
}
```

### 5.4 更新 Compose 项目

**命令**：`docker_update_compose_project`

**请求体**:

```json
{
  "yamlText": "version: '3.8'\nservices:\n  web:\n    image: nginx:latest\n    ports:\n      - '8080:80'"
}
```

**成功响应** (200):

```json
{
  "success": true,
  "message": "Compose 项目更新成功"
}
```

### 5.5 删除 Compose 项目

**命令**：`docker_delete_compose_project`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `down` | boolean | 否 | 是否先执行 down，默认 true |

**成功响应** (200):

```json
{
  "success": true,
  "message": "Compose 项目删除成功"
}
```

### 5.6 Compose 操作

**命令**：`docker_compose_action`

**请求体**:

```json
{
  "action": "up"
}
```

| action | 说明 |
|--------|------|
| `up` | 启动项目 |
| `down` | 停止项目 |
| `restart` | 重启项目 |
| `pull` | 拉取镜像 |
| `build` | 构建镜像 |

**成功响应** (200):

```json
{
  "success": true,
  "message": "操作执行成功",
  "output": "Creating network...\nCreating container..."
}
```

## 6. 容器接口

### 6.1 获取容器列表

**命令**：`docker_list_containers`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `status` | string | 否 | 过滤状态：`all` / `running` / `stopped` / `restarting` / `paused` |
| `projectId` | string | 否 | 按项目过滤 |
| `search` | string | 否 | 搜索关键词 |

**成功响应** (200):

```json
{
  "containers": [
    {
      "id": "container-xxx",
      "shortId": "abc123",
      "name": "nginx",
      "image": "nginx:latest",
      "imageId": "image-xxx",
      "projectName": "my-app",
      "serviceName": "web",
      "lifecycle": "running",
      "health": "healthy",
      "statusText": "Up 2 hours",
      "cpuPercent": 5.2,
      "memoryUsageBytes": 134217728,
      "memoryLimitBytes": 268435456,
      "ports": [
        { "containerPort": "80", "hostPort": "8080", "protocol": "tcp" }
      ],
      "networks": ["bridge", "my-network"],
      "createdAt": "2024-01-15T08:00:00Z",
      "startedAt": "2024-01-15T08:00:01Z"
    }
  ],
  "total": 12
}
```

### 6.2 获取容器详情

**命令**：`docker_inspect_container`

**成功响应** (200):

```json
{
  "container": {
    "id": "container-xxx",
    "shortId": "abc123",
    "name": "nginx",
    "image": "nginx:latest",
    "lifecycle": "running",
    "health": "healthy",
    "statusText": "Up 2 hours"
  },
  "env": [
    { "key": "NGINX_PORT", "value": "80", "masked": false }
  ],
  "mounts": [
    {
      "type": "bind",
      "source": "/host/path",
      "destination": "/container/path",
      "readOnly": false
    }
  ],
  "networks": [
    { "name": "bridge", "ipAddress": "172.17.0.2" }
  ],
  "command": "nginx -g 'daemon off;'",
  "entrypoint": null,
  "restartPolicy": "unless-stopped",
  "exitCode": null,
  "oomKilled": false
}
```

### 6.3 创建容器

**命令**：`docker_create_container`

**请求体**:

```json
{
  "name": "my-container",
  "image": "nginx:latest",
  "command": null,
  "entrypoint": null,
  "env": [
    { "key": "APP_ENV", "value": "production" }
  ],
  "ports": [
    { "containerPort": "80", "hostPort": "8080" }
  ],
  "mounts": [
    {
      "type": "bind",
      "source": "/host/path",
      "destination": "/container/path",
      "readOnly": false
    }
  ],
  "networks": ["bridge"],
  "restartPolicy": "unless-stopped",
  "labels": {
    "app": "my-app"
  }
}
```

**成功响应** (201):

```json
{
  "containerId": "container-xxx",
  "name": "my-container",
  "message": "容器创建成功"
}
```

### 6.4 更新容器

**命令**：`docker_update_container`

**请求体**:

```json
{
  "name": "new-name",
  "restartPolicy": "always"
}
```

**成功响应** (200):

```json
{
  "success": true,
  "message": "容器更新成功"
}
```

### 6.5 删除容器

**命令**：`docker_delete_container`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `force` | boolean | 否 | 是否强制删除，默认 false |
| `removeVolume` | boolean | 否 | 是否删除关联卷，默认 false |

**成功响应** (200):

```json
{
  "success": true,
  "message": "容器删除成功"
}
```

### 6.6 容器操作

**命令**：`docker_container_action`

**请求体**:

```json
{
  "action": "start"
}
```

| action | 说明 |
|--------|------|
| `start` | 启动容器 |
| `stop` | 停止容器 |
| `restart` | 重启容器 |
| `pause` | 暂停容器 |
| `unpause` | 恢复容器 |
| `kill` | 强制终止容器 |

**成功响应** (200):

```json
{
  "success": true,
  "message": "操作执行成功"
}
```

## 7. 镜像接口

### 7.1 获取镜像列表

**命令**：`docker_list_images`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `filter` | string | 否 | 过滤：`all` / `dangling` / `used` |
| `search` | string | 否 | 搜索关键词 |

**成功响应** (200):

```json
{
  "images": [
    {
      "id": "image-xxx",
      "shortId": "def456",
      "repository": "nginx",
      "tag": "latest",
      "digest": "sha256:xxx",
      "sizeBytes": 142000000,
      "createdAt": "2024-01-10T00:00:00Z",
      "usedByContainerCount": 2,
      "dangling": false
    }
  ],
  "total": 25
}
```

### 7.2 获取镜像详情

**命令**：`docker_inspect_image`

**成功响应** (200):

```json
{
  "image": {
    "id": "image-xxx",
    "shortId": "def456",
    "repository": "nginx",
    "tag": "latest",
    "sizeBytes": 142000000,
    "createdAt": "2024-01-10T00:00:00Z",
    "dangling": false
  },
  "repoTags": ["nginx:latest", "nginx:1.25"],
  "repoDigests": ["nginx@sha256:xxx"],
  "labels": {
    "maintainer": "nginx"
  },
  "architecture": "amd64",
  "os": "linux",
  "layers": ["sha256:xxx", "sha256:yyy"]
}
```

### 7.3 拉取镜像

**命令**：`docker_pull_image`

**请求体**:

```json
{
  "image": "nginx:latest",
  "platform": "linux/amd64"
}
```

**成功响应** (200):

```json
{
  "success": true,
  "message": "镜像拉取成功",
  "imageId": "image-xxx"
}
```

### 7.4 删除镜像

**命令**：`docker_remove_image`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `force` | boolean | 否 | 是否强制删除，默认 false |

**成功响应** (200):

```json
{
  "success": true,
  "message": "镜像删除成功"
}
```

### 7.5 清理无用镜像

**命令**：`docker_prune_images`

**成功响应** (200):

```json
{
  "success": true,
  "message": "清理完成",
  "deletedImages": ["image-xxx"],
  "freedSpaceBytes": 142000000
}
```

## 8. 卷接口

### 8.1 获取卷列表

**命令**：`docker_list_volumes`

**成功响应** (200):

```json
{
  "volumes": [
    {
      "name": "my-volume",
      "driver": "local",
      "scope": "local",
      "mountpoint": "/var/lib/docker/volumes/my-volume/_data",
      "createdAt": "2024-01-10T00:00:00Z",
      "attachedContainerCount": 1
    }
  ],
  "total": 8
}
```

### 8.2 创建卷

**命令**：`docker_create_volume`

**请求体**:

```json
{
  "name": "new-volume",
  "driver": "local",
  "options": {
    "type": "none",
    "device": "/path/to/dir",
    "o": "bind"
  }
}
```

**成功响应** (201):

```json
{
  "name": "new-volume",
  "message": "卷创建成功"
}
```

### 8.3 删除卷

**命令**：`docker_delete_volume`

**成功响应** (200):

```json
{
  "success": true,
  "message": "卷删除成功"
}
```

## 9. 网络接口

### 9.1 获取网络列表

**命令**：`docker_list_networks`

**成功响应** (200):

```json
{
  "networks": [
    {
      "id": "network-xxx",
      "shortId": "ghi789",
      "name": "bridge",
      "driver": "bridge",
      "scope": "local",
      "internal": false,
      "attachable": true,
      "ingress": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "connectedContainerCount": 5
    }
  ],
  "total": 5
}
```

### 9.2 创建网络

**命令**：`docker_create_network`

**请求体**:

```json
{
  "name": "my-network",
  "driver": "bridge",
  "internal": false,
  "attachable": true,
  "subnet": "192.168.100.0/24",
  "gateway": "192.168.100.1"
}
```

**成功响应** (201):

```json
{
  "networkId": "network-xxx",
  "name": "my-network",
  "message": "网络创建成功"
}
```

### 9.3 删除网络

**命令**：`docker_delete_network`

**成功响应** (200):

```json
{
  "success": true,
  "message": "网络删除成功"
}
```

## 10. 实时通信接口

### 10.1 Tauri 事件流

Docker 模块不单独引入 WebSocket 服务。实时数据由 `src-tauri` 通过 Tauri event 推送到前端，事件 payload 与 `specta` 类型保持一致。

建议事件名：

| 事件名 | 场景 |
|--------|------|
| `docker-event` | Docker Engine / adapter 事件 |
| `docker-log` | 容器日志流 |
| `docker-exec-output` | 容器 exec 输出 |
| `docker-progress` | 镜像拉取、Compose 操作等长任务进度 |

**消息格式**:

```json
{
  "type": "event",
  "data": {
    "id": "event-xxx",
    "time": "2024-01-15T10:30:00Z",
    "type": "container",
    "action": "start",
    "actorId": "container-xxx",
    "actorName": "nginx",
    "message": "容器 nginx 已启动"
  }
}
```

### 10.2 获取容器日志

**命令**：`docker_stream_container_logs`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `follow` | boolean | 否 | 是否跟随日志，默认 false |
| `since` | string | 否 | 开始时间 |
| `tail` | number | 否 | 尾部行数，默认 100 |

**成功响应** (200):

```json
{
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "stream": "stdout",
      "message": "Nginx started"
    }
  ]
}
```

### 10.3 执行命令

**命令**：`docker_create_exec_session`

**请求体**:

```json
{
  "command": ["bash"],
  "shell": "bash",
  "user": "root",
  "tty": true
}
```

**成功响应** (200):

```json
{
  "sessionId": "session-xxx",
  "message": "exec 会话创建成功"
}
```

## 11. 错误模型

所有命令返回 `Result<T, OmniError>`，由 `omnipanel-error` 统一承载错误码、错误类型、用户可读消息和底层 cause。

```json
{
  "code": "DOCKER_CONNECTION_ERROR",
  "kind": "Connection",
  "message": "无法连接到 Docker 主机",
  "cause": "连接超时"
}
```

### 错误码列表

| 错误码 | 说明 |
|--------|------|
| `DOCKER_CONNECTION_ERROR` | Docker 连接失败 |
| `DOCKER_AUTH_ERROR` | 认证失败 |
| `DOCKER_NOT_FOUND` | 资源不存在 |
| `DOCKER_INVALID_REQUEST` | 请求参数无效 |
| `DOCKER_OPERATION_FAILED` | 操作执行失败 |
| `DOCKER_CAPABILITY_ERROR` | 当前连接不支持此操作 |
| `DOCKER_RISK_REQUIRES_CONFIRMATION` | 高风险操作需要二次确认 |

## 12. 权限、安全与审计

桌面端本地模块不使用 Bearer Token。权限和安全由以下机制保证：

- 连接凭据只存系统 Keychain，数据库仅保存 `credential_ref`
- 连接环境标签参与风险判断，`prod` 默认提高动作风险等级
- 只读连接只能执行查看类命令，所有 destructive 命令必须禁用或二次确认
- 容器删除、镜像删除、prune、kill、Compose down 等操作必须写入审计
- AI 生成的 Docker 操作只能形成草稿，不能绕过用户确认直接执行
