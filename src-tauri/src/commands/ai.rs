use serde::{Deserialize, Serialize};
use tauri::{State, ipc::Channel};

use crate::state::AppState;
use omnipanel_ai::ir::{StopReason, StreamEvent, ToolStatus};
use omnipanel_ai::types::{
    ChatMessage, ChatRequest, FunctionCall, FunctionDef, ModelInfo, Role, ToolCall, ToolDef,
};

#[derive(Serialize, Deserialize)]
pub struct ProviderInfo {
    pub id: String,
    pub name: String,
    pub models: Vec<ModelInfo>,
}

/// Maximum number of tool-calling iterations to prevent infinite loops.
const MAX_TOOL_ITERATIONS: usize = 10;

/// Build the default set of tools available to the AI.
/// This includes the built-in `search_knowledge` tool for RAG.
fn build_default_tools() -> Vec<ToolDef> {
    vec![ToolDef {
        tool_type: "function".to_string(),
        function: FunctionDef {
            name: "search_knowledge".to_string(),
            description: "Search the knowledge base for relevant information including code snippets, troubleshooting cases, and documented procedures. Use this when the user asks about stored knowledge, debugging solutions, configuration examples, or any documented best practices.".to_string(),
            parameters: serde_json::json!({
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to find relevant knowledge entries"
                    },
                    "kind": {
                        "type": "string",
                        "enum": ["snippet", "case", "ai"],
                        "description": "Optional filter by knowledge entry type: snippet (code), case (troubleshooting), ai (AI-generated)"
                    }
                },
                "required": ["query"]
            }),
        },
    }]
}

/// Execute a tool by name and return the result as a string.
async fn execute_tool(state: &AppState, name: &str, arguments: &str) -> (String, bool) {
    match name {
        "search_knowledge" => {
            let args: serde_json::Value = serde_json::from_str(arguments).unwrap_or_default();
            let query = args
                .get("query")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let kind = args
                .get("kind")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            if query.trim().is_empty() {
                return ("Error: query parameter is required".to_string(), false);
            }

            let storage = state.storage.lock().await;
            match storage.search_knowledge(&query, kind.as_deref()) {
                Ok(results) => {
                    if results.is_empty() {
                        ("No matching knowledge entries found.".to_string(), true)
                    } else {
                        let formatted: Vec<serde_json::Value> = results
                            .iter()
                            .take(5)
                            .map(|r| {
                                serde_json::json!({
                                    "id": r.entry.id,
                                    "title": r.entry.title,
                                    "kind": r.entry.kind,
                                    "snippet": r.snippet,
                                    "tags": r.entry.tags,
                                    "risk_level": r.entry.risk_level,
                                    "env_tag": r.entry.env_tag,
                                })
                            })
                            .collect();
                        (
                            serde_json::to_string_pretty(&formatted).unwrap_or_default(),
                            true,
                        )
                    }
                }
                Err(e) => (format!("Knowledge search error: {}", e), false),
            }
        }
        _ => (format!("Unknown tool: {}", name), false),
    }
}

