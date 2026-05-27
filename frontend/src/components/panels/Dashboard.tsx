import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      <div className="dashboard">
        <div style={{flex:"1", display:"flex", flexDirection:"column", minHeight:0}}>
          <div className="dash-grid">
            {/* Left column */}
            <div className="dash-col">
              {/* Recent Workspaces */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  {"最近工作区"}
                  <a onClick={() => navigate("/terminal")} className="qa-btn" style={{marginLeft: "auto"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    {"新建"}
                  </a>
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:"var(--sp-2)"}}>
                  <div className="ws-card" onClick={() => navigate("/terminal")}>
                    <div className="ws-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
                    </div>
                    <div className="ws-body">
                      <div className="ws-name">prod-web-01 Terminal</div>
                      <div className="ws-meta"><span>2 tabs, 1 split</span><span>10 min ago</span></div>
                    </div>
                    <button className="btn btn-primary btn-sm">Open</button>
                  </div>
                  <div className="ws-card" onClick={() => navigate("/database")}>
                    <div className="ws-icon" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
                    </div>
                    <div className="ws-body">
                      <div className="ws-name">prod-db-master Query</div>
                      <div className="ws-meta"><span>3 queries saved</span><span>1h ago</span></div>
                    </div>
                    <button className="btn btn-primary btn-sm">Open</button>
                  </div>
                  <div className="ws-card" onClick={() => navigate("/ssh")}>
                    <div className="ws-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </div>
                    <div className="ws-body">
                      <div className="ws-name">staging-api SSH</div>
                      <div className="ws-meta"><span>SFTP active</span><span>3h ago</span></div>
                    </div>
                    <button className="btn btn-primary btn-sm">Open</button>
                  </div>
                </div>
              </div>

              {/* Quick Connect */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {"快捷连接"}
                </div>
                <div className="qc-grid">
                  <a className="qc-btn" onClick={() => navigate("/terminal")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
                    <span className="qc-label">Terminal</span>
                    <span className="qc-hint">Local</span>
                  </a>
                  <a className="qc-btn" onClick={() => navigate("/ssh")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    <span className="qc-label">prod-web-01</span>
                    <span className="qc-hint">SSH</span>
                  </a>
                  <a className="qc-btn" onClick={() => navigate("/database")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
                    <span className="qc-label">prod-db</span>
                    <span className="qc-hint">PostgreSQL</span>
                  </a>
                  <a className="qc-btn" onClick={() => navigate("/docker")}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
                    <span className="qc-label">Containers</span>
                    <span className="qc-hint">Docker</span>
                  </a>
                </div>
              </div>

              {/* Active Tasks */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  {"活跃任务"}
                  <a onClick={() => navigate("/tasks")} className="qa-btn" style={{marginLeft: "auto"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    {"全部"}
                  </a>
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:0}}>
                  <div className="task-row">
                    <span className="task-dot" style={{background:"var(--accent)"}}></span>
                    <span className="task-name">Upload backup to S3</span>
                    <span className="task-info">67% {"·"} ETA 1m32s</span>
                    <span className="badge badge-accent">Running</span>
                  </div>
                  <div className="task-row">
                    <span className="task-dot" style={{background:"var(--warn)"}}></span>
                    <span className="task-name">Pull nginx:1.25-alpine</span>
                    <span className="task-info">34% {"·"} Layer 3/7</span>
                    <span className="badge badge-accent">Running</span>
                  </div>
                  <div className="task-row">
                    <span className="task-dot" style={{background:"var(--meta)"}}></span>
                    <span className="task-name">Daily server patrol</span>
                    <span className="task-info">08:00 daily</span>
                    <span className="badge badge-warn">Queued</span>
                  </div>
                </div>
              </div>

              {/* Draft Box */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                  {"草稿箱"}
                  <span className="badge badge-warn" style={{marginLeft: "auto"}}>3</span>
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:"var(--sp-1)"}}>
                  <div className="alert-card">
                    <span className="alert-dot" style={{background:"var(--danger)"}}></span>
                    <div className="alert-body">
                      <div className="alert-title">Block IP 45.33.32.0/24</div>
                      <div className="alert-time">nginx deny {"·"} prod-web-01</div>
                    </div>
                  </div>
                  <div className="alert-card">
                    <span className="alert-dot" style={{background:"var(--accent)"}}></span>
                    <div className="alert-body">
                      <div className="alert-title">CREATE INDEX idx_orders_status</div>
                      <div className="alert-time">Composite index {"·"} prod-db</div>
                    </div>
                  </div>
                  <div className="alert-card">
                    <span className="alert-dot" style={{background:"var(--success)"}}></span>
                    <div className="alert-body">
                      <div className="alert-title">docker system prune -af</div>
                      <div className="alert-time">Clean resources {"·"} staging-api</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="dash-col">
              {/* System Resources */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  {"系统资源概览"}
                </div>
                <div style={{background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-md)", padding:"var(--sp-3) var(--sp-4)"}}>
                  <div className="res-bar-group">
                    <div className="res-bar-label"><span>prod-web-01 {"—"} CPU</span><span>23%</span></div>
                    <div className="res-bar"><div className="res-bar-fill" style={{width:"23%", background:"var(--success)"}}></div></div>
                  </div>
                  <div className="res-bar-group">
                    <div className="res-bar-label"><span>prod-web-01 {"—"} Memory</span><span>1.0 GB / 4 GB</span></div>
                    <div className="res-bar"><div className="res-bar-fill" style={{width:"25%", background:"var(--success)"}}></div></div>
                  </div>
                  <div className="res-bar-group">
                    <div className="res-bar-label"><span>prod-db {"—"} CPU</span><span>67%</span></div>
                    <div className="res-bar"><div className="res-bar-fill" style={{width:"67%", background:"var(--warn)"}}></div></div>
                  </div>
                  <div className="res-bar-group">
                    <div className="res-bar-label"><span>prod-db {"—"} Memory</span><span>3.2 GB / 4 GB</span></div>
                    <div className="res-bar"><div className="res-bar-fill" style={{width:"80%", background:"var(--warn)"}}></div></div>
                  </div>
                  <div className="res-bar-group">
                    <div className="res-bar-label"><span>staging-worker {"—"} Disk</span><span>92% {"·"} WAL logs</span></div>
                    <div className="res-bar"><div className="res-bar-fill" style={{width:"92%", background:"var(--danger)"}}></div></div>
                  </div>
                  <div className="res-bar-group">
                    <div className="res-bar-label"><span>staging-api {"—"} CPU</span><span>12%</span></div>
                    <div className="res-bar"><div className="res-bar-fill" style={{width:"12%", background:"var(--success)"}}></div></div>
                  </div>
                </div>
              </div>

              {/* Docker Containers */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/><rect x="18" y="7" width="4" height="5" rx="1"/><rect x="6" y="2" width="6" height="5" rx="1"/><path d="M2 17h20c0 2.76-4.48 5-10 5S2 19.76 2 17z"/></svg>
                  {"容器状态"}
                  <a onClick={() => navigate("/docker")} className="qa-btn" style={{marginLeft: "auto"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    {"全部"}
                  </a>
                </div>
                <div className="docker-mini-grid">
                  <div className="docker-mini-item" onClick={() => navigate("/docker")}><span className="dm-dot" style={{background:"var(--success)"}}></span><span className="dm-name">nginx-proxy</span><span className="dm-status">Up 3d</span></div>
                  <div className="docker-mini-item" onClick={() => navigate("/docker")}><span className="dm-dot" style={{background:"var(--success)"}}></span><span className="dm-name">app-backend</span><span className="dm-status">Up 3d</span></div>
                  <div className="docker-mini-item" onClick={() => navigate("/docker")}><span className="dm-dot" style={{background:"var(--success)"}}></span><span className="dm-name">redis-cache</span><span className="dm-status">Up 3d</span></div>
                  <div className="docker-mini-item" onClick={() => navigate("/docker")}><span className="dm-dot" style={{background:"var(--success)"}}></span><span className="dm-name">postgres-main</span><span className="dm-status">Up 3d</span></div>
                  <div className="docker-mini-item" onClick={() => navigate("/docker")}><span className="dm-dot" style={{background:"var(--warn)"}}></span><span className="dm-name">celery-worker</span><span className="dm-status">Restart</span></div>
                  <div className="docker-mini-item" onClick={() => navigate("/docker")}><span className="dm-dot" style={{background:"var(--meta)"}}></span><span className="dm-name">redis-staging</span><span className="dm-status">Stopped</span></div>
                </div>
              </div>

              {/* Server Status */}
              <div>
                <div className="dash-section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>
                  {"服务器状态"}
                  <a onClick={() => navigate("/server")} className="qa-btn" style={{marginLeft: "auto"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    {"全部"}
                  </a>
                </div>
                <div className="conn-grid">
                  <div className="conn-item" onClick={() => navigate("/server")}><span className="conn-dot" style={{background:"var(--success)"}}></span><span className="conn-name">prod-web-01</span><span className="conn-type">23%</span></div>
                  <div className="conn-item" onClick={() => navigate("/server")}><span className="conn-dot" style={{background:"var(--success)"}}></span><span className="conn-name">prod-web-02</span><span className="conn-type">18%</span></div>
                  <div className="conn-item" onClick={() => navigate("/server")}><span className="conn-dot" style={{background:"var(--warn)"}}></span><span className="conn-name">prod-db</span><span className="conn-type">67%</span></div>
                  <div className="conn-item" onClick={() => navigate("/server")}><span className="conn-dot" style={{background:"var(--success)"}}></span><span className="conn-name">staging-api</span><span className="conn-type">12%</span></div>
                  <div className="conn-item" onClick={() => navigate("/server")}><span className="conn-dot" style={{background:"var(--danger)"}}></span><span className="conn-name">staging-wk</span><span className="conn-type">Disk 92%</span></div>
                  <div className="conn-item" onClick={() => navigate("/server")}><span className="conn-dot" style={{background:"var(--success)"}}></span><span className="conn-name">dev-local</span><span className="conn-type">8%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
