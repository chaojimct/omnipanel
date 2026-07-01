import { useMemo, useState } from "react";

import { useSettingsStore } from "../../stores/settingsStore";
import { Button } from "../../components/ui/Button";
import { TextInput } from "../../components/ui/TextInput";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { TraceListView } from "./TraceListView";

type Tab = "router" | "omnimcp" | "traces";

const MCP_CURSOR_SNIPPET = `{
  "mcpServers": {
    "omnipanel": {
      "url": "http://127.0.0.1:12756/mcp"
    }
  }
}`;

export function AiGatewaySettings() {
  const [tab, setTab] = useState<Tab>("router");
  const aiGatewayEnabled = useSettingsStore((s) => s.aiGatewayEnabled);
  const aiGatewayPort = useSettingsStore((s) => s.aiGatewayPort);
  const aiGatewayApiKey = useSettingsStore((s) => s.aiGatewayApiKey);
  const aiGatewayBindLan = useSettingsStore((s) => s.aiGatewayBindLan);
  const mcpExternalRequireApproval = useSettingsStore((s) => s.mcpExternalRequireApproval);
  const setAiGatewaySettings = useSettingsStore((s) => s.setAiGatewaySettings);

  const curlExample = useMemo(() => {
    const port = aiGatewayPort || 8765;
    const auth = aiGatewayApiKey.trim()
      ? `-H "Authorization: Bearer ${aiGatewayApiKey.trim()}" `
      : "";
    return `curl ${auth}-H "Content-Type: application/json" -H "X-Conversation-Id: demo" \\
  http://127.0.0.1:${port}/v1/chat/completions \\
  -d '{"model":"http:provider_1::gpt-4o-mini","stream":true,"messages":[{"role":"user","content":"hello"}]}'`;
  }, [aiGatewayPort, aiGatewayApiKey]);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div>
          <h2>AI 服务</h2>
          <p className="section-desc">Agent Router（:8765）与 OmniMCP（:12756）独立配置</p>
        </div>
      </div>

      <div className="settings-tabs" role="tablist">
        {(
          [
            ["router", "Agent Router"],
            ["omnimcp", "OmniMCP"],
            ["traces", "Trace 分析"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`settings-tab${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "router" ? (
        <div className="settings-subsection">
          <label className="settings-row">
            <input
              type="checkbox"
              checked={aiGatewayEnabled}
              onChange={(e) => setAiGatewaySettings({ aiGatewayEnabled: e.target.checked })}
            />
            <span>启用 Agent Router（默认 127.0.0.1:8765）</span>
          </label>
          <label className="settings-row">
            <span>端口</span>
            <TextInput
              type="number"
              value={String(aiGatewayPort)}
              onChange={(e) =>
                setAiGatewaySettings({ aiGatewayPort: Number(e.target.value) || 8765 })
              }
            />
          </label>
          <label className="settings-row">
            <span>API Key（可选）</span>
            <PasswordInput
              value={aiGatewayApiKey}
              onChange={(e) => setAiGatewaySettings({ aiGatewayApiKey: e.target.value })}
              placeholder="留空则不校验"
            />
          </label>
          <label className="settings-row">
            <input
              type="checkbox"
              checked={aiGatewayBindLan}
              onChange={(e) => setAiGatewaySettings({ aiGatewayBindLan: e.target.checked })}
            />
            <span>绑定 LAN（0.0.0.0，生产环境请谨慎）</span>
          </label>
          <div className="settings-subsection">
            <div className="settings-subsection-title">curl 示例</div>
            <pre className="settings-code-block">{curlExample}</pre>
            <Button variant="secondary" size="sm" onClick={() => void copyText(curlExample)}>
              复制 curl
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "omnimcp" ? (
        <div className="settings-subsection">
          <p className="section-desc">
            OmniMCP 监听 <code>http://127.0.0.1:12756/mcp</code>，供 Cursor / Claude Code 等外部 Agent 接入 DevOps 工具。
          </p>
          <label className="settings-row">
            <input
              type="checkbox"
              checked={mcpExternalRequireApproval}
              onChange={(e) =>
                setAiGatewaySettings({ mcpExternalRequireApproval: e.target.checked })
              }
            />
            <span>外部 MCP 调用终端工具需用户确认</span>
          </label>
          <div className="settings-subsection">
            <div className="settings-subsection-title">Cursor MCP 配置片段</div>
            <pre className="settings-code-block">{MCP_CURSOR_SNIPPET}</pre>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void copyText(MCP_CURSOR_SNIPPET)}
            >
              复制 JSON
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "traces" ? <TraceListView /> : null}
    </div>
  );
}
