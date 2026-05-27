import { DockLayout, DockPanel, DockHandle } from "../../components/dock";

export function ServerPanel() {
  return (
    <DockLayout>
      <DockPanel defaultSize={16} minSize={10} collapsible>
        <div className="server-sidebar-header" style={{padding:"var(--sp-3) var(--sp-4)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <span style={{fontSize:"12px", fontWeight:600}}>All Servers</span>
          <span className="badge badge-success">5 online</span>
        </div>
        <div style={{flex:1, overflowY:"auto", padding:"var(--sp-2)"}}>
          <div className="server-group">
            <div className="server-group-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-2) var(--sp-2)"}}>Production</div>
            <div className="server-item active" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px", background:"var(--accent-soft)"}}>
              <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
              <span className="server-name">prod-web-01</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--danger-soft)", color:"var(--danger)"}}>PROD</span>
            </div>
            <div className="server-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px"}}>
              <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
              <span className="server-name">prod-web-02</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--danger-soft)", color:"var(--danger)"}}>PROD</span>
            </div>
            <div className="server-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px"}}>
              <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
              <span className="server-name">prod-db-master</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--danger-soft)", color:"var(--danger)"}}>PROD</span>
            </div>
          </div>
          <div className="server-group">
            <div className="server-group-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-2) var(--sp-2)"}}>Staging</div>
            <div className="server-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px"}}>
              <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
              <span className="server-name">staging-api</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--warn-soft)", color:"var(--warn)"}}>STG</span>
            </div>
            <div className="server-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px"}}>
              <span className="status-dot warning" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--warn)", flexShrink:0}}></span>
              <span className="server-name">staging-worker</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--warn-soft)", color:"var(--warn)"}}>STG</span>
            </div>
          </div>
          <div className="server-group">
            <div className="server-group-title" style={{fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--meta)", padding:"var(--sp-2) var(--sp-2)"}}>Development</div>
            <div className="server-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px"}}>
              <span className="status-dot online" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--success)", flexShrink:0}}></span>
              <span className="server-name">dev-local</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--success-soft)", color:"var(--success)"}}>DEV</span>
            </div>
            <div className="server-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-3)", borderRadius:"var(--r-sm)", cursor:"pointer", fontSize:"12px"}}>
              <span className="status-dot offline" style={{width:"8px", height:"8px", borderRadius:"50%", background:"var(--meta)", flexShrink:0}}></span>
              <span className="server-name">dev-build</span>
              <span className="env-tag" style={{marginLeft:"auto", fontSize:"9px", fontWeight:700, padding:"1px 4px", borderRadius:"2px", background:"var(--success-soft)", color:"var(--success)"}}>DEV</span>
            </div>
          </div>
        </div>
      </DockPanel>
      <DockHandle />
      <DockPanel>
        <div className="tab-panel active" id="tab-monitor" style={{flex:1, display:"flex", flexDirection:"column", minHeight:0}}>
          <div className="server-content" style={{flex:1, overflowY:"auto", padding:"var(--sp-4)"}}>
            <div className="monitor-grid" style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"var(--sp-3)", marginBottom:"var(--sp-4)"}}>
              <div className="monitor-card" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)"}}>
                <div className="monitor-label" style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--sp-2)"}}><span style={{fontSize:"11px", color:"var(--meta)"}}>CPU Usage</span><span className="badge badge-success" style={{padding:"1px 6px", borderRadius:"3px", fontSize:"10px", background:"var(--success-soft)", color:"var(--success)"}}>Normal</span></div>
                <div className="monitor-value text-accent" style={{fontSize:"24px", fontWeight:700, marginBottom:"var(--sp-2)"}}>23.4%</div>
                <div className="monitor-bar" style={{height:"4px", background:"var(--bg-deeper)", borderRadius:"2px", overflow:"hidden"}}><div className="monitor-bar-fill" style={{width:"23.4%", height:"100%", background:"var(--accent)", borderRadius:"2px"}}></div></div>
                <div className="monitor-detail" style={{fontSize:"10px", color:"var(--meta)", marginTop:"var(--sp-1)"}}>4 cores {"·"} Intel Xeon E5-2680 {"·"} 2.40GHz</div>
              </div>
              <div className="monitor-card" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)"}}>
                <div className="monitor-label" style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--sp-2)"}}><span style={{fontSize:"11px", color:"var(--meta)"}}>Memory</span><span className="badge badge-warn" style={{padding:"1px 6px", borderRadius:"3px", fontSize:"10px", background:"var(--warn-soft)", color:"var(--warn)"}}>78%</span></div>
                <div className="monitor-value text-warn" style={{fontSize:"24px", fontWeight:700, marginBottom:"var(--sp-2)"}}>6.2 GB</div>
                <div className="monitor-bar" style={{height:"4px", background:"var(--bg-deeper)", borderRadius:"2px", overflow:"hidden"}}><div className="monitor-bar-fill" style={{width:"78%", height:"100%", background:"var(--warn)", borderRadius:"2px"}}></div></div>
                <div className="monitor-detail" style={{fontSize:"10px", color:"var(--meta)", marginTop:"var(--sp-1)"}}>8 GB total {"·"} 1.8 GB available</div>
              </div>
              <div className="monitor-card" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)"}}>
                <div className="monitor-label" style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--sp-2)"}}><span style={{fontSize:"11px", color:"var(--meta)"}}>Disk</span><span className="badge badge-success" style={{padding:"1px 6px", borderRadius:"3px", fontSize:"10px", background:"var(--success-soft)", color:"var(--success)"}}>54%</span></div>
                <div className="monitor-value" style={{fontSize:"24px", fontWeight:700, marginBottom:"var(--sp-2)"}}>54 GB</div>
                <div className="monitor-bar" style={{height:"4px", background:"var(--bg-deeper)", borderRadius:"2px", overflow:"hidden"}}><div className="monitor-bar-fill" style={{width:"54%", height:"100%", background:"var(--success)", borderRadius:"2px"}}></div></div>
                <div className="monitor-detail" style={{fontSize:"10px", color:"var(--meta)", marginTop:"var(--sp-1)"}}>100 GB total {"·"} 46 GB available</div>
              </div>
              <div className="monitor-card" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)"}}>
                <div className="monitor-label" style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--sp-2)"}}><span style={{fontSize:"11px", color:"var(--meta)"}}>Network</span><span className="badge badge-accent" style={{padding:"1px 6px", borderRadius:"3px", fontSize:"10px", background:"var(--accent-soft)", color:"var(--accent)"}}>Active</span></div>
                <div className="monitor-value text-success" style={{fontSize:"24px", fontWeight:700, marginBottom:"var(--sp-2)"}}>{"↑"} 2.4 <span style={{fontSize:"14px", fontWeight:400}}>MB/s</span></div>
                <div className="monitor-bar" style={{height:"4px", background:"var(--bg-deeper)", borderRadius:"2px", overflow:"hidden"}}><div className="monitor-bar-fill" style={{width:"24%", height:"100%", background:"var(--success)", borderRadius:"2px"}}></div></div>
                <div className="monitor-detail" style={{fontSize:"10px", color:"var(--meta)", marginTop:"var(--sp-1)"}}>{"↓"} 1.1 MB/s {"·"} eth0 {"·"} 847 connections</div>
              </div>
            </div>
            <div className="chart-area" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)", marginBottom:"var(--sp-4)"}}>
              <div className="chart-header" style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"var(--sp-3)"}}>
                <h3 style={{fontSize:"13px", fontWeight:600}}>CPU Usage {"—"} Last 24h</h3>
                <div className="chart-tabs" style={{display:"flex", gap:"var(--sp-1)"}}>
                  <span className="chart-tab" style={{fontSize:"11px", padding:"2px 8px", borderRadius:"3px", cursor:"pointer", color:"var(--meta)"}}>1h</span>
                  <span className="chart-tab" style={{fontSize:"11px", padding:"2px 8px", borderRadius:"3px", cursor:"pointer", color:"var(--meta)"}}>6h</span>
                  <span className="chart-tab active" style={{fontSize:"11px", padding:"2px 8px", borderRadius:"3px", cursor:"pointer", color:"var(--accent)", background:"var(--accent-soft)"}}>24h</span>
                  <span className="chart-tab" style={{fontSize:"11px", padding:"2px 8px", borderRadius:"3px", cursor:"pointer", color:"var(--meta)"}}>7d</span>
                </div>
              </div>
              <div className="chart-body" style={{height:"180px", background:"var(--bg-deeper)", borderRadius:"var(--r-sm)", display:"flex", alignItems:"flex-end", padding:"var(--sp-3)", gap:"2px"}}></div>
            </div>
            <div className="info-grid" style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:"var(--sp-3)", marginBottom:"var(--sp-4)"}}>
              {[
                {title:"System Info", icon:"server", rows:[
                  {label:"Hostname",value:"prod-web-01"},{label:"OS",value:"Ubuntu 22.04.3 LTS"},{label:"Kernel",value:"5.15.0-91-generic"},{label:"Uptime",value:"72h 14m"},{label:"Load Average",value:"1.23, 0.98, 0.87"}
                ]},
                {title:"Network", icon:"activity", rows:[
                  {label:"IP Address",value:"10.0.1.21"},{label:"Public IP",value:"203.0.113.42"},{label:"Interface",value:"eth0"},{label:"Bandwidth",value:"1 Gbps"},{label:"Firewall",value:"ufw active"}
                ]},
                {title:"Docker", icon:"box", rows:[
                  {label:"Containers",value:"4 running / 2 stopped"},{label:"Images",value:"12"},{label:"Volumes",value:"8"},{label:"Networks",value:"3"},{label:"Docker Version",value:"24.0.7"}
                ]},
                {title:"Security", icon:"shield", rows:[
                  {label:"SSH Key Auth",value:"Enabled",color:"var(--success)"},{label:"Root Login",value:"Permitted",color:"var(--warn)"},{label:"Fail2ban",value:"Active",color:"var(--success)"},{label:"Last Login",value:"2026-05-26 09:14"},{label:"Open Ports",value:"22, 80, 443, 8080"}
                ]},
              ].map((section) => (
                <div key={section.title} className="info-card" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)"}}>
                  <h4 style={{fontSize:"12px", fontWeight:600, marginBottom:"var(--sp-3)", display:"flex", alignItems:"center", gap:"var(--sp-2)"}}>{section.title}</h4>
                  {section.rows.map((row) => (
                    <div key={row.label} className="info-row" style={{display:"flex", justifyContent:"space-between", padding:"3px 0", fontSize:"11px", borderBottom:"1px solid var(--border)"}}>
                      <span className="label" style={{color:"var(--meta)"}}>{row.label}</span>
                      <span className="value" style={(row as any).color ? {color:(row as any).color} : {}}>{(row as any).value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <h3 style={{fontSize:"13px", fontWeight:600, marginBottom:"var(--sp-3)"}}>All Servers Overview</h3>
            <div className="overview-grid" style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"var(--sp-3)"}}>
              {[
                {name:"prod-web-01", ip:"10.0.1.21", cpu:"23%", mem:"78%", disk:"54%", net:"2.4M", online:true},
                {name:"prod-web-02", ip:"10.0.1.22", cpu:"45%", mem:"62%", disk:"41%", net:"1.8M", online:true},
                {name:"prod-db-master", ip:"10.0.1.30", cpu:"67%", mem:"89%", disk:"72%", net:"3.1M", online:true},
                {name:"staging-api", ip:"10.0.2.10", cpu:"12%", mem:"34%", disk:"28%", net:"0.4M", online:true},
                {name:"staging-worker", ip:"10.0.2.11", cpu:"92%", mem:"95%", disk:"61%", net:"0.1M", online:false, warn:true},
                {name:"dev-build", ip:"10.0.3.20", cpu:"—", mem:"—", disk:"—", net:"—", online:false},
              ].map((svr) => (
                <div key={svr.name} className="overview-card" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-4)", cursor:"pointer", transition:"border-color 0.12s"}}>
                  <div className="ov-header" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", marginBottom:"var(--sp-3)"}}>
                    <span className="status-dot" style={{width:"8px", height:"8px", borderRadius:"50%", background:(svr as any).online?"var(--success)":"var(--meta)"}}></span>
                    <div>
                      <div className="ov-name" style={{fontSize:"13px", fontWeight:600}}>{svr.name}</div>
                      <div className="ov-ip" style={{fontSize:"10px", color:"var(--meta)"}}>{svr.ip} {"·"} Ubuntu 22.04</div>
                    </div>
                  </div>
                  <div className="ov-metrics" style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"var(--sp-2)"}}>
                    {["CPU","MEM","DISK","NET"].map((m) => (
                      <div key={m} className="ov-metric" style={{textAlign:"center"}}>
                        <span style={{display:"block", fontSize:"9px", color:"var(--meta)", textTransform:"uppercase"}}>{m}</span>
                        <span className="ov-val" style={{fontSize:"14px", fontWeight:600, color: (svr as any).warn && (m==="CPU"||m==="MEM") ? "var(--warn)" : ((svr as any).online ? "var(--fg)" : "var(--meta)")}}>{(svr as any)[m.toLowerCase()]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="tab-panel" id="tab-processes" style={{display:"none", flex:1, flexDirection:"column", minHeight:0}}>
          <div className="server-content" style={{flex:1, overflowY:"auto", padding:"var(--sp-4)"}}>
            <div className="process-section" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)"}}>
              <div className="process-header" style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", padding:"var(--sp-3) var(--sp-4)", borderBottom:"1px solid var(--border)"}}>
                <h3 style={{fontSize:"13px", fontWeight:600}}>Running Processes</h3>
                <span className="text-muted text-sm" style={{fontSize:"11px", color:"var(--meta)"}}>187 total</span>
                <input className="process-search" placeholder="Search processes..." type="text" style={{marginLeft:"auto", padding:"3px 8px 3px 24px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"11px"}} />
                <button className="btn btn-danger btn-sm">Kill Process</button>
              </div>
              <div className="table-wrap" style={{overflowX:"auto"}}>
                <table>
                  <thead>
                    <tr>
                      <th>PID</th><th>Name</th><th>User</th><th>CPU %</th><th>MEM %</th><th>RSS</th><th>Status</th><th>Started</th><th>Command</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>1</td><td style={{fontWeight:500}}>systemd</td><td>root</td><td>0.0</td><td>0.3</td><td>12 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth:"200px", color:"var(--meta)"}}>/sbin/init</td></tr>
                    <tr><td>1247</td><td style={{fontWeight:500}}>dockerd</td><td>root</td><td className="text-warn" style={{color:"var(--warn)"}}>8.2</td><td>2.1</td><td>168 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth:"200px", color:"var(--meta)"}}>/usr/bin/dockerd -H fd://</td></tr>
                    <tr><td>5678</td><td style={{fontWeight:500}}>python3</td><td>app</td><td className="text-danger" style={{color:"var(--danger)"}}>45.2</td><td className="text-warn" style={{color:"var(--warn)"}}>8.4</td><td>672 MB</td><td><span className="badge badge-warn">R</span></td><td>09:12</td><td className="text-muted truncate" style={{maxWidth:"200px", color:"var(--meta)"}}>python3 ml_training.py --batch 256</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="tab-panel" id="tab-services" style={{display:"none", flex:1, flexDirection:"column", minHeight:0}}>
          <div className="server-content" style={{flex:1, overflowY:"auto", padding:"var(--sp-4)"}}>
            <div className="service-list" style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)"}}>
              <div style={{padding:"var(--sp-3) var(--sp-4)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"var(--sp-3)"}}>
                <h3 style={{fontSize:"13px", fontWeight:600}}>systemd Services</h3>
                <span className="text-muted text-sm" style={{fontSize:"11px", color:"var(--meta)"}}>prod-web-01</span>
                <input className="process-search" placeholder="Search services..." type="text" style={{marginLeft:"auto", padding:"3px 8px 3px 24px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"11px"}} />
              </div>
              {[
                {name:"nginx.service", status:"active", desc:"A high performance web server and reverse proxy"},
                {name:"docker.service", status:"active", desc:"Docker Application Container Engine"},
                {name:"postgresql.service", status:"active", desc:"PostgreSQL RDBMS"},
                {name:"redis-server.service", status:"active", desc:"Advanced key-value store"},
                {name:"sshd.service", status:"active", desc:"OpenSSH server daemon"},
                {name:"fail2ban.service", status:"active", desc:"Ban hosts that cause multiple authentication errors"},
                {name:"cron.service", status:"active", desc:"Regular background program processing daemon"},
                {name:"ufw.service", status:"active", desc:"Uncomplicated Firewall"},
                {name:"ml-worker.service", status:"failed", desc:"ML training worker — crashed at 09:12"},
              ].map((svc) => (
                <div key={svc.name} className="service-item" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-4)", borderBottom:"1px solid var(--border)", fontSize:"12px"}}>
                  <span className="svc-name" style={{fontWeight:500, minWidth:"180px"}}>{svc.name}</span>
                  <span className={`svc-status badge-${svc.status === "active" ? "success" : "danger"}`} style={{padding:"1px 6px", borderRadius:"3px", fontSize:"10px", background:svc.status==="active"?"var(--success-soft)":"var(--danger-soft)", color:svc.status==="active"?"var(--success)":"var(--danger)"}}>{svc.status}</span>
                  <span className="svc-desc" style={{color:"var(--meta)", fontSize:"11px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1}}>{svc.desc}</span>
                  <div className="svc-actions" style={{display:"flex", gap:"var(--sp-1)"}}>
                    <button className="btn btn-ghost btn-sm">Restart</button>
                    <button className={`btn btn-ghost btn-sm ${svc.status === "failed" ? "" : ""}`}>{svc.status === "failed" ? "Logs" : "Stop"}</button>
                    {svc.status !== "failed" && <button className="btn btn-ghost btn-sm">Logs</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="tab-panel" id="tab-logs" style={{display:"none", flex:1, flexDirection:"column", minHeight:0}}>
          <div className="server-content" style={{flex:1, overflowY:"auto", padding:"var(--sp-4)"}}>
            <div style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", marginBottom:"var(--sp-3)"}}>
              <h3 style={{fontSize:"13px", fontWeight:600}}>System Logs</h3>
              <select className="input" style={{fontSize:"11px", padding:"4px 8px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)"}}>
                <option>syslog</option><option>auth.log</option><option>kern.log</option><option>nginx/error.log</option><option>docker/daemon.log</option>
              </select>
              <select className="input" style={{fontSize:"11px", padding:"4px 8px", background:"var(--bg-deeper)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)"}}>
                <option>All Levels</option><option>Error</option><option>Warning</option><option>Info</option>
              </select>
              <button className="btn btn-ghost btn-sm" style={{marginLeft:"auto"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
              <button className="btn btn-ghost btn-sm">Tail -f</button>
            </div>
            <div className="terminal-area" style={{background:"var(--bg-deeper)", fontSize:"13px", lineHeight:"1.6", padding:"var(--sp-3) var(--sp-4)", overflowY:"auto", flex:1, minHeight:0, border:"1px solid var(--border)", borderRadius:"var(--r-md)"}}>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:14:02 prod-web-01 sshd[4521]: </span><span className="terminal-output">Accepted publickey for root from 192.168.1.100 port 52341 ssh2</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:13:45 prod-web-01 nginx[2104]: </span><span className="terminal-output">200 GET /api/users 12ms</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:12:01 prod-web-01 nginx[2104]: </span><span className="terminal-warn">upstream connection timeout</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:11:33 prod-web-01 kernel: </span><span className="terminal-error">[UFW BLOCK] IN=eth0 SRC=45.33.32.104 DST=10.0.1.21 PROTO=TCP DPT=443</span></div>
            </div>
          </div>
        </div>
      </DockPanel>
    </DockLayout>
  );
}
