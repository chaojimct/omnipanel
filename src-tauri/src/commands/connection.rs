use std::time::{SystemTime, UNIX_EPOCH};

use omnipanel_error::{ErrorCode, OmniError};
use omnipanel_store::{Connection, ConnectionKind};
use serde::Deserialize;
use serde_json::Value;
use tauri::State;

use crate::state::AppState;
use omnipanel_store::DbConnectionConfig;

#[derive(Debug, Deserialize)]
struct PanelConfig {
    address: String,
    key: String,
    #[serde(rename = "serviceType")]
    service_type: String,
}

fn panel_success_message(data: &Value) -> String {
    let hostname = data
        .get("data")
        .and_then(|d| d.get("hostname"))
        .or_else(|| data.get("hostname"))
        .and_then(|v| v.as_str())
        .unwrap_or("1Panel");
    format!("连接成功：{hostname}")
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or_default()
}

fn gen_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or_default();
    format!("conn-{nanos:x}")
}

/// 列出全部已保存连接。
#[tauri::command]
#[specta::specta]
pub async fn conn_list(state: State<'_, AppState>) -> Result<Vec<Connection>, OmniError> {
    let storage = state.storage.lock().await;
    storage.list_connections()
}

/// 保存（新建或更新）连接。id 为空时后端生成。
#[tauri::command]
#[specta::specta]
pub async fn conn_save(
    state: State<'_, AppState>,
    mut connection: Connection,
) -> Result<Connection, OmniError> {
    let now = now_secs();
    if connection.id.is_empty() {
        connection.id = gen_id();
    }
    if connection.created_at == 0 {
        connection.created_at = now;
    }
    connection.updated_at = now;

    let storage = state.storage.lock().await;
    storage.save_connection(&connection)?;
    Ok(connection)
}

/// 删除连接。
#[tauri::command]
#[specta::specta]
pub async fn conn_delete(state: State<'_, AppState>, id: String) -> Result<(), OmniError> {
    let storage = state.storage.lock().await;
    storage.delete_connection(&id)
}

/// 测试连接连通性。当前支持 database（MySQL）；其余类型将在对应里程碑接入。
#[tauri::command]
#[specta::specta]
pub async fn conn_test(
    state: State<'_, AppState>,
    connection: Connection,
) -> Result<String, OmniError> {
    match connection.kind {
        ConnectionKind::Database => {
            let db_config: DbConnectionConfig =
                serde_json::from_str(&connection.config).map_err(|e| {
                    OmniError::new(ErrorCode::InvalidInput, "数据库连接配置解析失败")
                        .with_cause(e.to_string())
                })?;
            let version = crate::commands::database::db_test_connection(db_config)
                .await
                .map_err(|e| {
                    OmniError::new(ErrorCode::Connection, "数据库连接测试失败").with_cause(e)
                })?;
            Ok(format!("连接成功：{version}"))
        }
        ConnectionKind::Panel => {
            let cfg: PanelConfig = serde_json::from_str(&connection.config).map_err(|e| {
                OmniError::new(ErrorCode::InvalidInput, "面板连接配置解析失败")
                    .with_cause(e.to_string())
            })?;
            if cfg.address.trim().is_empty() {
                return Err(OmniError::invalid_input("请填写服务器地址"));
            }
            if cfg.key.trim().is_empty() {
                return Err(OmniError::invalid_input("请填写 API 密钥"));
            }
            match cfg.service_type.as_str() {
                "1panel" => {
                    let data =
                        crate::panel::onepanel::test_connection(&cfg.address, &cfg.key).await?;
                    Ok(panel_success_message(&data))
                }
                "bt" => Err(OmniError::new(
                    ErrorCode::InvalidInput,
                    "宝塔面板连接测试尚未实现",
                )),
                other => Err(OmniError::invalid_input(format!(
                    "不支持的面板类型：{other}"
                ))),
            }
        }
        ConnectionKind::File => {
            crate::commands::file_manager::file_test_connection_config(&state, &connection).await
        }
        other => Err(OmniError::new(
            ErrorCode::InvalidInput,
            format!("暂不支持 {other:?} 类型的连接测试"),
        )),
    }
}
