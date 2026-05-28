import { useState } from "react";
import { DockLayout, DockPanel, DockHandle } from "../../components/dock";
import { HttpPanel } from "./HttpPanel";
import { WsPanel } from "./WsPanel";
import { MqttPanel } from "./MqttPanel";
import { SerialPanel } from "./SerialPanel";

type Protocol = "http" | "ws" | "mqtt" | "serial";

const PROTOCOLS: { id: Protocol; label: string; icon: string }[] = [
  { id: "http", label: "HTTP / REST", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { id: "ws", label: "WebSocket", icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM2 12h20" },
  { id: "mqtt", label: "MQTT", icon: "M3 3v18h18M18 17V9M13 17V5M8 17v-3" },
  { id: "serial", label: "Serial", icon: "M2 6h20v12H2zM6 12h.01M10 12h.01M14 12h.01" },
];

const HISTORY = [
  { method: "GET", url: "/api/users", status: "200", time: "12ms" },
  { method: "POST", url: "/api/auth/login", status: "200", time: "89ms" },
  { method: "GET", url: "/api/products?page=1", status: "200", time: "45ms" },
  { method: "PUT", url: "/api/users/123", status: "204", time: "23ms" },
  { method: "DELETE", url: "/api/sessions/expired", status: "200", time: "67ms" },
];

const navItemStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-2)",
  padding: "var(--sp-2) var(--sp-3)",
  fontSize: "12px",
  cursor: "pointer",
  color: active ? "var(--fg)" : "var(--meta)",
  background: active ? "var(--surface)" : "transparent",
  borderRadius: active ? "var(--r-sm)" : undefined,
});

const sectionTitle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--meta)",
  padding: "var(--sp-3) var(--sp-4)",
};

export function ProtocolPanel() {
  const [active, setActive] = useState<Protocol>("http");

  const renderPanel = () => {
    switch (active) {
      case "http": return <HttpPanel />;
      case "ws": return <WsPanel />;
      case "mqtt": return <MqttPanel />;
      case "serial": return <SerialPanel />;
    }
  };

  return (
    <DockLayout>
      <DockPanel defaultSize={14} minSize={10} collapsible>
        <div style={sectionTitle}>Protocol</div>
        {PROTOCOLS.map((p) => (
          <div
            key={p.id}
            style={navItemStyle(active === p.id)}
            onClick={() => setActive(p.id)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d={p.icon} />
            </svg>
            {p.label}
          </div>
        ))}

        <div style={{ ...sectionTitle, marginTop: "var(--sp-4)" }}>History</div>
        {HISTORY.map((h) => (
          <div
            key={h.url}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              padding: "var(--sp-1) var(--sp-3)",
              fontSize: "11px",
              cursor: "pointer",
              color: "var(--meta)",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 700,
                padding: "1px 3px",
                borderRadius: "2px",
                background: "var(--surface)",
                minWidth: "28px",
                textAlign: "center",
                color:
                  h.method === "GET"
                    ? "var(--success)"
                    : h.method === "POST"
                      ? "var(--accent)"
                      : h.method === "PUT"
                        ? "var(--warning)"
                        : "var(--danger)",
              }}
            >
              {h.method === "DELETE" ? "DEL" : h.method}
            </span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              {h.url}
            </span>
            <span style={{ fontSize: "10px" }}>
              {h.status} {"·"} {h.time}
            </span>
          </div>
        ))}
      </DockPanel>
      <DockHandle />
      <DockPanel>
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-4)" }}>
          {renderPanel()}
        </div>
      </DockPanel>
    </DockLayout>
  );
}
