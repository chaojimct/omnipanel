#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BackendKind {
    Http,
    /// 第三方 CLI 对话提供者
    Cli,
    /// 遗留 ACP 别名，解析后映射为 Cli
    Acp,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedBackendId {
    pub kind: BackendKind,
    /// HTTP: provider registry id; CLI/ACP: provider id
    pub provider_id: String,
    /// HTTP/CLI: model name; ACP 遗留为空
    pub model_id: String,
}

/// Parse `http:{providerId}::{modelId}`, `cli:{providerId}::{modelId}`, or `acp:{agentKind}`.
pub fn parse_backend_id(backend_id: &str) -> Result<ParsedBackendId, String> {
    let trimmed = backend_id.trim();
    if trimmed.is_empty() {
        return Err("backend_id 不能为空".to_string());
    }

    if let Some(rest) = trimmed.strip_prefix("http:") {
        let (provider_id, model_id) = split_provider_model(rest)?;
        if provider_id.is_empty() || model_id.is_empty() {
            return Err(format!("无效的 HTTP backend_id: {backend_id}"));
        }
        return Ok(ParsedBackendId {
            kind: BackendKind::Http,
            provider_id,
            model_id,
        });
    }

    if let Some(rest) = trimmed.strip_prefix("cli:") {
        let (provider_id, model_id) = split_provider_model(rest)?;
        if provider_id.is_empty() || model_id.is_empty() {
            return Err(format!("无效的 CLI backend_id: {backend_id}"));
        }
        return Ok(ParsedBackendId {
            kind: BackendKind::Cli,
            provider_id,
            model_id,
        });
    }

    if let Some(agent_kind) = trimmed.strip_prefix("acp:") {
        let agent_kind = agent_kind.trim();
        if agent_kind.is_empty() {
            return Err(format!("无效的 ACP backend_id: {backend_id}"));
        }
        return Ok(ParsedBackendId {
            kind: BackendKind::Acp,
            provider_id: agent_kind.to_string(),
            model_id: String::new(),
        });
    }

    Err(format!(
        "无法解析 backend_id: {backend_id}（期望 http:provider::model、cli:provider::model 或 acp:agent）"
    ))
}

/// 将 ACP 遗留 backend 规范化为 CLI provider + model。
pub fn normalize_cli_backend(parsed: &ParsedBackendId) -> Result<(String, String), String> {
    match parsed.kind {
        BackendKind::Cli => {
            if parsed.model_id.is_empty() {
                return Err("CLI backend 缺少 model".to_string());
            }
            Ok((parsed.provider_id.clone(), parsed.model_id.clone()))
        }
        BackendKind::Acp => {
            let model = if parsed.model_id.is_empty() {
                "default".to_string()
            } else {
                parsed.model_id.clone()
            };
            Ok((parsed.provider_id.clone(), model))
        }
        BackendKind::Http => Err("非 CLI backend".to_string()),
    }
}

fn split_provider_model(rest: &str) -> Result<(String, String), String> {
    const SEP: &str = "::";
    let sep_pos = rest
        .rfind(SEP)
        .ok_or_else(|| format!("backend_id 缺少 '{SEP}' 分隔符: {rest}"))?;
    let provider_id = rest[..sep_pos].trim().to_string();
    let model_id = rest[sep_pos + SEP.len()..].trim().to_string();
    Ok((provider_id, model_id))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_http_backend() {
        let parsed = parse_backend_id("http:provider_1::gpt-4o-mini").unwrap();
        assert_eq!(parsed.kind, BackendKind::Http);
        assert_eq!(parsed.provider_id, "provider_1");
        assert_eq!(parsed.model_id, "gpt-4o-mini");
    }

    #[test]
    fn parse_cli_backend() {
        let parsed = parse_backend_id("cli:cursor::gpt-4").unwrap();
        assert_eq!(parsed.kind, BackendKind::Cli);
        assert_eq!(parsed.provider_id, "cursor");
        assert_eq!(parsed.model_id, "gpt-4");
    }

    #[test]
    fn parse_acp_backend() {
        let parsed = parse_backend_id("acp:cursor").unwrap();
        assert_eq!(parsed.kind, BackendKind::Acp);
        assert_eq!(parsed.provider_id, "cursor");
    }
}
