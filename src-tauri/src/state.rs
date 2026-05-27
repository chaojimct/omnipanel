use std::collections::HashMap;
use std::process::Child;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::io::Write;

#[allow(dead_code)]
pub struct TerminalSession {
    pub id: String,
    pub stdin: Arc<Mutex<ChildStdin>>,
    pub child: Arc<Mutex<Child>>,
}

use std::process::ChildStdin;

impl TerminalSession {
    pub fn new(id: String, mut child: Child) -> Option<Self> {
        let stdin = child.stdin.take()?;
        Some(Self {
            id,
            stdin: Arc::new(Mutex::new(stdin)),
            child: Arc::new(Mutex::new(child)),
        })
    }

    pub async fn write(&self, data: &[u8]) -> Result<(), String> {
        let mut stdin = self.stdin.lock().await;
        stdin.write_all(data).map_err(|e| format!("write failed: {e}"))
    }

    #[allow(dead_code)]
    pub fn is_alive(&self) -> bool {
        self.child.try_lock().ok()
            .and_then(|mut c| c.try_wait().ok())
            .map(|s| s.is_none())
            .unwrap_or(false)
    }
}

pub struct AppState {
    pub terminals: Arc<Mutex<HashMap<String, TerminalSession>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            terminals: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
