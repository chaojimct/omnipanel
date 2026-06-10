use anyhow::Result;
use async_trait::async_trait;
use futures::Stream;
use reqwest::Client;
use serde::Deserialize;
use std::pin::Pin;

use crate::ir::StreamEvent;
use crate::provider::AiProvider;
use crate::providers::openai::OpenAiProvider;
use crate::types::{ChatRequest, ChatResponse, ModelInfo};

/// Ollama-native provider with automatic local model discovery.
///
/// Uses Ollama's OpenAI-compatible endpoint (`/v1/chat/completions`) and
/// discovers locally-running models via the native `/api/tags` endpoint.
pub struct OllamaProvider {
    inner: OpenAiProvider,
}

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModel>,
}

#[derive(Deserialize)]
struct OllamaModel {
    name: String,
}

impl OllamaProvider {
    /// Default base URL for Ollama's OpenAI-compatible endpoint.
    const DEFAULT_BASE_URL: &'static str = "http://localhost:11434/v1";

    /// Create an Ollama provider with manually specified models.
    pub fn new(models: Vec<ModelInfo>) -> Self {
        Self::with_client(models, None)
    }

    /// Create an Ollama provider with a pre-configured reqwest Client.
    pub fn with_client(models: Vec<ModelInfo>, client: Option<Client>) -> Self {
        Self {
            inner: OpenAiProvider::with_client(
                "ollama",
                "ollama",
                Self::DEFAULT_BASE_URL,
                models,
                client,
            ),
        }
    }

    /// Create an Ollama provider with a custom base URL.
    pub fn with_base_url(base_url: &str, models: Vec<ModelInfo>) -> Self {
        Self::with_base_url_client(base_url, models, None)
    }

    /// Create an Ollama provider with a custom base URL and pre-configured client.
    pub fn with_base_url_client(
        base_url: &str,
        models: Vec<ModelInfo>,
        client: Option<Client>,
    ) -> Self {
        Self {
            inner: OpenAiProvider::with_client("ollama", "ollama", base_url, models, client),
        }
    }

    /// Try to create an Ollama provider by discovering local models.
    ///
    /// Sends `GET {base_url}/api/tags` (Ollama's native API) to enumerate
    /// locally-running models.  Returns `None` if Ollama is not reachable or
    /// the response cannot be parsed.
    pub async fn with_discovery(base_url: &str) -> Option<Self> {
        let client = Client::new();
        let tags_url = format!(
            "{}/api/tags",
            base_url.trim_end_matches("/").trim_end_matches("/v1")
        );

        let resp = client
            .get(&tags_url)
            .timeout(std::time::Duration::from_secs(3))
            .send()
            .await
            .ok()?;

        if !resp.status().is_success() {
            return None;
        }

        let data: OllamaTagsResponse = resp.json().await.ok()?;
        let models: Vec<ModelInfo> = data
            .models
            .into_iter()
            .map(|m| {
                // Strip ":latest" suffix for cleaner display
                let display_name = m
                    .name
                    .strip_suffix(":latest")
                    .unwrap_or(&m.name)
                    .to_string();
                ModelInfo {
                    id: m.name.clone(),
                    name: display_name,
                    provider: "ollama".to_string(),
                    context_window: None,
                }
            })
            .collect();

        if models.is_empty() {
            return None;
        }

        Some(Self::with_base_url(base_url, models))
    }

    /// Convenience: try default localhost discovery, fall back to empty model list.
    pub async fn discover_default() -> Option<Self> {
        Self::with_discovery("http://localhost:11434").await
    }
}

#[async_trait]
impl AiProvider for OllamaProvider {
    fn name(&self) -> &str {
        "ollama"
    }

    fn models(&self) -> Vec<ModelInfo> {
        self.inner.models()
    }

    async fn chat(&self, request: ChatRequest) -> Result<ChatResponse> {
        self.inner.chat(request).await
    }

    async fn chat_stream(
        &self,
        request: ChatRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<StreamEvent>> + Send>>> {
        self.inner.chat_stream(request).await
    }
}
