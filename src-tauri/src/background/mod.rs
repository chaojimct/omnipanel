mod ssh_pool;

use std::collections::HashMap;
use std::sync::Arc;

use omnipanel_store::Storage;
use tokio::sync::Mutex;

use omnipanel_ssh::SshSession;
use crate::log_store::LogStore;
use ssh_pool::SshPool;

/// Background scheduler — manages the SSH connection pool and periodic tasks.
pub struct BackgroundScheduler;

impl BackgroundScheduler {
    /// Start the SSH connection pool and background loops.
    pub fn start(
        storage: Arc<Mutex<Storage>>,
        log_store: LogStore,
        pool_sessions: Arc<Mutex<HashMap<String, Arc<SshSession>>>>,
        app_handle: tauri::AppHandle,
    ) {
        let pool = SshPool::new(log_store, pool_sessions);

        tauri::async_runtime::spawn(async move {
            pool.start(storage, app_handle).await;
        });

        tracing::info!("Background scheduler started");
    }
}
