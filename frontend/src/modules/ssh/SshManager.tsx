import { DockLayout, DockPanel, DockHandle } from "../../components/dock";

export function SshManager() {
  return (
    <DockLayout>
      <DockPanel defaultSize={20} minSize={12} maxSize={40}>
        <div className="host-list-header" style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"var(--sp-3) var(--sp-4)", borderBottom:"1px solid var(--border)"}}>
          <span style={{fontSize:"12px", fontWeight:600}}>SSH Hosts</span>
          <button className="btn btn-primary btn-sm">+</button>
        </div>
        <div className="host-list-search" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderBottom:"1px solid var(--border)"}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search hosts..." type="text" style={{border:"none", outline:"none", background:"transparent", color:"var(--fg)", fontSize:"12px", width:"100%"}} />
        </div>
        <div style={{flex:1, overflowY:"auto", padding:"var(--sp-2)"}}>
          <div className="host-group-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-2) var(--sp-2)"}}>Production</div>
          <div className="host-item active" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", background:"var(--accent-soft)"}}>
            <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>Web Server 01</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>deploy@192.168.1.100</div>
            </div>
          </div>
          <div className="host-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer"}}>
            <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>Web Server 02</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>deploy@192.168.1.101</div>
            </div>
          </div>
          <div className="host-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer"}}>
            <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>DB Primary</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>postgres@192.168.1.200</div>
            </div>
          </div>
          <div className="host-group-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-2) var(--sp-2)"}}>Staging</div>
          <div className="host-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer"}}>
            <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>Staging Server</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>deploy@10.0.1.50</div>
            </div>
          </div>
          <div className="host-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer"}}>
            <span className="status-dot warning" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--warn)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>Staging DB</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>postgres@10.0.1.51</div>
            </div>
          </div>
          <div className="host-group-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-2) var(--sp-2)"}}>Development</div>
          <div className="host-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer"}}>
            <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>Dev Machine</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>dev@172.16.0.10</div>
            </div>
          </div>
          <div className="host-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer"}}>
            <span className="status-dot offline" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--meta)", flexShrink:0}}></span>
            <div>
              <div className="host-name" style={{fontSize:"12px", fontWeight:500}}>CI Runner</div>
              <div className="host-addr" style={{fontSize:"10px", color:"var(--meta)"}}>ci@172.16.0.20</div>
            </div>
          </div>
        </div>
      </DockPanel>
      <DockHandle />
      <DockPanel>
        <div className="ssh-detail-header" style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"var(--sp-3) var(--sp-4)", borderBottom:"1px solid var(--border)"}}>
          <div style={{display: "flex", alignItems: "center", gap: "var(--sp-3)"}}>
            <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
            <div>
              <h2 style={{fontSize: "14px", fontWeight: 600}}>Web Server 01</h2>
              <span style={{fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)"}}>deploy@192.168.1.100:22</span>
            </div>
            <span className="badge badge-danger">prod</span>
          </div>
          <div style={{display: "flex", gap: "var(--sp-2)"}}>
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Connect</button>
          </div>
        </div>

        <div className="ssh-detail-tabs" style={{display:"flex", borderBottom:"1px solid var(--border)", padding:"0 var(--sp-3)", flexShrink:0}}>
          <div className="ssh-detail-tab active" style={{padding:"var(--sp-2) var(--sp-3)", fontSize:"11px", cursor:"pointer", borderBottom:"2px solid var(--accent)", color:"var(--fg)", fontWeight:500}}>Overview</div>
          <div className="ssh-detail-tab" style={{padding:"var(--sp-2) var(--sp-3)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>Terminal</div>
          <div className="ssh-detail-tab" style={{padding:"var(--sp-2) var(--sp-3)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>SFTP</div>
          <div className="ssh-detail-tab" style={{padding:"var(--sp-2) var(--sp-3)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>Tunnels</div>
          <div className="ssh-detail-tab" style={{padding:"var(--sp-2) var(--sp-3)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>Monitoring</div>
        </div>

        <div className="ssh-detail-body" style={{flex:1, overflowY:"auto", padding:"var(--sp-4)", display:"flex", flexDirection:"column", gap:"var(--sp-4)"}}>
          <div className="quick-stats" style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"var(--sp-3)"}}>
            <div className="stat" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"var(--sp-2) var(--sp-3)"}}><span className="stat-label" style={{display:"block", fontSize:"10px", color:"var(--meta)", marginBottom:"2px"}}>Status</span><span className="stat-value" style={{fontSize:"13px", fontWeight:600, color: "var(--success)"}}>Online</span></div>
            <div className="stat" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"var(--sp-2) var(--sp-3)"}}><span className="stat-label" style={{display:"block", fontSize:"10px", color:"var(--meta)", marginBottom:"2px"}}>Last Connected</span><span className="stat-value" style={{fontSize:"13px", fontWeight:600}}>2 min ago</span></div>
            <div className="stat" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"var(--sp-2) var(--sp-3)"}}><span className="stat-label" style={{display:"block", fontSize:"10px", color:"var(--meta)", marginBottom:"2px"}}>Key Type</span><span className="stat-value" style={{fontSize:"13px", fontWeight:600, fontFamily: "var(--font-mono)"}}>ED25519</span></div>
            <div className="stat" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", padding:"var(--sp-2) var(--sp-3)"}}><span className="stat-label" style={{display:"block", fontSize:"10px", color:"var(--meta)", marginBottom:"2px"}}>Fingerprint</span><span className="stat-value" style={{fontSize:"13px", fontWeight:600, fontFamily: "var(--font-mono)"}}>SHA256:xR3m9...</span></div>
          </div>

          <div className="form-grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"var(--sp-3)", maxWidth:"640px"}}>
            <div className="form-field"><label style={{display:"block", fontSize:"11px", color:"var(--meta)", marginBottom:"4px"}}>Host</label><input type="text" value="192.168.1.100" readOnly style={{width:"100%", padding:"6px 10px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} /></div>
            <div className="form-field"><label style={{display:"block", fontSize:"11px", color:"var(--meta)", marginBottom:"4px"}}>Port</label><input type="text" value="22" readOnly style={{width:"100%", padding:"6px 10px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} /></div>
            <div className="form-field"><label style={{display:"block", fontSize:"11px", color:"var(--meta)", marginBottom:"4px"}}>Username</label><input type="text" value="deploy" readOnly style={{width:"100%", padding:"6px 10px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} /></div>
            <div className="form-field"><label style={{display:"block", fontSize:"11px", color:"var(--meta)", marginBottom:"4px"}}>Auth Method</label><input type="text" value="SSH Key" readOnly style={{width:"100%", padding:"6px 10px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"12px"}} /></div>
          </div>

          <div className="conn-actions" style={{display:"flex", gap:"var(--sp-2)"}}>
            <button className="btn btn-primary">Open Terminal</button>
            <button className="btn btn-ghost">SFTP Browser</button>
            <button className="btn btn-ghost">Setup Tunnel</button>
            <button className="btn btn-ghost">Test Connection</button>
          </div>

          <div>
            <h3 style={{fontSize: "13px", fontWeight: 600, marginBottom: "var(--sp-3)"}}>Recent Activity</h3>
            <div className="table-wrap" style={{overflowX:"auto"}}>
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Host</th>
                    <th>User</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>10:32</td><td>Connected</td><td>Web Server 01</td><td>deploy</td><td>45 min</td></tr>
                  <tr><td>09:15</td><td>File upload</td><td>Staging Server</td><td>deploy</td><td>{"—"}</td></tr>
                  <tr><td>08:45</td><td>Disconnected</td><td>Dev Machine</td><td>dev</td><td>2h 15m</td></tr>
                  <tr><td>Yesterday</td><td>Key rotated</td><td>DB Primary</td><td>postgres</td><td>{"—"}</td></tr>
                  <tr><td>Yesterday</td><td>Connected</td><td>CI Runner</td><td>ci</td><td>5h 30m</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DockPanel>
    </DockLayout>
  );
}
