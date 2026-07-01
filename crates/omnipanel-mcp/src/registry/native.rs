use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use omnipanel_store::{KnowledgeEntry, Storage};
use serde_json::Value;
use tokio::sync::Mutex;

pub fn input_schema_for(tool_name: &str) -> Value {
    match tool_name {
        "omni_knowledge_create_document" => serde_json::json!({
            "type": "object",
            "properties": {
                "title": { "type": "string" },
                "content": { "type": "string" },
                "kind": { "type": "string" },
                "tags": { "type": "string" },
                "source": { "type": "string" },
                "env_tag": { "type": "string" },
                "risk_level": { "type": "string" },
                "parent_id": { "type": "string" }
            },
            "required": ["title", "content"]
        }),
        "omni_knowledge_remove_document" => serde_json::json!({
            "type": "object",
            "properties": {
                "id": { "type": "string" }
            },
            "required": ["id"]
        }),
        "omni_knowledge_list_documents" => serde_json::json!({
            "type": "object",
            "properties": {
                "kind": { "type": "string" },
                "tag": { "type": "string" }
            }
        }),
        _ => serde_json::json!({
            "type": "object",
            "properties": {}
        }),
    }
}

pub async fn execute(
    name: &str,
    arguments: Value,
    storage: Arc<Mutex<Storage>>,
) -> Result<(String, bool), String> {
    match name {
        "omni_knowledge_create_document" => create_document(arguments, storage).await,
        "omni_knowledge_remove_document" => remove_document(arguments, storage).await,
        "omni_knowledge_list_documents" => list_documents(arguments, storage).await,
        _ => Err(format!("未知 Native 工具: {name}")),
    }
}

async fn create_document(
    arguments: Value,
    storage: Arc<Mutex<Storage>>,
) -> Result<(String, bool), String> {
    let title = arguments
        .get("title")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let content = arguments
        .get("content")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    if title.trim().is_empty() {
        return Err("title 不能为空".to_string());
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();

    let id = format!("doc_{now}");
    let entry = KnowledgeEntry {
        id: id.clone(),
        kind: arguments
            .get("kind")
            .and_then(|v| v.as_str())
            .unwrap_or("snippet")
            .to_string(),
        title,
        content,
        tags: arguments
            .get("tags")
            .and_then(|v| v.as_str())
            .map(|t| t.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_default(),
        risk_level: arguments
            .get("risk_level")
            .and_then(|v| v.as_str())
            .unwrap_or("safe")
            .to_string(),
        source: arguments
            .get("source")
            .and_then(|v| v.as_str())
            .unwrap_or("ai")
            .to_string(),
        env_tag: arguments
            .get("env_tag")
            .and_then(|v| v.as_str())
            .unwrap_or("dev")
            .to_string(),
        language: String::new(),
        usage_count: 0,
        created_at: now as i64,
        updated_at: now as i64,
        parent_id: arguments
            .get("parent_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        node_type: "document".to_string(),
        sort_order: 0,
    };

    let storage = storage.lock().await;
    storage
        .save_knowledge(&entry)
        .map_err(|e| e.to_string())?;
    Ok((serde_json::json!({ "id": id }).to_string(), true))
}

async fn remove_document(
    arguments: Value,
    storage: Arc<Mutex<Storage>>,
) -> Result<(String, bool), String> {
    let id = arguments
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or_else(|| "id 不能为空".to_string())?;
    let storage = storage.lock().await;
    storage.delete_knowledge(id).map_err(|e| e.to_string())?;
    Ok((serde_json::json!({ "deleted": true, "id": id }).to_string(), true))
}

async fn list_documents(
    arguments: Value,
    storage: Arc<Mutex<Storage>>,
) -> Result<(String, bool), String> {
    let kind = arguments.get("kind").and_then(|v| v.as_str());
    let tag = arguments.get("tag").and_then(|v| v.as_str());
    let storage = storage.lock().await;
    let entries = storage
        .list_knowledge(kind, tag)
        .map_err(|e| e.to_string())?;
    Ok((
        serde_json::to_string(&entries).unwrap_or_else(|_| "[]".to_string()),
        true,
    ))
}
