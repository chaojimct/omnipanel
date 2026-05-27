export function SshManager() {
  return (
    <div className="ssh-layout">
      {/* Host List Panel */}
      <div className="host-list-panel">
        <div className="host-list-header">
          <span>SSH Hosts</span>
          <button className="btn btn-primary btn-sm">+</button>
        </div>
        <div className="host-list-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Search hosts..." type="text" />
        </div>
        <div className="host-group-title">Production</div>
        <div className="host-item active">
          <span className="status-dot online"></span>
          <div>
            <div className="host-name">Web Server 01</div>
            <div className="host-addr">deploy@192.168.1.100</div>
          </div>
        </div>
        <div className="host-item">
          <span className="status-dot online"></span>
          <div>
            <div className="host-name">Web Server 02</div>
            <div className="host-addr">deploy@192.168.1.101</div>
          </div>
        </div>
        <div className="host-item">
          <span className="status-dot online"></span>
          <div>
            <div className="host-name">DB Primary</div>
            <div className="host-addr">postgres@192.168.1.200</div>
          </div>
        </div>
        <div className="host-group-title">Staging</div>
        <div className="host-item">
          <span className="status-dot online"></span>
          <div>
            <div className="host-name">Staging Server</div>
            <div className="host-addr">deploy@10.0.1.50</div>
          </div>
        </div>
        <div className="host-item">
          <span className="status-dot warning"></span>
          <div>
            <div className="host-name">Staging DB</div>
            <div className="host-addr">postgres@10.0.1.51</div>
          </div>
        </div>
        <div className="host-group-title">Development</div>
        <div className="host-item">
          <span className="status-dot online"></span>
          <div>
            <div className="host-name">Dev Machine</div>
            <div className="host-addr">dev@172.16.0.10</div>
          </div>
        </div>
        <div className="host-item">
          <span className="status-dot offline"></span>
          <div>
            <div className="host-name">CI Runner</div>
            <div className="host-addr">ci@172.16.0.20</div>
          </div>
        </div>
      </div>

      {/* SSH Detail */}
      <div className="ssh-detail">
        <div className="ssh-detail-header">
          <div style={{display: "flex", alignItems: "center", gap: "var(--sp-3)"}}>
            <span className="status-dot online"></span>
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

        <div className="ssh-detail-tabs">
          <div className="ssh-detail-tab active">Overview</div>
          <div className="ssh-detail-tab">Terminal</div>
          <div className="ssh-detail-tab">SFTP</div>
          <div className="ssh-detail-tab">Tunnels</div>
          <div className="ssh-detail-tab">Monitoring</div>
        </div>

        <div className="ssh-detail-body">
          <div className="quick-stats">
            <div className="stat"><span className="stat-label">Status</span><span className="stat-value" style={{color: "var(--success)"}}>Online</span></div>
            <div className="stat"><span className="stat-label">Last Connected</span><span className="stat-value">2 min ago</span></div>
            <div className="stat"><span className="stat-label">Key Type</span><span className="stat-value" style={{fontFamily: "var(--font-mono)"}}>ED25519</span></div>
            <div className="stat"><span className="stat-label">Fingerprint</span><span className="stat-value" style={{fontFamily: "var(--font-mono)"}}>SHA256:xR3m9...</span></div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Host</label>
              <input type="text" value="192.168.1.100" readOnly />
            </div>
            <div className="form-field">
              <label>Port</label>
              <input type="text" value="22" readOnly />
            </div>
            <div className="form-field">
              <label>Username</label>
              <input type="text" value="deploy" readOnly />
            </div>
            <div className="form-field">
              <label>Auth Method</label>
              <input type="text" value="SSH Key" readOnly />
            </div>
          </div>

          <div className="conn-actions">
            <button className="btn btn-primary">Open Terminal</button>
            <button className="btn btn-ghost">SFTP Browser</button>
            <button className="btn btn-ghost">Setup Tunnel</button>
            <button className="btn btn-ghost">Test Connection</button>
          </div>

          <div>
            <h3 style={{fontSize: "13px", fontWeight: 600, marginBottom: "var(--sp-3)"}}>Recent Activity</h3>
            <div className="table-wrap">
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
                  <tr>
                    <td>10:32</td>
                    <td>Connected</td>
                    <td>Web Server 01</td>
                    <td>deploy</td>
                    <td>45 min</td>
                  </tr>
                  <tr>
                    <td>09:15</td>
                    <td>File upload</td>
                    <td>Staging Server</td>
                    <td>deploy</td>
                    <td>{"—"}</td>
                  </tr>
                  <tr>
                    <td>08:45</td>
                    <td>Disconnected</td>
                    <td>Dev Machine</td>
                    <td>dev</td>
                    <td>2h 15m</td>
                  </tr>
                  <tr>
                    <td>Yesterday</td>
                    <td>Key rotated</td>
                    <td>DB Primary</td>
                    <td>postgres</td>
                    <td>{"—"}</td>
                  </tr>
                  <tr>
                    <td>Yesterday</td>
                    <td>Connected</td>
                    <td>CI Runner</td>
                    <td>ci</td>
                    <td>5h 30m</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
