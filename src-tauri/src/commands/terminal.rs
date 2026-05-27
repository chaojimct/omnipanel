use crate::state::AppState;
use serde::Serialize;
use std::io::Read;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{AppHandle, Emitter, State};

static TERM_COUNTER: AtomicU64 = AtomicU64::new(1);

#[derive(Clone, Serialize)]
pub struct TerminalOutputPayload {
    pub id: String,
    pub data: Vec<u8>,
}

#[derive(Clone, Serialize)]
pub struct TerminalExitedPayload {
    pub id: String,
    pub code: Option<i32>,
}

#[tauri::command]
pub async fn create_terminal(
    app: AppHandle,
    state: State<'_, AppState>,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    let id = format!("term-{}", TERM_COUNTER.fetch_add(1, Ordering::Relaxed));

    let shell = if cfg!(target_os = "windows") {
        std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string())
    } else {
        std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    };

    let mut child = Command::new(&shell)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to spawn shell: {e}"))?;

    let stdout = child.stdout.take().ok_or("no stdout")?;
    let stderr = child.stderr.take().ok_or("no stderr")?;

    let session = crate::state::TerminalSession::new(id.clone(), child)
        .ok_or("failed to take stdin")?;

    let mut terminals = state.terminals.lock().await;
    terminals.insert(id.clone(), session);

    let event_id = id.clone();
    let app_clone = app.clone();

    tokio::spawn(async move {
        let combined = stdout.chain(stderr);
        let mut reader = std::io::BufReader::new(combined);
        let mut buf = [0u8; 4096];

        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    let _ = app_clone.emit("terminal-exited", TerminalExitedPayload {
                        id: event_id.clone(),
                        code: None,
                    });
                    break;
                }
                Ok(n) => {
                    let data = buf[..n].to_vec();
                    let _ = app_clone.emit("terminal-output", TerminalOutputPayload {
                        id: event_id.clone(),
                        data: data.clone(),
                    });
                }
                Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(_) => break,
            }
        }
    });

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
    let session = terminals.get(&id).ok_or_else(|| format!("Terminal {id} not found"))?;
    session.write(&data).await
}

#[tauri::command]
pub async fn resize_terminal(
    state: State<'_, AppState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let terminals = state.terminals.lock().await;
    if !terminals.contains_key(&id) {
        return Err(format!("Terminal {id} not found"));
    }
    // Send terminal resize escape sequence via stdin
    let resize_seq = format!("\u{1b}[8;{};{}t", rows, cols);
    if let Some(session) = terminals.get(&id) {
        session.write(resize_seq.as_bytes()).await?;
    }
    tracing::debug!("Resize terminal {} to {}x{}", id, cols, rows);
    Ok(())
}

#[tauri::command]
pub async fn close_terminal(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut terminals = state.terminals.lock().await;
    if let Some(session) = terminals.remove(&id) {
        let mut child = session.child.lock().await;
        let _ = child.kill();
        let _ = child.wait();
        tracing::info!("Closed terminal {}", id);
        Ok(())
    } else {
        Err(format!("Terminal {id} not found"))
    }
}
