#[derive(Debug, Clone, PartialEq, Eq)]
pub enum BackendKind {
    Http,
    Acp,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedBackendId {
    pub kind: BackendKind,
    /// HTTP: provider registry id; ACP: agent kind (e.g. cursor)
    pub provider_id: String,
    /// HTTP: model name; ACP: unused (empty)
    pub model_id: String,
}

/// Parse `http:{providerId}::{modelId}` or `acp:{agentKind}`.
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
        "无法解析 backend_id: {backend_id}（期望 http:provider::model 或 acp:agent）"
    ))
}

fn split_provider_model(rest: &str) -> Result<(String, String), String> {
    const SEP: &str = "::";
    let sep_pos = rest
        .rfind(SEP)
        .ok_or_else(|| format!("HTTP backend_id 缺少 '{SEP}' 分隔符: http:{rest}"))?;
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
    fn parse_acp_backend() {
        let parsed = parse_backend_id("acp:cursor").unwrap();
        assert_eq!(parsed.kind, BackendKind::Acp);
        assert_eq!(parsed.provider_id, "cursor");
    }
}
