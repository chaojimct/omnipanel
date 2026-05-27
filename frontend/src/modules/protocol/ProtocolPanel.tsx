import { DockLayout, DockPanel, DockHandle } from "../../components/dock";

export function ProtocolPanel() {
  return (
    <DockLayout>
      <DockPanel defaultSize={14} minSize={10} collapsible>
        <div className="proto-section-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-3) var(--sp-4)"}}>Protocol</div>
        <div className="proto-nav-item active" data-proto="http" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", fontSize:"12px", cursor:"pointer", color:"var(--fg)", background:"var(--surface)"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          HTTP / REST
        </div>
        <div className="proto-nav-item" data-proto="ws" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", fontSize:"12px", cursor:"pointer", color:"var(--meta)"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M2 12h20"/></svg>
          WebSocket
        </div>
        <div className="proto-nav-item" data-proto="mqtt" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", fontSize:"12px", cursor:"pointer", color:"var(--meta)"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          MQTT
        </div>
        <div className="proto-nav-item" data-proto="serial" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", fontSize:"12px", cursor:"pointer", color:"var(--meta)"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01"/></svg>
          Serial
        </div>
        <div className="proto-section-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-3) var(--sp-4)", marginTop:"var(--sp-4)"}}>History</div>
        {[
          {method:"GET", url:"/api/users", status:"200", time:"12ms"},
          {method:"POST", url:"/api/auth/login", status:"200", time:"89ms"},
          {method:"GET", url:"/api/products?page=1", status:"200", time:"45ms"},
          {method:"PUT", url:"/api/users/123", status:"204", time:"23ms"},
          {method:"DELETE", url:"/api/sessions/expired", status:"200", time:"67ms"},
        ].map((h) => (
          <div key={h.url} className="history-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-1) var(--sp-3)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>
            <span className={`h-method method-${h.method.toLowerCase()}`} style={{fontSize:"9px", fontWeight:700, padding:"1px 3px", borderRadius:"2px", background:"var(--surface)", minWidth:"28px", textAlign:"center"}}>{h.method}</span>
            <span className="h-url" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1}}>{h.url}</span>
            <span className="h-time" style={{fontSize:"10px"}}>{h.status} {"·"} {h.time}</span>
          </div>
        ))}
      </DockPanel>
      <DockHandle />
      <DockPanel>
        <div className="proto-content" style={{flex:1, overflowY:"auto", padding:"var(--sp-4)"}}>
          <div className="proto-panel active" id="panel-http">
            <div className="http-builder" style={{display:"flex", gap:"var(--sp-2)", marginBottom:"var(--sp-3)"}}>
              <select className="method-select" style={{padding:"6px 8px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--success)", fontSize:"12px", fontWeight:600, minWidth:"80px"}}>
                <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option>
              </select>
              <input className="url-input" placeholder="https://api.example.com/v1/users" defaultValue="https://api.example.com/v1/users" style={{flex:1, padding:"6px 12px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} />
              <button className="btn btn-primary">Send</button>
              <button className="btn btn-secondary">Save</button>
            </div>
            <div className="req-tabs" style={{display:"flex", borderBottom:"1px solid var(--border)", marginBottom:"var(--sp-3)"}}>
              {["Params","Headers","Body","Auth","Scripts"].map((tab) => (
                <span key={tab} className={`req-tab ${tab==="Params"?"active":""}`} style={{padding:"var(--sp-1) var(--sp-3)", fontSize:"11px", cursor:"pointer", borderBottom:tab==="Params"?"2px solid var(--accent)":"2px solid transparent", color:tab==="Params"?"var(--fg)":"var(--meta)"}}>{tab}</span>
              ))}
            </div>
            <div className="kv-editor" style={{marginBottom:"var(--sp-3)"}}>
              {[{k:"page",v:"1"},{k:"limit",v:"20"},{k:"sort",v:"created_at"}].map((row) => (
                <div key={row.k} className="kv-row" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", marginBottom:"4px"}}>
                  <input type="checkbox" className="kv-check" defaultChecked style={{accentColor:"var(--accent)"}} />
                  <input placeholder="Key" defaultValue={row.k} style={{flex:1, padding:"4px 8px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"11px"}} />
                  <input placeholder="Value" defaultValue={row.v} style={{flex:1, padding:"4px 8px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"11px"}} />
                  <div className="kv-del" style={{cursor:"pointer", color:"var(--muted)"}}>{"×"}</div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm">+ Add Parameter</button>
            </div>
            <div className="response-area" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", overflow:"hidden"}}>
              <div className="response-header" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderBottom:"1px solid var(--border)", fontSize:"11px"}}>
                <span className="response-status badge-success" style={{padding:"1px 6px", borderRadius:"3px", fontSize:"10px", background:"var(--success-soft)", color:"var(--success)"}}>200 OK</span>
                <span className="response-meta" style={{color:"var(--meta)"}}>89ms {"·"} 1.2 KB</span>
                <span className="response-meta" style={{color:"var(--meta)"}}>{"·"}</span>
                <span className="response-meta" style={{color:"var(--meta)"}}>application/json</span>
              </div>
              <div className="response-body" style={{padding:"var(--sp-3)", fontSize:"12px", fontFamily:"var(--font)", whiteSpace:"pre", overflow:"auto"}}>{"{\n  \"data\": [\n    {\"id\": 1,\"name\": \"John Doe\",\"email\": \"john@example.com\"},\n    {\"id\": 2,\"name\": \"Jane Smith\",\"email\": \"jane@example.com\"}\n  ]\n}"}</div>
            </div>
          </div>
          <div className="proto-panel" id="panel-ws" style={{display:"none"}}>
            <div style={{display:"flex", gap:"var(--sp-2)", marginBottom:"var(--sp-4)"}}>
              <input className="url-input" placeholder="wss://echo.websocket.org" defaultValue="wss://api.example.com/ws" style={{flex:1, padding:"6px 12px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} />
              <button className="btn btn-primary">Connect</button>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", marginBottom:"var(--sp-3)", fontSize:"11px"}}>
              <span className="badge badge-success">Connected</span>
              <span className="text-muted" style={{color:"var(--meta)"}}>Latency: 12ms</span>
              <span className="text-muted" style={{color:"var(--meta)"}}>Messages: 24</span>
            </div>
            <div className="ws-messages" style={{background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"var(--sp-3)", minHeight:"300px", maxHeight:"500px", overflowY:"auto", marginBottom:"var(--sp-3)"}}></div>
          </div>
          <div className="proto-panel" id="panel-mqtt" style={{display:"none"}}>
            <div style={{display:"flex", gap:"var(--sp-2)", marginBottom:"var(--sp-4)"}}>
              <input className="url-input" placeholder="mqtt://broker.example.com:1883" defaultValue="mqtt://broker.hivemq.com:1883" style={{flex:1, padding:"6px 12px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} />
              <input className="input" placeholder="Client ID" defaultValue="omnipanel-001" style={{width:"140px", padding:"6px 10px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} />
              <button className="btn btn-primary">Connect</button>
            </div>
          </div>
          <div className="proto-panel" id="panel-serial" style={{display:"none"}}>
            <div className="serial-config" style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"var(--sp-2)", marginBottom:"var(--sp-3)"}}>
              {[
                {label:"Port", opts:["COM3 — USB Serial","COM5 — Arduino Uno","/dev/ttyUSB0"]},
                {label:"Baud Rate", opts:["9600","19200","38400","115200","230400","921600"]},
                {label:"Data Bits", opts:["7","8"]},
                {label:"Stop Bits", opts:["1","1.5","2"]},
                {label:"Parity", opts:["None","Even","Odd","Mark","Space"]},
                {label:"Flow Control", opts:["None","RTS/CTS","XON/XOFF"]},
                {label:"Encoding", opts:["UTF-8","ASCII","HEX"]},
                {label:"", opts:[]},
              ].map((f) => (
                <div key={f.label} className="serial-field">
                  <label style={{display:"block", fontSize:"10px", color:"var(--meta)", marginBottom:"2px"}}>{f.label}</label>
                  {f.opts.length > 0 ? (
                    <select style={{width:"100%", padding:"4px 6px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"11px"}}>
                      {f.opts.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <button className="btn btn-primary" style={{width:"100%", padding:"4px 10px"}}>Connect</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DockPanel>
    </DockLayout>
  );
}
