use crate::state::AppState;
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::State;

static TERM_COUNTER: AtomicU64 = AtomicU64::new(1);

#[tauri::command]
pub async fn create_terminal(
    state: State<'_, AppState>,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    let id = format!("term-{}", TERM_COUNTER.fetch_add(1, Ordering::Relaxed));
    let session = crate::state::TerminalSession { id: id.clone() };
    state.terminals.lock().await.insert(id.clone(), session);
    tracing::info!("Created terminal {} ({}x{})", id, cols, rows);
    Ok(id)
}

#[tauri::command]
pub async fn write_terminal(
    state: State<'_, AppState>,
    id: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let terminals = state.terminals.lock().await;
    if terminals.contains_key(&id) {
        // Phase 2: write to PTY stdin
        tracing::debug!("Write {} bytes to terminal {}", data.len(), id);
        Ok(())
    } else {
        Err(format!("Terminal {} not found", id))
    }
}

#[tauri::command]
pub async fn resize_terminal(
    state: State<'_, AppState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let terminals = state.terminals.lock().await;
    if terminals.contains_key(&id) {
        tracing::debug!("Resize terminal {} to {}x{}", id, cols, rows);
        Ok(())
    } else {
        Err(format!("Terminal {} not found", id))
    }
}

#[tauri::command]
pub async fn close_terminal(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut terminals = state.terminals.lock().await;
    if terminals.remove(&id).is_some() {
        tracing::info!("Closed terminal {}", id);
        Ok(())
    } else {
        Err(format!("Terminal {} not found", id))
    }
}
