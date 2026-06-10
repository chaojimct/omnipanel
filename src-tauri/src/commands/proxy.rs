use reqwest::Client;
use tauri::State;

use crate::state::{AppState, ProxyConfig};

/// Set the proxy configuration from frontend settings.
#[tauri::command]
#[specta::specta]
pub async fn set_proxy_config(
    state: State<'_, AppState>,
    config: ProxyConfig,
) -> Result<(), String> {
    *state.proxy_config.lock().await = config;
    Ok(())
}

/// Get the current proxy configuration (for backend use).
#[tauri::command]
#[specta::specta]
pub async fn get_proxy_config(state: State<'_, AppState>) -> Result<ProxyConfig, String> {
    Ok(state.proxy_config.lock().await.clone())
}

/// Build a reqwest `Client` configured with the given proxy settings.
pub fn build_proxy_client(config: &ProxyConfig) -> Client {
    if !config.enabled || config.host.is_empty() {
        return Client::new();
    }

    let proxy_url = format!("{}://{}:{}", config.protocol, config.host, config.port);
    let proxy = match reqwest::Proxy::all(&proxy_url) {
        Ok(p) => p,
        Err(_) => return Client::new(),
    };

    let proxy = if !config.username.is_empty() {
        proxy.basic_auth(&config.username, &config.password)
    } else {
        proxy
    };

    Client::builder()
        .proxy(proxy)
        .build()
        .unwrap_or_else(|_| Client::new())
}
