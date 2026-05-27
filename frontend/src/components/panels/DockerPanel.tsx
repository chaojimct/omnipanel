export function DockerPanel() {
  return (
    <div className="docker-layout">
      {/* Stats */}
      <div className="docker-stats">
        <div className="docker-stat">
          <div className="stat-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-val">4</span>
            <span className="stat-label">Running</span>
          </div>
        </div>
        <div className="docker-stat">
          <div className="stat-icon" style={{background: "var(--muted)", color: "var(--bg)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-val">2</span>
            <span className="stat-label">Stopped</span>
          </div>
        </div>
        <div className="docker-stat">
          <div className="stat-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-val">12</span>
            <span className="stat-label">Images</span>
          </div>
        </div>
        <div className="docker-stat">
          <div className="stat-icon" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div className="stat-info">
            <span className="stat-val">3</span>
            <span className="stat-label">Volumes</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="docker-filters">
        <span className="filter-tab active">All <span className="count">6</span></span>
        <span className="filter-tab">Running <span className="count">4</span></span>
        <span className="filter-tab">Stopped <span className="count">2</span></span>
        <span style={{marginLeft: "auto"}}>
          <input className="input input-search" placeholder="Filter containers..." style={{fontSize: "11px", width: "200px"}} />
        </span>
      </div>

      {/* Container List */}
      <div className="container-list">
        <div className="list-header">
          <span>Container</span>
          <span>Status</span>
          <span>CPU</span>
          <span>Ports</span>
          <span>Network</span>
          <span></span>
        </div>

        <div className="container-card">
          <div className="container-name">
            <div className="container-icon" style={{color: "var(--success)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div>
              <div className="container-title">nginx-proxy</div>
              <div className="container-image">nginx:1.25-alpine</div>
            </div>
          </div>
          <div className="container-status">
            <span className="status-dot" style={{background: "var(--success)"}}></span>
            <span className="text-success text-sm">Running</span>
            <span className="text-muted text-xs">3 days</span>
          </div>
          <div><span className="text-warn">34%</span></div>
          <div className="text-sm">{"0.0.0.0:443->443/tcp"}<br />{"0.0.0.0:80->80/tcp"}</div>
          <div className="text-sm text-muted">bridge</div>
          <div className="container-actions">
            <button className="btn-icon" title="Restart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
            <button className="btn-icon" title="Stop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></button>
          </div>
        </div>

        <div className="container-card">
          <div className="container-name">
            <div className="container-icon" style={{color: "var(--success)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div>
              <div className="container-title">app-backend</div>
              <div className="container-image">app/api:2.1.0</div>
            </div>
          </div>
          <div className="container-status">
            <span className="status-dot" style={{background: "var(--success)"}}></span>
            <span className="text-success text-sm">Running</span>
            <span className="text-muted text-xs">3 days</span>
          </div>
          <div><span>12%</span></div>
          <div className="text-sm">{"0.0.0.0:8080->8080/tcp"}</div>
          <div className="text-sm text-muted">bridge</div>
          <div className="container-actions">
            <button className="btn-icon" title="Restart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
            <button className="btn-icon" title="Stop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></button>
          </div>
        </div>

        <div className="container-card">
          <div className="container-name">
            <div className="container-icon" style={{color: "var(--success)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div>
              <div className="container-title">redis-cache</div>
              <div className="container-image">redis:7-alpine</div>
            </div>
          </div>
          <div className="container-status">
            <span className="status-dot" style={{background: "var(--success)"}}></span>
            <span className="text-success text-sm">Running</span>
            <span className="text-muted text-xs">3 days</span>
          </div>
          <div><span>2%</span></div>
          <div className="text-sm">6379/tcp</div>
          <div className="text-sm text-muted">bridge</div>
          <div className="container-actions">
            <button className="btn-icon" title="Restart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
            <button className="btn-icon" title="Stop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></button>
          </div>
        </div>

        <div className="container-card">
          <div className="container-name">
            <div className="container-icon" style={{color: "var(--success)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div>
              <div className="container-title">postgres-main</div>
              <div className="container-image">postgres:16-alpine</div>
            </div>
          </div>
          <div className="container-status">
            <span className="status-dot" style={{background: "var(--success)"}}></span>
            <span className="text-success text-sm">Running</span>
            <span className="text-muted text-xs">3 days</span>
          </div>
          <div><span>8%</span></div>
          <div className="text-sm">5432/tcp</div>
          <div className="text-sm text-muted">bridge</div>
          <div className="container-actions">
            <button className="btn-icon" title="Restart"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button>
            <button className="btn-icon" title="Stop"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="6" y="6" width="12" height="12" rx="1"/></svg></button>
          </div>
        </div>

        <div className="container-card" style={{opacity: 0.6}}>
          <div className="container-name">
            <div className="container-icon" style={{color: "var(--muted)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div>
              <div className="container-title">old-worker</div>
              <div className="container-image">app/worker:1.8.0</div>
            </div>
          </div>
          <div className="container-status">
            <span className="status-dot" style={{background: "var(--muted)"}}></span>
            <span className="text-muted text-sm">Exited</span>
            <span className="text-muted text-xs">2 days ago</span>
          </div>
          <div><span className="text-muted">-</span></div>
          <div className="text-sm text-muted">-</div>
          <div className="text-sm text-muted">-</div>
          <div className="container-actions">
            <button className="btn-icon" title="Start"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
            <button className="btn-icon text-danger" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </div>

        <div className="container-card" style={{opacity: 0.6}}>
          <div className="container-name">
            <div className="container-icon" style={{color: "var(--muted)"}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
            </div>
            <div>
              <div className="container-title">temp-debug</div>
              <div className="container-image">ubuntu:22.04</div>
            </div>
          </div>
          <div className="container-status">
            <span className="status-dot" style={{background: "var(--muted)"}}></span>
            <span className="text-muted text-sm">Exited</span>
            <span className="text-muted text-xs">5 hours ago</span>
          </div>
          <div><span className="text-muted">-</span></div>
          <div className="text-sm text-muted">-</div>
          <div className="text-sm text-muted">-</div>
          <div className="container-actions">
            <button className="btn-icon" title="Start"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
            <button className="btn-icon text-danger" title="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
}