/// Send a message to the current AI provider and stream back events.
///
/// Implements a tool-calling loop: when the AI requests tool calls, the backend
/// executes them (e.g. `search_knowledge`) and feeds results back to the AI
/// for the next response turn. This continues until the AI produces a final
/// text response or the maximum iteration limit is reached.
///
/// When `history` is provided, those messages are prepended to the request so the
/// LLM sees the full multi-turn conversation.  If `history` is `None` (or empty)
/// the request falls back to a single-message payload (backward compatible).
#[tauri::command]
pub async fn ai_send_message(
    state: State<'_, AppState>,
    _conversation_id: String,
    content: String,
    on_event: Channel<StreamEvent>,
    history: Option<Vec<ChatMessage>>,
) -> Result<(), String> {
    let provider_name = state
        .current_provider
        .lock()
        .await
        .clone()
        .ok_or("No AI provider selected")?;

    let model = state
        .current_model
        .lock()
        .await
        .clone()
        .ok_or("No AI model selected")?;

    let registry = state.ai_registry.lock().await;
    let provider = registry
        .get(&provider_name)
        .ok_or_else(|| format!("Provider '{}' not found", provider_name))?;

    // Build available tools (currently only search_knowledge)
    let tools = build_default_tools();

    // Build the message list: conversation history (if any) + the new user message
    let mut messages: Vec<ChatMessage> = history.unwrap_or_default();
    messages.push(ChatMessage {
        role: Role::User,
        content,
        tool_call_id: None,
        tool_calls: None,
        name: None,
    });

    // Tool calling loop: keep executing tools until the AI gives a final response
    for _iteration in 0..MAX_TOOL_ITERATIONS {
        let request = ChatRequest {
            model: model.clone(),
            messages: messages.clone(),
            stream: true,
            tools: Some(tools.clone()),
            temperature: None,
            max_tokens: None,
        };

        let mut stream = provider
            .chat_stream(request)
            .await
            .map_err(|e| e.to_string())?;

        // Collect tool calls and content from this streaming turn
        let mut accumulated_tool_calls: Vec<(String, String, String)> = Vec::new(); // (id, name, args)
        let mut stop_reason = StopReason::EndTurn;
        let mut assistant_content = String::new();
        let mut pending_done: Option<StreamEvent> = None;

        use futures::StreamExt;
        while let Some(event) = stream.next().await {
            match event {
                Ok(evt) => {
                    match &evt {
                        StreamEvent::ToolCall { id, name, arguments } => {
                            if !name.is_empty() {
                                // New tool call
                                accumulated_tool_calls
                                    .push((id.clone(), name.clone(), arguments.clone()));
                            } else if !arguments.is_empty() {
                                // Argument continuation for the last tool call
                                if let Some(last) = accumulated_tool_calls.last_mut() {
                                    last.2.push_str(arguments);
                                }
                            }
                            // Forward to frontend
                            let _ = on_event.send(evt);
                        }
                        StreamEvent::Done { stop_reason: sr } => {
                            stop_reason = sr.clone();
                            // Buffer the done event; only forward if it's the final one
                            pending_done = Some(evt);
                        }
                        StreamEvent::ContentDelta { text } => {
                            assistant_content.push_str(text);
                            let _ = on_event.send(evt);
                        }
                        _ => {
                            let _ = on_event.send(evt);
                        }
                    }
                }
                Err(e) => {
                    let _ = on_event.send(StreamEvent::Error {
                        message: e.to_string(),
                    });
                    break;
                }
            }
        }

        // If the AI wants to use tools, execute them and loop
        if stop_reason == StopReason::ToolUse && !accumulated_tool_calls.is_empty() {
            // Add assistant message with tool_calls to history
            let tool_calls: Vec<ToolCall> = accumulated_tool_calls
                .iter()
                .map(|(id, name, args)| ToolCall {
                    id: id.clone(),
                    call_type: "function".to_string(),
                    function: FunctionCall {
                        name: name.clone(),
                        arguments: args.clone(),
                    },
                })
                .collect();

            messages.push(ChatMessage {
                role: Role::Assistant,
                content: assistant_content.clone(),
                tool_call_id: None,
                tool_calls: Some(tool_calls.clone()),
                name: None,
            });

            // Execute each tool and add results
            for tc in &tool_calls {
                let (result, success) =
                    execute_tool(&state, &tc.function.name, &tc.function.arguments).await;

                // Send tool call update with result to frontend
                let _ = on_event.send(StreamEvent::ToolCallUpdate {
                    id: tc.id.clone(),
                    status: if success {
                        ToolStatus::Completed
                    } else {
                        ToolStatus::Failed
                    },
                    result: Some(result.clone()),
                });

                // Add tool result message for the AI
                messages.push(ChatMessage {
                    role: Role::Tool,
                    content: result,
                    tool_call_id: Some(tc.id.clone()),
                    tool_calls: None,
                    name: Some(tc.function.name.clone()),
                });
            }

            // Clear for the next iteration
            assistant_content.clear();
            continue;
        }

        // Normal end — forward the buffered Done event and break
        if let Some(done_evt) = pending_done {
            let _ = on_event.send(done_evt);
        }
        break;
    }

    Ok(())
}

/// List all available models from all registered providers.
#[tauri::command]
pub async fn ai_list_models(state: State<'_, AppState>) -> Result<Vec<ModelInfo>, String> {
    let registry = state.ai_registry.lock().await;
    Ok(registry.all_models())
}

/// Set the active AI provider and model.
#[tauri::command]
pub async fn ai_set_provider(
    state: State<'_, AppState>,
    provider_id: String,
    model_id: String,
) -> Result<(), String> {
    let registry = state.ai_registry.lock().await;
    if registry.get(&provider_id).is_none() {
        return Err(format!("Provider '{}' not found", provider_id));
    }
    drop(registry);

    *state.current_provider.lock().await = Some(provider_id);
    *state.current_model.lock().await = Some(model_id);
    Ok(())
}

/// List all registered providers with their models.
#[tauri::command]
pub async fn ai_list_providers(state: State<'_, AppState>) -> Result<Vec<ProviderInfo>, String> {
    let registry = state.ai_registry.lock().await;
    let providers: Vec<ProviderInfo> = registry
        .list()
        .into_iter()
        .map(|name| ProviderInfo {
            id: name.to_string(),
            name: name.to_string(),
            models: registry.get(name).map(|p| p.models()).unwrap_or_default(),
        })
        .collect();
    Ok(providers)
}

/// Add an ACP CLI agent as a provider.
#[tauri::command]
pub async fn ai_add_acp_agent(
    state: State<'_, AppState>,
    binary_path: String,
    name: String,
) -> Result<(), String> {
    use omnipanel_ai::providers::acp::types::AcpProfile;
    use omnipanel_ai::providers::acp::AcpProvider;

    let mut provider =
        AcpProvider::new(&name, &binary_path, vec![], AcpProfile::ClientTools, None);

    provider
        .initialize()
        .await
        .map_err(|e| format!("Failed to initialize ACP agent: {}", e))?;

    let mut registry = state.ai_registry.lock().await;
    registry.register(Box::new(provider));

    Ok(())
}

/// Get the current active provider and model.
#[tauri::command]
pub async fn ai_get_active(state: State<'_, AppState>) -> Result<Option<(String, String)>, String> {
    let provider = state.current_provider.lock().await.clone();
    let model = state.current_model.lock().await.clone();
    match (provider, model) {
        (Some(p), Some(m)) => Ok(Some((p, m))),
        _ => Ok(None),
    }
}
