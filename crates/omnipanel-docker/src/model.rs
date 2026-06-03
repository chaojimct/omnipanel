//! Docker 模块对外数据模型。
//!
//! 所有类型派生 `Serialize`/`Deserialize`/`specta::Type`，由 tauri-specta 生成前端 TS 类型。
//! 不同来源（本地 Engine / SSH 宿主机 / 远程 API / 面板适配）最终都映射到这一套统一模型上。

use serde::{Deserialize, Serialize};

/// Docker 连接来源。前端只消费统一资源模型，来源差异由后端 adapter 屏蔽。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "kebab-case")]
pub enum DockerConnectionSource {
    /// 本地 Docker Engine / Docker Desktop。
    LocalEngine,
    /// 远程 Docker Engine API（TCP/TLS）。后续增强。
    RemoteEngine,
    /// 通过 SSH 宿主机调用远程 `docker` CLI。
    SshEngine,
    /// 通过 1Panel / 宝塔 / Portainer 等面板 API 适配。后续增强。
    PanelAdapter,
}

impl DockerConnectionSource {
    pub fn parse(s: &str) -> Self {
        match s {
            "local-engine" => Self::LocalEngine,
            "remote-engine" => Self::RemoteEngine,
            "ssh-engine" => Self::SshEngine,
            "panel-adapter" => Self::PanelAdapter,
            _ => Self::LocalEngine,
        }
    }
}

/// 连接状态。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum DockerConnectionStatus {
    Online,
    Degraded,
    Offline,
}

/// 连接级能力探测结果。前端据此决定页签/按钮显隐与降级。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerCapabilities {
    pub can_overview: bool,
    pub can_stream_logs: bool,
    pub can_container_exec: bool,
    pub can_inspect: bool,
    pub can_manage_containers: bool,
    pub can_manage_images: bool,
    pub can_compose: bool,
    pub can_prune: bool,
    pub read_only: bool,
    pub source: DockerConnectionSource,
}

impl DockerCapabilities {
    /// 本地 / SSH Engine 的默认全量能力。
    pub fn full(source: DockerConnectionSource) -> Self {
        Self {
            can_overview: true,
            can_stream_logs: true,
            can_container_exec: true,
            can_inspect: true,
            can_manage_containers: true,
            can_manage_images: true,
            can_compose: true,
            can_prune: true,
            read_only: false,
            source,
        }
    }
}

/// 连接信息（列表与工作区头部展示）。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerConnectionInfo {
    pub connection_id: String,
    pub name: String,
    pub source: DockerConnectionSource,
    pub status: DockerConnectionStatus,
    pub host_label: String,
    pub environment: String,
    pub engine_version: Option<String>,
    pub api_version: Option<String>,
    pub containers_running: u32,
    pub containers_total: u32,
    pub warning_message: Option<String>,
    /// 与 SSH / Server 模块贯通上下文用：绑定的 SSH 连接 id。
    pub bound_ssh_connection_id: Option<String>,
}

/// 探测结果。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerProbe {
    pub status: DockerConnectionStatus,
    pub engine_version: Option<String>,
    pub api_version: Option<String>,
    pub capabilities: DockerCapabilities,
    pub warning_message: Option<String>,
}

/// 资源统计（总览页）。
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerResourceSummary {
    pub containers_total: u32,
    pub containers_running: u32,
    pub containers_stopped: u32,
    pub images: u32,
}

/// 总览页数据。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerOverview {
    pub capabilities: DockerCapabilities,
    pub summary: DockerResourceSummary,
    pub engine_version: Option<String>,
    pub warning_message: Option<String>,
}

/// 端口映射。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerPort {
    pub private_port: u16,
    pub public_port: Option<u16>,
    pub protocol: String,
    pub ip: Option<String>,
}

