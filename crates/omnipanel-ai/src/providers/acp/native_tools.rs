//! 将 Cursor ACP 内置 shell 工具映射为 OmniPanel 终端客户端工具（对齐 cursor-gateway translator/native_tools）。

pub const TERMINAL_CLIENT_TOOL: &str = "omni_terminal_run_terminal_command";

/// 从 ACP `rawInput` 提取 shell 命令（支持 shellToolCall / command / script 等格式）。
pub fn extract_native_shell_command(raw: &serde_json::Value) -> Option<String> {
    if let Some(s) = raw.as_str() {
        let trimmed = s.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }

    if let Some(obj) = raw.as_object() {
        if let Some(cmd) = obj
            .get("command")
            .or_else(|| obj.get("cmd"))
            .and_then(|v| v.as_str())
        {
            let trimmed = cmd.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
        if let Some(script) = obj.get("script").and_then(|v| v.as_str()) {
            let trimmed = script.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
        if let Some(args) = obj.get("args") {
            if let Some(cmd) = extract_native_shell_command(args) {
                return Some(cmd);
            }
        }
        for wrapper in ["shellToolCall", "shell_tool_call", "bashToolCall"] {
            if let Some(inner) = obj.get(wrapper) {
                if let Some(cmd) = extract_native_shell_command(inner) {
                    return Some(cmd);
                }
            }
        }
    }

    None
}

fn normalize_native_tool_key(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .filter(|c| !c.is_whitespace() && *c != '_')
        .collect()
}

/// 判断 ACP 原生工具是否为 shell/终端类。
pub fn is_native_shell_tool(name: &str, title: &str) -> bool {
    for label in [name, title] {
        let key = normalize_native_tool_key(label);
        if key.is_empty() {
            continue;
        }
        match key.as_str() {
            "shell" | "bash" | "terminal" | "runterminalcmd" | "runcommand" | "run_shell_command"
            | "powershell" | "pwsh" | "cmd" => return true,
            _ => {
                if key.contains("shell") || key.contains("terminal") || key.contains("powershell") {
                    return true;
                }
            }
        }
    }
    false
}

/// 将原生 shell 工具映射为 `omni_terminal_run_terminal_command` 参数 JSON。
pub fn map_native_shell_to_terminal_tool(raw_input: &serde_json::Value) -> Option<String> {
    let command = extract_native_shell_command(raw_input)?;
    serde_json::to_string(&serde_json::json!({ "command": command })).ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_shell_tool_call_envelope() {
        let raw = serde_json::json!({
            "shellToolCall": { "args": { "command": "Get-Date -Format o" } }
        });
        assert_eq!(
            extract_native_shell_command(&raw).as_deref(),
            Some("Get-Date -Format o")
        );
    }

    #[test]
    fn extracts_powershell_script() {
        let raw = serde_json::json!({
            "script": "$lastYear = (Get-Date).AddYears(-1); Write-Output $lastYear"
        });
        assert!(extract_native_shell_command(&raw)
            .unwrap()
            .contains("AddYears"));
    }

    #[test]
    fn detects_powershell_title() {
        assert!(is_native_shell_tool("", "powershell"));
    }
}
