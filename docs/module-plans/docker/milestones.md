# Docker 模块迭代计划

本文件定义 Docker 模块的开发迭代计划，明确各阶段目标、交付物和验收标准。

参考主文档：[README.md](./README.md)

## 1. 总体路线图

| 阶段 | 版本 | 时间 | 核心目标 |
|------|------|------|----------|
| 基建切片 | v0.0 | 1周 | Rust Docker 领域层 + Tauri IPC + 前端真实数据入口 |
| MVP 1 | v0.1 | 2周 | 本地 Engine + 真实容器列表/详情/生命周期 |
| MVP 2 | v0.2 | 2周 | 远程 SSH Engine + 日志流 + 容器终端 |
| MVP 3 | v0.3 | 2周 | 镜像管理 + Compose 基础工作区 |
| MVP 4 | v0.4 | 2周 | 卷/网络 + 安全审计 + 模块联动 |

路线图遵循 PRD 的产品理念：先把高频工作流做顺、做稳、做可信，再逐步扩展低频高级能力。Docker 模块第一阶段不追求覆盖 Docker Desktop 的全部功能，而是优先解决开发者最常见的“看状态、看日志、进终端、重启服务、定位宿主机问题”。

## 2. 基建切片: Rust Docker 领域层 + IPC 骨架

### 2.1 目标

建立符合 OmniPanel 架构约定的 Docker 模块基础设施，避免后续把业务逻辑堆在 `src-tauri` 或前端组件里。

### 2.2 交付物

**后端**:
- 新增 `crates/omnipanel-docker`
- 定义 `DockerDriver` / `DockerAdapter` trait
- 实现 `local-engine` 的最小 `bollard` adapter
- 预留 `ssh-engine` adapter 接口
- 在 `src-tauri/src/commands/docker.rs` 注册薄 IPC 命令
- 通过 `tauri-specta` 生成前端类型

**前端**:
- 拆分 `DockerPanel.tsx` 为连接区、工作区页签、容器列表、详情面板
- 新增 `useDockerWorkspace` 或同等数据入口
- 保留 mock 空态，但真实数据优先

### 2.3 验收标准

1. ✅ Rust workspace 能编译通过
2. ✅ 前端通过 `commands.docker*` typed client 调用，不手写 invoke 字符串
3. ✅ Docker 首页可以展示真实连接状态或清晰空态
4. ✅ `src-tauri` 只做命令桥接，不承载 Docker 业务逻辑

## 3. MVP 1: 本地 Engine + 容器闭环

### 3.1 目标

打通本机 Docker Engine 的真实容器管理闭环，让 Docker 模块从 UI 原型变成可用工具。

### 3.2 交付物

**后端**:
- `docker_list_connections`
- `docker_probe_connection`
- `docker_get_overview`
- `docker_list_containers`
- `docker_inspect_container`
- `docker_container_action`
- Docker 能力探测服务
- 本地 Engine 错误映射与友好提示

**前端**:
- 连接列表与连接状态
- 容器列表、筛选、搜索
- 容器详情抽屉
- 启动 / 停止 / 重启 / 删除操作入口
- 生产环境 / 高风险操作确认提示

### 3.3 验收标准

1. ✅ 能自动识别本地 Docker Engine 或给出可理解的未安装/未启动提示
2. ✅ 支持查看真实容器列表和详情
3. ✅ 支持启动、停止、重启容器
4. ✅ 删除容器需要二次确认并写入审计
5. ✅ 支持按状态过滤和关键词搜索
6. ✅ 前端无核心 mock 数据依赖

### 3.4 技术要点

- Rust 使用 `bollard`
- IPC 命令返回 `Result<T, OmniError>`
- 列表先普通渲染，超过性能阈值再引入虚拟滚动
- 操作通过统一动作 / 审计体系记录

## 4. MVP 2: SSH Engine + 日志流 + 容器终端

### 4.1 目标

覆盖真实远程宿主机场景，让用户从 SSH 主机自然进入 Docker 工作区。

### 4.2 交付物

**后端**:
- `ssh-engine` adapter
- 远程 `docker ps` / `docker inspect` 解析
- `docker_stream_container_logs`
- `docker_create_exec_session`
- exec 输入 / resize / close 命令
- SSH 连接断开与权限不足的降级错误

**前端**:
- 日志查看器
- 容器终端入口
- 从 SSH / Server 跳转 Docker 连接
- 日志片段发送给 AI 的上下文入口

### 4.3 验收标准

1. ✅ Docker 连接可绑定 SSH 连接
2. ✅ 能查看远程宿主机容器列表
3. ✅ 能查看并跟随容器日志
4. ✅ 能进入容器 shell
5. ✅ SSH 权限不足、Docker 未安装、用户不在 docker 组时提示明确
6. ✅ 容器日志可作为 AI 分析上下文

### 4.4 技术要点

- 优先复用 `omnipanel-ssh`
- 远程命令输出解析要独立测试
- 日志采用 Tauri event 流式回传
- 容器终端优先复用现有终端会话模型

## 5. MVP 3: 镜像管理 + Compose 基础工作区

### 5.1 目标

补齐应用级编排和镜像级管理能力，但保持 MVP 克制，不先做复杂拓扑和模板市场。

### 5.2 交付物

