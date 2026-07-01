use async_trait::async_trait;

#[async_trait]
pub trait ToolExecutor: Send + Sync {
    async fn execute(&self, tool_call_id: &str, name: &str, arguments: &str) -> (String, bool);
}
