use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[allow(dead_code)]
pub struct TerminalSession {
    pub id: String,
    // Terminal process handle will be added in Phase 2
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
