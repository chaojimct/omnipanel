import { useEffect, useState } from "react";

import { useSettingsStore } from "../../stores/settingsStore";

/** 状态栏 Agent Router / OmniMCP 指示点 */
export function StatusBarAiServicesIndicator() {
  const port = useSettingsStore((s) => s.aiGatewayPort);
  const enabled = useSettingsStore((s) => s.aiGatewayEnabled);
  const [routerOk, setRouterOk] = useState(false);
  const [mcpOk, setMcpOk] = useState(false);

  useEffect(() => {
    const check = () => {
      if (enabled) {
        void fetch(`http://127.0.0.1:${port || 8765}/gateway/healthz`)
          .then((r) => setRouterOk(r.ok))
          .catch(() => setRouterOk(false));
      } else {
        setRouterOk(false);
      }
      // OmniMCP /mcp 是 POST 端点：任何响应（含 4xx/405）都说明服务在监听。
      void fetch("http://127.0.0.1:12756/mcp", { method: "GET" })
        .then(() => setMcpOk(true))
        .catch(() => setMcpOk(false));
    };
    check();
    const timer = window.setInterval(check, 15000);
    return () => window.clearInterval(timer);
  }, [enabled, port]);

  return (
    <>
      <span
        className="statusbar-dot"
        data-level={enabled && routerOk ? "ok" : "off"}
        title={`Agent Router ${enabled && routerOk ? "运行中" : "未就绪"} (:${port || 8765})`}
        aria-hidden
      />
      <span
        className="statusbar-dot"
        data-level={mcpOk ? "ok" : "off"}
        title={`OmniMCP ${mcpOk ? "运行中" : "未就绪"} (:12756)`}
        aria-hidden
      />
    </>
  );
}
