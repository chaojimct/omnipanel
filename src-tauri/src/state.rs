use std::collections::HashMap;
use std::sync::Arc;

use tauri::AppHandle;
use tokio::sync::Mutex;

use crate::commands::database::DbConnectionConfig;
use crate::protocol::mqtt::MqttSession;
use crate::protocol::serial::SerialSession;
use crate::protocol::ws::WsSession;
use omnipanel_core::terminal::Terminal;

use omnipanel_ai::provider::AiProviderRegistry;

pub struct AppState {
    pub serial_sessions: Arc<Mutex<HashMap<String, SerialSession>>>,
    pub ws_sessions: Arc<Mutex<HashMap<String, WsSession>>>,
    pub mqtt_sessions: Arc<Mutex<HashMap<String, MqttSession>>>,
    pub terminal_sessions: Arc<Mutex<HashMap<String, Terminal>>>,
    pub app_handle: AppHandle,
    pub ai_registry: Arc<Mutex<AiProviderRegistry>>,
    pub current_provider: Arc<Mutex<Option<String>>>,
    pub current_model: Arc<Mutex<Option<String>>>,
    pub db_connections: Arc<Mutex<HashMap<String, DbConnectionConfig>>>,
}

impl AppState {
    pub fn new(app_handle: AppHandle) -> Self {
        Self {
            serial_sessions: Arc::new(Mutex::new(HashMap::new())),
            ws_sessions: Arc::new(Mutex::new(HashMap::new())),
            mqtt_sessions: Arc::new(Mutex::new(HashMap::new())),
            terminal_sessions: Arc::new(Mutex::new(HashMap::new())),
            app_handle,
            ai_registry: Arc::new(Mutex::new(AiProviderRegistry::new())),
            current_provider: Arc::new(Mutex::new(None)),
            current_model: Arc::new(Mutex::new(None)),
            db_connections: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}