**后端**:
- `docker_list_images`
- `docker_pull_image`
- `docker_remove_image`
- `docker_prune_images`
- `docker_list_compose_projects`
- `docker_compose_action`

**前端**:
- 镜像列表、拉取、删除、清理
- Compose 项目列表
- Compose 服务列表
- Compose up/down/restart/pull
- 聚合日志入口

### 5.3 验收标准

1. ✅ 支持查看镜像列表、大小、标签和引用容器数
2. ✅ 支持拉取、删除、清理无用镜像
3. ✅ 支持识别 Compose 项目和服务
4. ✅ 支持 Compose up/down/restart/pull
5. ✅ 高风险清理动作需要确认和审计

### 5.4 技术要点

- Compose 第一阶段通过 CLI adapter 实现
- YAML 编辑器后置，不阻塞项目级操作闭环
- 镜像拉取进度通过事件回流

## 6. MVP 4: 卷/网络 + 审计 + 模块联动

### 6.1 目标

补齐 Docker 资源域，并把 Docker 与 SSH、Server、AI、动作审计真正连起来。

### 6.2 交付物

**资源管理**:
- 卷列表、详情、删除
- 网络列表、详情、删除
- 资源关联容器展示

**联动能力**:
- 从 Docker 容器跳转宿主机 SSH
- 从 Docker 异常跳转 Server 监控
- 将容器日志、inspect 结果、最近动作发送给 AI
- 高风险动作统一进入动作执行 / 审计体系

### 6.3 验收标准

1. ✅ 支持卷、网络查看与基础清理
2. ✅ 能从容器定位宿主机和关联 Compose 项目
3. ✅ AI 上下文包含容器状态、日志片段、宿主机信息
4. ✅ 删除、prune、kill 等动作有风险提示、二次确认和审计记录
5. ✅ Docker 模块失败不影响终端、SSH 基础能力

## 7. 质量标准

### 7.1 代码质量

- 后端 Docker adapter、命令解析、风险判断必须有单元测试
- 前端关键状态流（加载、空态、错误、降级、确认）必须可验证
- `src-tauri` 保持薄命令层，业务逻辑进入 `omnipanel-docker`

### 7.2 性能指标

- 页面加载时间 ≤ 2s
- 本地容器列表刷新 ≤ 500ms（常见开发环境）
- 远程容器列表刷新 ≤ 2s（正常 SSH 网络）
- 1000+ 容器列表需要虚拟滚动或分页
- 日志流不得导致主线程卡顿

### 7.3 安全标准

- Docker / Registry / 面板凭据只存系统 Keychain
- 生产环境动作默认提升风险等级
- 删除容器、删除镜像、prune、kill、Compose down 必须二次确认
- AI 只生成建议和操作草稿，不绕过确认直接执行

### 7.4 用户体验

- 操作有反馈（loading/success/error）
- 错误提示必须能指导下一步，例如“Docker 未启动”“SSH 用户无 docker 权限”
- 操作失败支持重试
- 默认界面保持高信息密度但不过载

## 8. 风险评估

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| Docker API 版本兼容性 | 高 | 中 | 版本检测 + 降级处理 |
| SSH 远程命令输出差异 | 中 | 中 | 解析器单测 + 明确降级提示 |
| 大日志量导致性能问题 | 中 | 中 | 分页 + 流式传输 |
| 高风险误操作 | 中 | 高 | 环境标签 + 二次确认 + 审计 |
| Windows 本地 Docker 环境差异 | 中 | 中 | Docker Desktop / WSL 状态检测 |
| 面板 API 版本差异 | 高 | 中 | 面板 adapter 后置 + 能力探测 |

## 9. 依赖关系

### 9.1 内部依赖

| 模块 | 说明 |
|------|------|
| store | Docker 连接模型、环境标签、凭据引用 |
| ssh | SSH 连接管理 |
| server | 服务器管理 |
| exec | 动作执行、确认、审计 |
| ai | 日志和 inspect 结果作为 AI 上下文 |

### 9.2 外部依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| bollard | 最新稳定版 | Rust Docker Engine API 客户端 |
| tokio | workspace | 异步任务和流处理 |
| serde / serde_json | workspace | 类型序列化与命令输出解析 |
| xterm.js | 已有前端终端能力 | 容器终端展示 |
| react-virtual | 按需引入 | 大列表虚拟滚动 |

## 10. 里程碑跟踪

### 10.1 进度跟踪表

| 里程碑 | 状态 | 预计完成 | 实际完成 | 负责人 |
|--------|------|----------|----------|--------|
| 基建切片 | | | | |
| MVP 1 | | | | |
| MVP 2 | | | | |
| MVP 3 | | | | |
| MVP 4 | | | | |

### 10.2 完成标志

每个里程碑完成后需要满足：
1. 所有验收标准通过
2. 代码审查通过
3. 测试覆盖率达标
4. 文档更新完成

## 11. 后续规划

### 11.1 功能扩展

- 镜像仓库管理
- 容器健康检查与自动重启
- 资源使用统计与告警
- Docker 文件管理
- Dockerfile 构建
- Portainer / 1Panel / 宝塔容器资源适配

### 11.2 暂不进入近期计划

- Kubernetes
- Swarm 集群管理
- 容器模板市场
- 云端同步强依赖
- 独立 Web 后端服务
