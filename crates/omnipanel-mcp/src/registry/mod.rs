pub mod native;

use std::sync::Arc;

use omnipanel_ai::types::{FunctionDef, ToolDef};
use omnipanel_store::Storage;
use serde_json::Value;
use tokio::sync::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToolExecutionKind {
    /// 后端 Rust 直接执行（知识库等）。
    Native,
    /// 需要前端上下文执行（终端 / 数据库等），统一走 pending 回传通道，
    /// 由前端在 `AiRuntimeProvider` 的 dispatchTool 中分派。
    UiDelegated,
}

#[derive(Debug, Clone)]
pub struct RegisteredTool {
    pub name: String,
    pub module_key: String,
    pub description: String,
    pub input_schema: Value,
    pub kind: ToolExecutionKind,
}

const NATIVE_TOOL_NAMES: &[&str] = &[
    "omni_knowledge_create_document",
    "omni_knowledge_remove_document",
    "omni_knowledge_list_documents",
];

pub struct ToolRegistry {
    storage: Arc<Mutex<Storage>>,
}

impl ToolRegistry {
    pub fn new(storage: Arc<Mutex<Storage>>) -> Self {
        Self { storage }
    }

    pub fn is_native_tool(name: &str) -> bool {
        NATIVE_TOOL_NAMES.contains(&name)
    }

    /// 克隆 storage 句柄用于隔离执行（不持有 `McpManager` 锁）。
    pub fn storage_handle(&self) -> Arc<Mutex<Storage>> {
        self.storage.clone()
    }

    pub async fn list_enabled(&self, module_filter: Option<&str>) -> Result<Vec<RegisteredTool>, String> {
        let storage = self.storage.lock().await;
        let records = storage
            .mcp_tool_list()
            .map_err(|e| e.to_string())?
            .into_iter()
            .filter(|r| r.enabled && storage.mcp_tool_is_available(&r.tool_name).unwrap_or(false))
            .collect::<Vec<_>>();

        let mut tools = Vec::new();
        for record in records {
            if let Some(filter) = module_filter {
                if filter != "master" && record.module_key != filter {
                    continue;
                }
            }
            let kind = if Self::is_native_tool(&record.tool_name) {
                ToolExecutionKind::Native
            } else {
                ToolExecutionKind::UiDelegated
            };
            tools.push(RegisteredTool {
                name: record.tool_name.clone(),
                module_key: record.module_key.clone(),
                description: record.description.clone(),
                input_schema: native::input_schema_for(&record.tool_name),
                kind,
            });
        }
        Ok(tools)
    }

    pub async fn to_tool_defs(&self, module_filter: Option<&str>) -> Result<Vec<ToolDef>, String> {
        Ok(self
            .list_enabled(module_filter)
            .await?
            .into_iter()
            .map(|tool| ToolDef {
                tool_type: "function".to_string(),
                function: FunctionDef {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.input_schema,
                },
            })
            .collect())
    }

    /// 在不持有 `McpManager` 锁的情况下执行 Native 工具（后端直执）。
    ///
    /// UiDelegated 工具（终端 / 数据库等）不再由后端执行，而是统一通过
    /// `pending_internal_tool_results` 挂起、由前端 dispatchTool 回传结果，
    /// 因此这里遇到 UiDelegated 工具直接返回错误（正常路径不会到达）。
    pub async fn execute_isolated(
        storage: Arc<Mutex<Storage>>,
        name: &str,
        arguments: Value,
    ) -> Result<(String, bool), String> {
        {
            let storage = storage.lock().await;
            if !storage.mcp_tool_is_available(name).unwrap_or(false) {
                return Err(format!("MCP 工具不可用: {name}"));
            }
        }

        if Self::is_native_tool(name) {
            return native::execute(name, arguments, storage).await;
        }

        Err(format!(
            "工具 {name} 为 UiDelegated，应由前端 dispatchTool 执行，不应在后端直执"
        ))
    }
}
