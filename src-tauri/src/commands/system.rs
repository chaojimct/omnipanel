use omnipanel_error::OmniError;
use omnipanel_ssh::{SshProcessDetail, SshProcessInfo};
use std::collections::BTreeSet;

use crate::background::{HostSystemStats, local_system};

fn collect_system_font_families(monospace_only: bool) -> Vec<String> {
    let mut db = fontdb::Database::new();
    db.load_system_fonts();
    let mut families = BTreeSet::new();
    for face in db.faces() {
        if monospace_only && !face.monospaced {
            continue;
        }
        for (family, _) in &face.families {
            let name = family.trim();
            if !name.is_empty() {
                families.insert(name.to_string());
            }
        }
    }
    families.into_iter().collect()
}

/// 枚举本机已安装字体族名（可选仅等宽字体）。
#[tauri::command]
#[specta::specta]
pub async fn list_system_fonts(monospace_only: Option<bool>) -> Result<Vec<String>, OmniError> {
    let mono = monospace_only.unwrap_or(false);
    tokio::task::spawn_blocking(move || collect_system_font_families(mono))
        .await
        .map_err(|e| OmniError::internal(format!("字体枚举失败: {e}")))
}

/// 拉取本机 CPU / 内存 / 磁盘指标。
#[tauri::command]
#[specta::specta]
pub async fn local_fetch_stats() -> Result<HostSystemStats, OmniError> {
    tokio::task::spawn_blocking(local_system::fetch_stats)
        .await
        .map_err(|e| OmniError::internal(format!("本机指标采集失败: {e}")))?
}

/// 列出本机进程。
#[tauri::command]
#[specta::specta]
pub async fn local_list_processes() -> Result<Vec<SshProcessInfo>, OmniError> {
    tokio::task::spawn_blocking(local_system::list_processes)
        .await
        .map_err(|e| OmniError::internal(format!("本机进程列表采集失败: {e}")))?
}

/// 查询本机进程详情。
#[tauri::command]
#[specta::specta]
pub async fn local_process_detail(pid: u32) -> Result<SshProcessDetail, OmniError> {
    tokio::task::spawn_blocking(move || local_system::process_detail(pid))
        .await
        .map_err(|e| OmniError::internal(format!("本机进程详情采集失败: {e}")))?
}

/// 强制终止本机进程。
#[tauri::command]
#[specta::specta]
pub async fn local_kill_process(pid: u32) -> Result<(), OmniError> {
    tokio::task::spawn_blocking(move || local_system::kill_process(pid))
        .await
        .map_err(|e| OmniError::internal(format!("终止本机进程失败: {e}")))?
}
