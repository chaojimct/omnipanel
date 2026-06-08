use serde::{Deserialize, Serialize};
use tauri::State;

use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct FileContent {
    pub path: String,
    pub content: String,
    pub language: String,
    #[specta(type = f64)]
    pub size: u64,
    pub modified: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    #[specta(type = f64)]
    pub opened_at: i64,
}

/// Detect language from file extension
fn detect_language(path: &str) -> String {
    let ext = path.rsplit('.').next().unwrap_or("").to_lowercase();
    match ext.as_str() {
        "rs" => "rust",
        "ts" | "tsx" => "typescript",
        "js" | "jsx" => "javascript",
        "py" => "python",
        "go" => "go",
        "java" => "java",
        "c" | "h" => "c",
        "cpp" | "cc" | "cxx" | "hpp" => "cpp",
        "cs" => "csharp",
        "rb" => "ruby",
        "php" => "php",
        "swift" => "swift",
        "kt" | "kts" => "kotlin",
        "json" => "json",
        "xml" | "html" | "htm" => "html",
        "css" | "scss" | "sass" | "less" => "css",
        "md" | "markdown" => "markdown",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "sql" => "sql",
        "sh" | "bash" | "zsh" => "shell",
        "ps1" => "powershell",
        "dockerfile" => "dockerfile",
        "r" => "r",
        "lua" => "lua",
        "vim" => "vim",
        "txt" | "log" => "plaintext",
        _ => "plaintext",
    }
    .to_string()
}

/// Open and read a file
#[tauri::command]
#[specta::specta]
pub async fn editor_open_file(path: String) -> Result<FileContent, String> {
    let metadata = std::fs::metadata(&path).map_err(|e| format!("Failed to stat file: {}", e))?;
    let content = std::fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_secs().to_string())
        });

    Ok(FileContent {
        path: path.clone(),
        content,
        language: detect_language(&path),
        size: metadata.len(),
        modified,
    })
}

/// Save content to a file
#[tauri::command]
#[specta::specta]
pub async fn editor_save_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, &content).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}

/// List recently opened files (from storage)
#[tauri::command]
#[specta::specta]
pub async fn editor_list_recent(state: State<'_, AppState>) -> Result<Vec<RecentFile>, String> {
    let storage = state.storage.lock().await;
    // Use a simple approach: read from a recent_files table or return empty
    // For now return empty - the frontend will track recent files in memory
    drop(storage);
    Ok(vec![])
}
