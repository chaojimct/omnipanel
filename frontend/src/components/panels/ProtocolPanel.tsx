export function ProtocolPanel() {
  return (
    <div className="proto-workspace">
      {/* Protocol Navigation */}
      <div className="proto-sidebar">
        <div className="proto-section-title">Protocol</div>
        <div className="proto-nav-item active" data-proto="http">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          HTTP / REST
        </div>
        <div className="proto-nav-item" data-proto="ws">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/></svg>
          WebSocket
        </div>
        <div className="proto-nav-item" data-proto="mqtt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          MQTT
        </div>
        <div className="proto-nav-item" data-proto="serial">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01"/></svg>
          Serial
        </div>

        <div className="proto-section-title" style={{marginTop: "var(--sp-4)"}}>History</div>
        <div className="history-item"><span className="h-method method-get">GET</span><span className="h-url">/api/users</span><span className="h-time">200 {"·"} 12ms</span></div>
        <div className="history-item"><span className="h-method method-post">POST</span><span className="h-url">/api/auth/login</span><span className="h-time">200 {"·"} 89ms</span></div>
        <div className="history-item"><span className="h-method method-get">GET</span><span className="h-url">/api/products?page=1</span><span className="h-time">200 {"·"} 45ms</span></div>
        <div className="history-item"><span className="h-method method-put">PUT</span><span className="h-url">/api/users/123</span><span className="h-time">204 {"·"} 23ms</span></div>
        <div className="history-item"><span className="h-method method-delete">DEL</span><span className="h-url">/api/sessions/expired</span><span className="h-time">200 {"·"} 67ms</span></div>
      </div>

      {/* Main Content */}
      <div className="proto-main">
        <div className="proto-content">
          {/* HTTP Panel */}
          <div className="proto-panel active" id="panel-http">
            <div className="http-builder">
              <select className="method-select">
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>PATCH</option>
                <option>DELETE</option>
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
              <input className="url-input" placeholder="https://api.example.com/v1/users" defaultValue="https://api.example.com/v1/users" />
              <button className="btn btn-primary">Send</button>
              <button className="btn btn-secondary">Save</button>
            </div>

            <div className="req-tabs">
              <span className="req-tab active">Params</span>
              <span className="req-tab">Headers</span>
              <span className="req-tab">Body</span>
              <span className="req-tab">Auth</span>
              <span className="req-tab">Scripts</span>
            </div>

            <div className="req-panel active">
              <div className="kv-editor">
                <div className="kv-row"><input type="checkbox" className="kv-check" defaultChecked={true} /><input placeholder="Key" defaultValue="page" /><input placeholder="Value" defaultValue="1" /><div className="kv-del">{"×"}</div></div>
                <div className="kv-row"><input type="checkbox" className="kv-check" defaultChecked={true} /><input placeholder="Key" defaultValue="limit" /><input placeholder="Value" defaultValue="20" /><div className="kv-del">{"×"}</div></div>
                <div className="kv-row"><input type="checkbox" className="kv-check" /><input placeholder="Key" defaultValue="sort" /><input placeholder="Value" defaultValue="created_at" /><div className="kv-del">{"×"}</div></div>
              </div>
              <button className="btn btn-ghost btn-sm">+ Add Parameter</button>
            </div>

            <div className="req-panel">
              <div className="kv-editor">
                <div className="kv-row"><input type="checkbox" className="kv-check" defaultChecked={true} /><input placeholder="Key" defaultValue="Content-Type" /><input placeholder="Value" defaultValue="application/json" /><div className="kv-del">{"×"}</div></div>
                <div className="kv-row"><input type="checkbox" className="kv-check" defaultChecked={true} /><input placeholder="Key" defaultValue="Authorization" /><input placeholder="Value" defaultValue="Bearer eyJhbG...token" /><div className="kv-del">{"×"}</div></div>
                <div className="kv-row"><input type="checkbox" className="kv-check" defaultChecked={true} /><input placeholder="Key" defaultValue="Accept" /><input placeholder="Value" defaultValue="application/json" /><div className="kv-del">{"×"}</div></div>
              </div>
              <button className="btn btn-ghost btn-sm">+ Add Header</button>
            </div>

            <div className="req-panel">
              <div style={{marginBottom: "var(--sp-2)", display: "flex", gap: "var(--sp-2)"}}>
                <span className="tag" style={{cursor: "pointer", borderColor: "var(--accent)", color: "var(--accent)"}}>JSON</span>
                <span className="tag" style={{cursor: "pointer"}}>Form</span>
                <span className="tag" style={{cursor: "pointer"}}>Multipart</span>
                <span className="tag" style={{cursor: "pointer"}}>Raw</span>
                <span className="tag" style={{cursor: "pointer"}}>Binary</span>
              </div>
              <textarea className="body-editor" placeholder="Request body...">{"{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"role\": \"admin\"\n}"}</textarea>
            </div>

            <div className="req-panel">
              <div style={{marginBottom: "var(--sp-3)"}}>
                <div style={{display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-3)"}}>
                  <span className="tag" style={{cursor: "pointer", borderColor: "var(--accent)", color: "var(--accent)"}}>Bearer Token</span>
                  <span className="tag" style={{cursor: "pointer"}}>Basic Auth</span>
                  <span className="tag" style={{cursor: "pointer"}}>API Key</span>
                  <span className="tag" style={{cursor: "pointer"}}>OAuth 2.0</span>
                </div>
                <div className="kv-editor">
                  <div className="kv-row"><input placeholder="Token" defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style={{flex: 3}} /></div>
                </div>
              </div>
            </div>

            <div className="req-panel">
              <div style={{marginBottom: "var(--sp-2)"}}>
                <h4 style={{fontSize: "12px", fontWeight: 600, marginBottom: "var(--sp-2)"}}>Pre-request Script</h4>
                <textarea className="body-editor" style={{minHeight: "80px"}} placeholder="// Execute before request...">{"// Set timestamp\nenv.set(\"timestamp\", Date.now());\n\n// Generate signature\nconst hash = crypto.createHmac(\"sha256\", env.get(\"secret\"))\n  .update(env.get(\"timestamp\")).digest(\"hex\");\nenv.set(\"signature\", hash);"}</textarea>
              </div>
              <div>
                <h4 style={{fontSize: "12px", fontWeight: 600, marginBottom: "var(--sp-2)"}}>Test Script</h4>
                <textarea className="body-editor" style={{minHeight: "80px"}} placeholder="// Validate response...">{"// Assert status code\nassert(response.status === 200);\n\n// Extract token from response\nenv.set(\"token\", response.body.data.token);"}</textarea>
              </div>
            </div>

            <div className="response-area" style={{marginTop: "var(--sp-4)"}}>
              <div className="response-header">
                <span className="response-status badge-success">200 OK</span>
                <span className="response-meta">89ms {"·"} 1.2 KB</span>
                <span className="response-meta">{"·"}</span>
                <span className="response-meta">application/json</span>
              </div>
              <div className="response-body">{"{\n  \"data\": [\n    {\n      \"id\": 1,\n      \"name\": \"John Doe\",\n      \"email\": \"john@example.com\",\n      \"role\": \"admin\",\n      \"created_at\": \"2026-05-20T08:30:00Z\"\n    },\n    {\n      \"id\": 2,\n      \"name\": \"Jane Smith\",\n      \"email\": \"jane@example.com\",\n      \"role\": \"editor\",\n      \"created_at\": \"2026-05-21T14:22:00Z\"\n    }\n  ],\n  \"pagination\": {\n    \"page\": 1,\n    \"limit\": 20,\n    \"total\": 47,\n    \"pages\": 3\n  }\n}"}</div>
            </div>
          </div>

          {/* WebSocket Panel */}
          <div className="proto-panel" id="panel-ws">
            <div style={{display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-4)"}}>
              <input className="url-input" placeholder="wss://echo.websocket.org" defaultValue="wss://api.example.com/ws" style={{flex: 1}} />
              <button className="btn btn-primary">Connect</button>
              <button className="btn btn-danger" style={{display: "none"}}>Disconnect</button>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-3)", fontSize: "11px"}}>
              <span className="badge badge-success">Connected</span>
              <span className="text-muted">Latency: 12ms</span>
              <span className="text-muted">Messages: 24</span>
            </div>
            <div className="ws-messages">
              <div className="ws-msg"><span className="ws-dir out">{"↑"}</span><span className="ws-time">09:14:01</span><span className="ws-data">{"{\"type\":\"subscribe\",\"channel\":\"user_updates\"}"}</span></div>
              <div className="ws-msg"><span className="ws-dir in">{"↓"}</span><span className="ws-time">09:14:01</span><span className="ws-data">{"{\"type\":\"subscribed\",\"channel\":\"user_updates\",\"status\":\"ok\"}"}</span></div>
              <div className="ws-msg"><span className="ws-dir in">{"↓"}</span><span className="ws-time">09:14:15</span><span className="ws-data">{"{\"type\":\"update\",\"user_id\":123,\"field\":\"status\",\"value\":\"online\"}"}</span></div>
              <div className="ws-msg"><span className="ws-dir out">{"↑"}</span><span className="ws-time">09:14:20</span><span className="ws-data">{"{\"type\":\"ping\"}"}</span></div>
              <div className="ws-msg"><span className="ws-dir in">{"↓"}</span><span className="ws-time">09:14:20</span><span className="ws-data">{"{\"type\":\"pong\"}"}</span></div>
              <div className="ws-msg"><span className="ws-dir in">{"↓"}</span><span className="ws-time">09:14:32</span><span className="ws-data">{"{\"type\":\"update\",\"user_id\":456,\"field\":\"last_seen\",\"value\":\"2026-05-26T09:14:32Z\"}"}</span></div>
            </div>
            <div className="ws-input-row">
              <select className="input" style={{width: "80px"}}>
                <option>JSON</option>
                <option>Text</option>
                <option>Binary</option>
              </select>
              <input placeholder='{"type":"subscribe","channel":"..."}' />
              <button className="btn btn-primary btn-sm">Send</button>
            </div>
          </div>

          {/* MQTT Panel */}
          <div className="proto-panel" id="panel-mqtt">
            <div style={{display: "flex", gap: "var(--sp-2)", marginBottom: "var(--sp-4)"}}>
              <input className="url-input" placeholder="mqtt://broker.example.com:1883" defaultValue="mqtt://broker.hivemq.com:1883" style={{flex: 1}} />
              <input className="input" placeholder="Client ID" defaultValue="omnipanel-001" style={{width: "140px"}} />
              <button className="btn btn-primary">Connect</button>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-3)", fontSize: "11px"}}>
              <span className="badge badge-success">Connected</span>
              <span className="text-muted">Broker: HiveMQ</span>
              <span className="text-muted">Messages: 156</span>
            </div>

            <div style={{marginBottom: "var(--sp-3)"}}>
              <div style={{display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)"}}>
                <span style={{fontSize: "11px", fontWeight: 600}}>Subscriptions</span>
                <input className="input" placeholder="Topic to subscribe..." style={{width: "240px", fontSize: "11px"}} />
                <select className="input" style={{width: "60px", fontSize: "11px"}}>
                  <option>QoS 0</option>
                  <option>QoS 1</option>
                  <option>QoS 2</option>
                </select>
                <button className="btn btn-ghost btn-sm">Subscribe</button>
              </div>
              <div className="mqtt-topics">
                <span className="mqtt-topic">sensors/temperature <span className="topic-remove">{"×"}</span></span>
                <span className="mqtt-topic">sensors/humidity <span className="topic-remove">{"×"}</span></span>
                <span className="mqtt-topic">devices/+/status <span className="topic-remove">{"×"}</span></span>
                <span className="mqtt-topic">alerts/# <span className="topic-remove">{"×"}</span></span>
              </div>
            </div>

            <div className="mqtt-messages">
              <div className="mqtt-msg"><span className="mqtt-topic-name">sensors/temperature</span><span className="mqtt-payload">{"{\"device\":\"DHT22-01\",\"temp\":23.5,\"unit\":\"C\"}"}</span><span className="mqtt-meta">QoS 0 {"·"} 09:14:01</span></div>
              <div className="mqtt-msg"><span className="mqtt-topic-name">sensors/humidity</span><span className="mqtt-payload">{"{\"device\":\"DHT22-01\",\"humidity\":65.2,\"unit\":\"%\"}"}</span><span className="mqtt-meta">QoS 0 {"·"} 09:14:01</span></div>
              <div className="mqtt-msg"><span className="mqtt-topic-name">devices/esp32-01/status</span><span className="mqtt-payload">{"{\"online\":true,\"battery\":87,\"firmware\":\"2.1.0\"}"}</span><span className="mqtt-meta">QoS 1 {"·"} 09:14:15</span></div>
              <div className="mqtt-msg"><span className="mqtt-topic-name">alerts/temperature</span><span className="mqtt-payload">{"{\"level\":\"warning\",\"device\":\"DHT22-01\",\"temp\":35.2,\"threshold\":30}"}</span><span className="mqtt-meta">QoS 1 {"·"} 09:14:22</span></div>
              <div className="mqtt-msg"><span className="mqtt-topic-name">sensors/temperature</span><span className="mqtt-payload">{"{\"device\":\"DHT22-02\",\"temp\":21.8,\"unit\":\"C\"}"}</span><span className="mqtt-meta">QoS 0 {"·"} 09:14:30</span></div>
            </div>

            <div style={{display: "flex", gap: "var(--sp-2)"}}>
              <input className="input" placeholder="Topic" defaultValue="devices/esp32-01/cmd" style={{width: "200px"}} />
              <select className="input" style={{width: "70px"}}>
                <option>QoS 0</option>
                <option>QoS 1</option>
                <option>QoS 2</option>
              </select>
              <input className="input" placeholder='{"action":"reboot"}' style={{flex: 1}} />
              <button className="btn btn-primary btn-sm">Publish</button>
            </div>
          </div>

          {/* Serial Panel */}
          <div className="proto-panel" id="panel-serial">
            <div className="serial-config">
              <div className="serial-field"><label>Port</label><select><option>COM3 {"—"} USB Serial</option><option>COM5 {"—"} Arduino Uno</option><option>/dev/ttyUSB0</option></select></div>
              <div className="serial-field"><label>Baud Rate</label><select><option>9600</option><option>19200</option><option>38400</option><option>115200</option><option>230400</option><option>921600</option></select></div>
              <div className="serial-field"><label>Data Bits</label><select><option>7</option><option>8</option></select></div>
              <div className="serial-field"><label>Stop Bits</label><select><option>1</option><option>1.5</option><option>2</option></select></div>
              <div className="serial-field"><label>Parity</label><select><option>None</option><option>Even</option><option>Odd</option><option>Mark</option><option>Space</option></select></div>
              <div className="serial-field"><label>Flow Control</label><select><option>None</option><option>RTS/CTS</option><option>XON/XOFF</option></select></div>
              <div className="serial-field"><label>Encoding</label><select><option>UTF-8</option><option>ASCII</option><option>HEX</option></select></div>
              <div className="serial-field"><label>{" "}</label><button className="btn btn-primary" style={{width: "100%"}}>Connect</button></div>
            </div>

            <div style={{display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-3)", fontSize: "11px"}}>
              <span className="badge badge-success">Connected</span>
              <span className="text-muted">COM3 {"·"} 115200 8N1</span>
              <span className="text-muted">RX: 1,247 bytes {"·"} TX: 342 bytes</span>
              <div style={{marginLeft: "auto", display: "flex", gap: "var(--sp-2)"}}>
                <label style={{display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer"}}><input type="checkbox" defaultChecked={true} style={{accentColor: "var(--accent)"}} /> Timestamp</label>
                <label style={{display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer"}}><input type="checkbox" style={{accentColor: "var(--accent)"}} /> HEX</label>
                <label style={{display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", cursor: "pointer"}}><input type="checkbox" defaultChecked={true} style={{accentColor: "var(--accent)"}} /> Auto-scroll</label>
              </div>
            </div>

            <div className="serial-io">
              <div className="serial-panel">
                <div className="serial-panel-header">Received</div>
                <div className="serial-panel-body">
                  <div>[09:14:01.234] Device: ESP32-01 v2.1.0</div>
                  <div>[09:14:01.456] WiFi: Connected (RSSI: -42)</div>
                  <div>[09:14:02.012] Sensor: DHT22 init OK</div>
                  <div>[09:14:02.567] MQTT: Connected to broker</div>
                  <div>[09:14:03.123] Temp: 23.5{"°"}C Humidity: 65.2%</div>
                  <div>[09:14:13.124] Temp: 23.6{"°"}C Humidity: 65.1%</div>
                  <div>[09:14:23.125] Temp: 23.7{"°"}C Humidity: 65.0%</div>
                  <div>[09:14:33.126] Temp: 23.8{"°"}C Humidity: 64.9%</div>
                </div>
                <div className="serial-panel-input">
                  <input placeholder="Send data..." />
                  <button className="btn btn-primary btn-sm">Send</button>
                  <button className="btn btn-ghost btn-sm">Hex</button>
                </div>
              </div>
              <div className="serial-panel">
                <div className="serial-panel-header">Sent</div>
                <div className="serial-panel-body">
                  <div>[09:14:01.000] AT+RST</div>
                  <div>[09:14:01.100] OK</div>
                  <div>[09:14:05.000] AT+CIPSTART="TCP","broker.mqtt.com",1883</div>
                  <div>[09:14:05.200] CONNECT</div>
                  <div>[09:14:10.000] {"{\"cmd\":\"read_sensor\"}"}</div>
                </div>
                <div className="serial-panel-input">
                  <div style={{display: "flex", gap: "var(--sp-1)", flexWrap: "wrap"}}>
                    <button className="btn btn-ghost btn-sm">AT</button>
                    <button className="btn btn-ghost btn-sm">AT+RST</button>
                    <button className="btn btn-ghost btn-sm">AT+GMR</button>
                    <button className="btn btn-ghost btn-sm">Read</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{marginTop: "var(--sp-3)", display: "flex", alignItems: "center", gap: "var(--sp-2)", fontSize: "11px"}}>
              <label style={{display: "flex", alignItems: "center", gap: "4px"}}><input type="checkbox" style={{accentColor: "var(--accent)"}} /> Periodic Send</label>
              <input className="input" placeholder="Interval (ms)" defaultValue="1000" style={{width: "80px", fontSize: "11px"}} />
              <input className="input" placeholder='{"cmd":"read_sensor"}' style={{flex: 1, fontSize: "11px"}} />
              <button className="btn btn-ghost btn-sm">Start</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
