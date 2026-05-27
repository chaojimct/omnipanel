export function TasksPanel() {
  return (
    <div className="tasks-content">
      {/* Active Tasks */}
      <div className="task-panel active" id="panel-active">
        <div className="task-card">
          <div className="task-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" width="18" height="18"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
            <h3>Upload backup to S3</h3>
            <span className="badge badge-accent">Running</span>
          </div>
          <div className="task-progress">
            <div className="task-progress-fill" style={{width: "67%", background: "var(--accent)"}}></div>
          </div>
          <div className="task-meta">
            <span>67% {"·"} 2.1 GB / 3.2 GB</span>
            <span>Speed: 12 MB/s</span>
            <span>ETA: 1m 32s</span>
            <span>Target: s3://backups/prod-db/</span>
          </div>
          <div className="task-steps">
            <div className="task-step">
              <span className="step-icon text-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg></span>
              <span className="step-name">Compress database dump</span>
              <span className="step-status text-success">Done {"·"} 45s</span>
            </div>
            <div className="task-step">
              <span className="step-icon text-success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg></span>
              <span className="step-name">Generate checksum</span>
              <span className="step-status text-success">Done {"·"} 12s</span>
            </div>
            <div className="task-step">
              <span className="step-icon text-accent"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg></span>
              <span className="step-name">Upload to S3</span>
              <span className="step-status text-accent">Uploading...</span>
            </div>
            <div className="task-step">
              <span className="step-icon text-muted"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg></span>
              <span className="step-name">Verify integrity</span>
              <span className="step-status text-muted">Pending</span>
            </div>
          </div>
          <div className="task-actions">
            <button className="btn btn-ghost btn-sm">Pause</button>
            <button className="btn btn-danger btn-sm">Cancel</button>
          </div>
        </div>

        <div className="task-card">
          <div className="task-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" width="18" height="18"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/><rect x="18" y="7" width="4" height="5" rx="1"/></svg>
            <h3>Pull nginx:1.25-alpine image</h3>
            <span className="badge badge-accent">Running</span>
          </div>
          <div className="task-progress">
            <div className="task-progress-fill" style={{width: "34%", background: "var(--warn)"}}></div>
          </div>
          <div className="task-meta">
            <span>34% {"·"} 8.2 MB / 24.1 MB</span>
            <span>Layer 3/7</span>
            <span>Target: prod-web-01</span>
          </div>
          <div className="task-actions">
            <button className="btn btn-ghost btn-sm">Pause</button>
            <button className="btn btn-danger btn-sm">Cancel</button>
          </div>
        </div>

        <div className="task-card">
          <div className="task-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" width="18" height="18"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <h3>Daily server patrol</h3>
            <span className="badge badge-warn">Queued</span>
          </div>
          <div className="task-meta">
            <span>Scheduled: 08:00 daily</span>
            <span>Targets: All Servers</span>
          </div>
          <div className="task-actions">
            <button className="btn btn-primary btn-sm">Run Now</button>
            <button className="btn btn-ghost btn-sm">Edit Schedule</button>
          </div>
        </div>
      </div>

      {/* Draft Box */}
      <div className="task-panel" id="panel-drafts">
        <div style={{marginBottom: "var(--sp-4)"}}>
          <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Draft Box</h2>
          <p className="text-muted" style={{fontSize: "12px"}}>{"AI 生成或用户准备的命令、SQL、脚本先进入草稿箱，确认后执行"}</p>
        </div>

        <div className="draft-item">
          <div className="draft-icon" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
          </div>
          <div className="draft-body">
            <div className="draft-title">{"Block IP range 45.33.32.0/24"}</div>
            <div className="draft-desc">{"AI suggested: nginx.conf deny rule to block flood source · prod-web-01"}</div>
          </div>
          <div className="draft-actions">
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Execute</button>
            <button className="btn btn-ghost btn-sm" style={{color: "var(--danger)"}}>Discard</button>
          </div>
        </div>

        <div className="draft-item">
          <div className="draft-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div className="draft-body">
            <div className="draft-title">{"CREATE INDEX idx_orders_status_created"}</div>
            <div className="draft-desc">{"AI suggested: add composite index for dashboard query optimization · prod-db-master"}</div>
          </div>
          <div className="draft-actions">
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Execute</button>
            <button className="btn btn-ghost btn-sm" style={{color: "var(--danger)"}}>Discard</button>
          </div>
        </div>

        <div className="draft-item">
          <div className="draft-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
          </div>
          <div className="draft-body">
            <div className="draft-title">{"docker system prune -af --volumes"}</div>
            <div className="draft-desc">{"User prepared: clean all unused Docker resources · staging-api"}</div>
          </div>
          <div className="draft-actions">
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Execute</button>
            <button className="btn btn-ghost btn-sm" style={{color: "var(--danger)"}}>Discard</button>
          </div>
        </div>

        <div className="draft-item">
          <div className="draft-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
          </div>
          <div className="draft-body">
            <div className="draft-title">{"SELECT * FROM users WHERE last_login < NOW() - INTERVAL '90 days'"}</div>
            <div className="draft-desc">{"AI generated: find inactive users for cleanup · prod-db-master"}</div>
          </div>
          <div className="draft-actions">
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Execute</button>
            <button className="btn btn-ghost btn-sm" style={{color: "var(--danger)"}}>Discard</button>
          </div>
        </div>

        <div className="draft-item">
          <div className="draft-icon" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div className="draft-body">
            <div className="draft-title">{"ufw allow from 10.0.0.0/8 to any port 5432"}</div>
            <div className="draft-desc">{"User prepared: allow internal network access to PostgreSQL · prod-db-master"}</div>
          </div>
          <div className="draft-actions">
            <button className="btn btn-ghost btn-sm">Edit</button>
            <button className="btn btn-primary btn-sm">Execute</button>
            <button className="btn btn-ghost btn-sm" style={{color: "var(--danger)"}}>Discard</button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="task-panel" id="panel-history">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Task</th><th>Type</th><th>Status</th><th>Duration</th><th>Target</th><th>Time</th></tr>
            </thead>
            <tbody>
              <tr>
                <td style={{fontWeight: 500}}>DB Backup &amp; Verify</td>
                <td><span className="badge badge-accent">Workflow</span></td>
                <td><span className="badge badge-success">Success</span></td>
                <td>1m 15s</td>
                <td>prod-db-master</td>
                <td className="text-muted">6h ago</td>
              </tr>
              <tr>
                <td style={{fontWeight: 500}}>Docker Cleanup</td>
                <td><span className="badge badge-accent">Script</span></td>
                <td><span className="badge badge-success">Success</span></td>
                <td>28s</td>
                <td>staging-api</td>
                <td className="text-muted">1d ago</td>
              </tr>
              <tr>
                <td style={{fontWeight: 500}}>Export users table</td>
                <td><span className="badge badge-warn">SQL</span></td>
                <td><span className="badge badge-success">Success</span></td>
                <td>45s</td>
                <td>prod-db-master</td>
                <td className="text-muted">2d ago</td>
              </tr>
              <tr>
                <td style={{fontWeight: 500}}>Image pull: redis:7-alpine</td>
                <td><span className="badge badge-accent">Docker</span></td>
                <td><span className="badge badge-success">Success</span></td>
                <td>12s</td>
                <td>prod-web-01</td>
                <td className="text-muted">3d ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