impl DockerPort {
    /// 渲染为 `0.0.0.0:8080->80/tcp` 风格文本。
    pub fn label(&self) -> String {
        match self.public_port {
            Some(public) => {
                let ip = self.ip.as_deref().unwrap_or("0.0.0.0");
                format!("{ip}:{public}->{}/{}", self.private_port, self.protocol)
            }
            None => format!("{}/{}", self.private_port, self.protocol),
        }
    }
}

/// 容器列表项。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerContainerSummary {
    pub id: String,
    pub short_id: String,
    pub name: String,
    pub image: String,
    /// 归一化生命周期：running / exited / paused / restarting / created / dead / unknown。
    pub state: String,
    /// Docker 原始状态文本，例如 "Up 2 hours"。
    pub status_text: String,
    pub running: bool,
    pub ports: Vec<DockerPort>,
    pub networks: Vec<String>,
    #[specta(type = f64)]
    pub created_at: i64,
}

/// 键值对（环境变量、标签）。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerKeyValue {
    pub key: String,
    pub value: String,
}

/// 挂载信息。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerMount {
    pub kind: String,
    pub source: String,
    pub destination: String,
    pub read_only: bool,
}

/// 网络挂载。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerNetworkAttachment {
    pub name: String,
    pub ip_address: Option<String>,
}

/// 容器详情。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerContainerDetail {
    pub summary: DockerContainerSummary,
    pub command: Option<String>,
    pub restart_policy: Option<String>,
    #[specta(type = Option<f64>)]
    pub exit_code: Option<i64>,
    pub env: Vec<DockerKeyValue>,
    pub mounts: Vec<DockerMount>,
    pub networks: Vec<DockerNetworkAttachment>,
}

/// 容器生命周期动作。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "lowercase")]
pub enum DockerContainerAction {
    Start,
    Stop,
    Restart,
    Kill,
    Pause,
    Unpause,
    Remove,
}

impl DockerContainerAction {
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "start" => Some(Self::Start),
            "stop" => Some(Self::Stop),
            "restart" => Some(Self::Restart),
            "kill" => Some(Self::Kill),
            "pause" => Some(Self::Pause),
            "unpause" => Some(Self::Unpause),
            "remove" => Some(Self::Remove),
            _ => None,
        }
    }

    /// 是否为高风险动作（前端需二次确认 + 审计）。
    pub fn is_destructive(self) -> bool {
        matches!(self, Self::Kill | Self::Remove)
    }

    /// 远程 SSH 场景对应的 docker 子命令。
    pub fn cli_verb(self) -> &'static str {
        match self {
            Self::Start => "start",
            Self::Stop => "stop",
            Self::Restart => "restart",
            Self::Kill => "kill",
            Self::Pause => "pause",
            Self::Unpause => "unpause",
            Self::Remove => "rm -f",
        }
    }
}

/// 日志行。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerLogLine {
    /// stdout / stderr。
    pub stream: String,
    pub message: String,
}

/// 镜像列表项。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerImageSummary {
    pub id: String,
    pub short_id: String,
    pub repository: String,
    pub tag: String,
    #[specta(type = f64)]
    pub size_bytes: i64,
    #[specta(type = f64)]
    pub created_at: i64,
    #[specta(type = f64)]
    pub containers: i64,
    pub dangling: bool,
}

/// 镜像清理结果。
#[derive(Debug, Clone, Default, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerPruneResult {
    pub deleted: Vec<String>,
    #[specta(type = f64)]
    pub freed_space_bytes: i64,
}

/// Compose 项目（按 `com.docker.compose.project` 标签聚合容器得到）。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerComposeProject {
    pub name: String,
    pub working_dir: Option<String>,
    pub config_files: Option<String>,
    pub service_count: u32,
    pub container_count: u32,
    pub running_container_count: u32,
    pub services: Vec<DockerComposeService>,
}

/// Compose 服务（按 `com.docker.compose.service` 标签聚合）。
#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct DockerComposeService {
    pub name: String,
    pub image: String,
    pub container_count: u32,
    pub running_container_count: u32,
}
