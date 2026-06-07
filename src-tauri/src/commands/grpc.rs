use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};

use tauri::State;

use crate::protocol::grpc::{
    GrpcConnectionConfig, GrpcMethodInfo, GrpcResponse, GrpcServiceInfo,
};
use crate::state::AppState;

static GRPC_COUNTER: AtomicU64 = AtomicU64::new(1);

// ──────────────────────────────────────────────
// gRPC Commands
// ──────────────────────────────────────────────

/// Connect to a gRPC endpoint and store the session.
#[tauri::command]
pub async fn grpc_connect(
    state: State<'_, AppState>,
    config: GrpcConnectionConfig,
) -> Result<String, String> {
    let id = format!("grpc-{}", GRPC_COUNTER.fetch_add(1, Ordering::Relaxed));

    let session = crate::protocol::grpc::GrpcSession::connect(config).await?;

    state
        .grpc_sessions
        .lock()
        .await
        .insert(id.clone(), session);

    tracing::info!("gRPC session created: {id}");
    Ok(id)
}

/// Execute a unary gRPC call.
#[tauri::command]
pub async fn grpc_call(
    state: State<'_, AppState>,
    connection_id: String,
    service: String,
    method: String,
    request_json: String,
    metadata: Option<HashMap<String, String>>,
) -> Result<GrpcResponse, String> {
    let sessions = state.grpc_sessions.lock().await;
    let session = sessions
        .get(&connection_id)
        .ok_or_else(|| format!("gRPC session {connection_id} not found"))?;

    session.call(&service, &method, &request_json, metadata).await
}

/// Attempt gRPC server reflection to list available services and methods.
#[tauri::command]
pub async fn grpc_reflect(
    state: State<'_, AppState>,
    connection_id: String,
) -> Result<Vec<GrpcServiceInfo>, String> {
    let sessions = state.grpc_sessions.lock().await;
    let session = sessions
        .get(&connection_id)
        .ok_or_else(|| format!("gRPC session {connection_id} not found"))?;

    session.reflect().await
}

/// Close a gRPC session.
#[tauri::command]
pub async fn grpc_close(state: State<'_, AppState>, connection_id: String) -> Result<(), String> {
    let mut sessions = state.grpc_sessions.lock().await;
    if sessions.remove(&connection_id).is_some() {
        tracing::info!("gRPC session closed: {connection_id}");
        Ok(())
    } else {
        Err(format!("gRPC session {connection_id} not found"))
    }
}
