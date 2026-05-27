import { DockLayout, DockPanel } from "../../components/dock";

export function DockerPanel() {
  return (
    <DockLayout>
      <DockPanel>
        <div className="docker-stats" style={{display:"flex", gap:"var(--sp-3)", padding:"var(--sp-3) var(--sp-6)", borderBottom:"1px solid var(--border)", flexShrink:0}}>
          <div className="docker-stat" style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", padding:"var(--sp-2) var(--sp-4)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", minWidth:"140px"}}>
            <div className="stat-icon" style={{background: "var(--success-soft)", color: "var(--success)", width:"32px", height:"32px", display:"grid", placeItems:"center", borderRadius:"var(--r-sm)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div className="stat-info"><span className="stat-val" style={{display:"block", fontSize:"16px", fontWeight:700}}>4</span><span className="stat-label" style={{fontSize:"10px", color:"var(--meta)"}}>Running</span></div>
          </div>
          <div className="docker-stat" style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", padding:"var(--sp-2) var(--sp-4)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", minWidth:"140px"}}>
            <div className="stat-icon" style={{background: "var(--muted)", color: "var(--bg)", width:"32px", height:"32px", display:"grid", placeItems:"center", borderRadius:"var(--r-sm)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div className="stat-info"><span className="stat-val" style={{display:"block", fontSize:"16px", fontWeight:700}}>2</span><span className="stat-label" style={{fontSize:"10px", color:"var(--meta)"}}>Stopped</span></div>
          </div>
          <div className="docker-stat" style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", padding:"var(--sp-2) var(--sp-4)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", minWidth:"140px"}}>
            <div className="stat-icon" style={{background: "var(--accent-soft)", color: "var(--accent)", width:"32px", height:"32px", display:"grid", placeItems:"center", borderRadius:"var(--r-sm)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </div>
            <div className="stat-info"><span className="stat-val" style={{display:"block", fontSize:"16px", fontWeight:700}}>12</span><span className="stat-label" style={{fontSize:"10px", color:"var(--meta)"}}>Images</span></div>
          </div>
          <div className="docker-stat" style={{display:"flex", alignItems:"center", gap:"var(--sp-3)", padding:"var(--sp-2) var(--sp-4)", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", minWidth:"140px"}}>
            <div className="stat-icon" style={{background: "var(--warn-soft)", color: "var(--warn)", width:"32px", height:"32px", display:"grid", placeItems:"center", borderRadius:"var(--r-sm)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div className="stat-info"><span className="stat-val" style={{display:"block", fontSize:"16px", fontWeight:700}}>3</span><span className="stat-label" style={{fontSize:"10px", color:"var(--meta)"}}>Volumes</span></div>
          </div>
        </div>

        <div className="docker-filters" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)", padding:"var(--sp-2) var(--sp-4)", borderBottom:"1px solid var(--border)", flexShrink:0}}>
          <span className="filter-tab active" style={{display:"inline-flex", alignItems:"center", gap:"var(--sp-1)", padding:"var(--sp-1) var(--sp-2)", borderRadius:"var(--r-sm)", fontSize:"11px", cursor:"pointer", background:"var(--accent-soft)", color:"var(--accent)"}}>All <span className="count" style={{fontSize:"10px", padding:"0 5px", background:"var(--surface)", borderRadius:"999px"}}>6</span></span>
          <span className="filter-tab" style={{display:"inline-flex", alignItems:"center", gap:"var(--sp-1)", padding:"var(--sp-1) var(--sp-2)", borderRadius:"var(--r-sm)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>Running <span className="count" style={{fontSize:"10px", padding:"0 5px", background:"var(--surface)", borderRadius:"999px"}}>4</span></span>
          <span className="filter-tab" style={{display:"inline-flex", alignItems:"center", gap:"var(--sp-1)", padding:"var(--sp-1) var(--sp-2)", borderRadius:"var(--r-sm)", fontSize:"11px", cursor:"pointer", color:"var(--meta)"}}>Stopped <span className="count" style={{fontSize:"10px", padding:"0 5px", background:"var(--surface)", borderRadius:"999px"}}>2</span></span>
          <span style={{marginLeft: "auto"}}>
            <input className="input input-search" placeholder="Filter containers..." style={{fontSize: "11px", width: "200px"}} />
          </span>
        </div>

        <div className="container-list" style={{flex:1, overflowY:"auto", padding:"var(--sp-2)"}}>
          <div className="list-header" style={{display:"grid", gridTemplateColumns:"1fr 120px 100px 140px 100px 80px", padding:"var(--sp-1) var(--sp-3)", fontSize:"11px", color:"var(--meta)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", borderBottom:"1px solid var(--border)"}}>
            <span>Container</span><span>Status</span><span>CPU</span><span>Ports</span><span>Network</span><span></span>
          </div>

          {[
            {name:"nginx-proxy", img:"nginx:1.25-alpine", status:"Running", duration:"3 days", cpu:"34%", ports:"0.0.0.0:443->443/tcp<br/>0.0.0.0:80->80/tcp", net:"bridge", running:true},
            {name:"app-backend", img:"app/api:2.1.0", status:"Running", duration:"3 days", cpu:"12%", ports:"0.0.0.0:8080->8080/tcp", net:"bridge", running:true},
            {name:"redis-cache", img:"redis:7-alpine", status:"Running", duration:"3 days", cpu:"2%", ports:"6379/tcp", net:"bridge", running:true},
            {name:"postgres-main", img:"postgres:16-alpine", status:"Running", duration:"3 days", cpu:"8%", ports:"5432/tcp", net:"bridge", running:true},
            {name:"old-worker", img:"app/worker:1.8.0", status:"Exited", duration:"2 days ago", cpu:"-", ports:"-", net:"-", running:false},
            {name:"temp-debug", img:"ubuntu:22.04", status:"Exited", duration:"5 hours ago", cpu:"-", ports:"-", net:"-", running:false},
          ].map((c) => (
            <div key={c.name} className="container-card" style={{display:"grid", gridTemplateColumns:"1fr 120px 100px 140px 100px 80px", padding:"var(--sp-2) var(--sp-3)", fontSize:"12px", alignItems:"center", borderBottom:"1px solid var(--border)", opacity:c.running?1:0.6}}>
              <div className="container-name" style={{display:"flex", alignItems:"center", gap:"var(--sp-2)"}}>
                <div className="container-icon" style={{width:"28px", height:"28px", display:"grid", placeItems:"center", background:"var(--surface)", borderRadius:"var(--r-sm)", color: c.running ? "var(--success)" : "var(--muted)"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
                </div>
                <div>
                  <div className="container-title" style={{fontWeight:500}}>{c.name}</div>
                  <div className="container-image" style={{fontSize:"10px", color:"var(--meta)"}}>{c.img}</div>
                </div>
              </div>
              <div className="container-status" style={{display:"flex", alignItems:"center", gap:"var(--sp-1)"}}>
                <span className="status-dot" style={{width:"6px", height:"6px", borderRadius:"50%", background: c.running ? "var(--success)" : "var(--muted)"}}></span>
                <span style={{color: c.running ? "var(--success)" : "var(--muted)", fontSize:"12px"}}>{c.status}</span>
                <span style={{fontSize:"10px", color:"var(--meta)", marginLeft:"2px"}}>{c.duration}</span>
              </div>
              <div><span style={c.cpu !== "-" ? {color:"var(--warn)"} : {color:"var(--meta)"}}>{c.cpu}</span></div>
              <div className="text-sm" style={{fontSize:"11px"}} dangerouslySetInnerHTML={{__html:c.ports}} />
              <div className="text-sm text-muted" style={{fontSize:"11px", color:"var(--meta)"}}>{c.net}</div>
              <div className="container-actions" style={{display:"flex", gap:"var(--sp-1)"}}>
                <button className="btn-icon" title={c.running ? "Restart" : "Start"} style={{width:"28px", height:"28px", display:"grid", placeItems:"center", borderRadius:"var(--r-sm)", color:"var(--muted)", cursor:"pointer"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">{c.running ? <><path d="M23 4v6h-6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></> : <polygon points="5 3 19 12 5 21 5 3"/>}</svg>
                </button>
                <button className="btn-icon" title={c.running ? "Stop" : "Remove"} style={{width:"28px", height:"28px", display:"grid", placeItems:"center", borderRadius:"var(--r-sm)", color:"var(--danger)", cursor:"pointer"}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">{c.running ? <rect x="6" y="6" width="12" height="12" rx="1"/> : <><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>}</svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </DockPanel>
    </DockLayout>
  );
}
