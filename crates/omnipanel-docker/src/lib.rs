//! Docker 领域层：统一模型 + `DockerAdapter` 边界 + 本地 / SSH 两种 Engine 实现。
//!
//! 设计：
//! - `src-tauri` 只做 IPC 桥接，所有 Docker 业务逻辑收敛在此 crate。
//! - 本地 Engine 走 Rust `bollard`（[`local::LocalDockerAdapter`]）。
//! - 远程宿主机复用 SSH 调用远端 `docker` CLI（[`ssh`] 模块的自由函数，借用现有 `SshSession`）。
//! - 所有错误统一为 [`OmniError`]，命令层零散字符串错误就此收敛。

mod compose;
pub mod local;
pub mod model;
pub mod ssh;

use async_trait::async_trait;
use omnipanel_error::OmniResult;

pub use compose::aggregate_compose;
pub use local::{DockerExecOutput, DockerExecSession, LocalDockerAdapter};
pub use model::*;
pub use ssh::SshDockerAdapter;

/// 容器列表筛选。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContainerFilter {
    All,
    Running,
    Stopped,
}

impl ContainerFilter {
    pub fn parse(s: Option<&str>) -> Self {
        match s {
            Some("running") => Self::Running,
            Some("stopped") => Self::Stopped,
            _ => Self::All,
        }
    }

    /// 是否需要包含已停止容器。
    pub fn include_all(self) -> bool {
        !matches!(self, Self::Running)
    }

    pub fn matches(self, running: bool) -> bool {
        match self {
            Self::All => true,
            Self::Running => running,
            Self::Stopped => !running,
        }
    }
}

/// Docker 引擎适配器统一边界。本地 Engine 实现该 trait；
/// SSH 宿主机因需借用外部 `SshSession`，以 [`ssh`] 模块的等价自由函数提供，共享同一套解析逻辑。
#[async_trait]
pub trait DockerAdapter: Send + Sync {
    /// 探测连通性与能力。
    async fn probe(&self) -> OmniResult<DockerProbe>;
    /// 总览统计。
    async fn overview(&self) -> OmniResult<DockerOverview>;
    /// 容器列表。
    async fn list_containers(
        &self,
        filter: ContainerFilter,
    ) -> OmniResult<Vec<DockerContainerSummary>>;
    /// 容器详情。
    async fn inspect_container(&self, id: &str) -> OmniResult<DockerContainerDetail>;
    /// 容器生命周期动作。
    async fn container_action(&self, id: &str, action: DockerContainerAction) -> OmniResult<()>;
    /// 拉取容器日志（一次性，tail 行）。流式由命令层另行处理。
    async fn container_logs(&self, id: &str, tail: i64) -> OmniResult<Vec<DockerLogLine>>;
    /// 镜像列表。
    async fn list_images(&self) -> OmniResult<Vec<DockerImageSummary>>;
    /// 删除镜像。
    async fn remove_image(&self, id: &str, force: bool) -> OmniResult<()>;
    /// 清理悬空镜像。
    async fn prune_images(&self) -> OmniResult<DockerPruneResult>;
    /// Compose 项目识别。
    async fn list_compose_projects(&self) -> OmniResult<Vec<DockerComposeProject>>;
}

/// 取容器 id 短格式（前 12 位）。
pub(crate) fn short_id(id: &str) -> String {
    let trimmed = id.strip_prefix("sha256:").unwrap_or(id);
    trimmed.chars().take(12).collect()
}

/// 归一化容器名：去掉前导 `/`。
pub(crate) fn normalize_name(name: &str) -> String {
    name.trim_start_matches('/').to_string()
}
