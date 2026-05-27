export function ServerPanel() {
  return (
    <div className="server-workspace">
      {/* Server List Sidebar */}
      <div className="server-sidebar">
        <div className="server-sidebar-header">
          <span>All Servers</span>
          <span className="badge badge-success">5 online</span>
        </div>
        <div className="server-group">
          <div className="server-group-title">Production</div>
          <div className="server-item active">
            <span className="status-dot online"></span>
            <span className="server-name">prod-web-01</span>
            <span className="env-tag" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>PROD</span>
          </div>
          <div className="server-item">
            <span className="status-dot online"></span>
            <span className="server-name">prod-web-02</span>
            <span className="env-tag" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>PROD</span>
          </div>
          <div className="server-item">
            <span className="status-dot online"></span>
            <span className="server-name">prod-db-master</span>
            <span className="env-tag" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>PROD</span>
          </div>
        </div>
        <div className="server-group">
          <div className="server-group-title">Staging</div>
          <div className="server-item">
            <span className="status-dot online"></span>
            <span className="server-name">staging-api</span>
            <span className="env-tag" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>STG</span>
          </div>
          <div className="server-item">
            <span className="status-dot warning"></span>
            <span className="server-name">staging-worker</span>
            <span className="env-tag" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>STG</span>
          </div>
        </div>
        <div className="server-group">
          <div className="server-group-title">Development</div>
          <div className="server-item">
            <span className="status-dot online"></span>
            <span className="server-name">dev-local</span>
            <span className="env-tag" style={{background: "var(--success-soft)", color: "var(--success)"}}>DEV</span>
          </div>
          <div className="server-item">
            <span className="status-dot offline"></span>
            <span className="server-name">dev-build</span>
            <span className="env-tag" style={{background: "var(--success-soft)", color: "var(--success)"}}>DEV</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="server-main">
        {/* Tab: Monitoring */}
        <div className="tab-panel active" id="tab-monitor">
          <div className="server-content">
            <div className="monitor-grid">
              <div className="monitor-card">
                <div className="monitor-label">
                  <span>CPU Usage</span>
                  <span className="badge badge-success">Normal</span>
                </div>
                <div className="monitor-value text-accent">23.4%</div>
                <div className="monitor-bar">
                  <div className="monitor-bar-fill" style={{width: "23.4%", background: "var(--accent)"}}></div>
                </div>
                <div className="monitor-detail">4 cores {"·"} Intel Xeon E5-2680 {"·"} 2.40GHz</div>
              </div>
              <div className="monitor-card">
                <div className="monitor-label">
                  <span>Memory</span>
                  <span className="badge badge-warn">78%</span>
                </div>
                <div className="monitor-value text-warn">6.2 GB</div>
                <div className="monitor-bar">
                  <div className="monitor-bar-fill" style={{width: "78%", background: "var(--warn)"}}></div>
                </div>
                <div className="monitor-detail">8 GB total {"·"} 1.8 GB available</div>
              </div>
              <div className="monitor-card">
                <div className="monitor-label">
                  <span>Disk</span>
                  <span className="badge badge-success">54%</span>
                </div>
                <div className="monitor-value">54 GB</div>
                <div className="monitor-bar">
                  <div className="monitor-bar-fill" style={{width: "54%", background: "var(--success)"}}></div>
                </div>
                <div className="monitor-detail">100 GB total {"·"} 46 GB available</div>
              </div>
              <div className="monitor-card">
                <div className="monitor-label">
                  <span>Network</span>
                  <span className="badge badge-accent">Active</span>
                </div>
                <div className="monitor-value text-success">{"↑"} 2.4 <span style={{fontSize: "14px", fontWeight: 400}}>MB/s</span></div>
                <div className="monitor-bar">
                  <div className="monitor-bar-fill" style={{width: "24%", background: "var(--success)"}}></div>
                </div>
                <div className="monitor-detail">{"↓"} 1.1 MB/s {"·"} eth0 {"·"} 847 connections</div>
              </div>
            </div>

            <div className="chart-area">
              <div className="chart-header">
                <h3>CPU Usage {"—"} Last 24h</h3>
                <div className="chart-tabs">
                  <span className="chart-tab">1h</span>
                  <span className="chart-tab">6h</span>
                  <span className="chart-tab active">24h</span>
                  <span className="chart-tab">7d</span>
                </div>
              </div>
              <div className="chart-body"></div>
            </div>

            <div className="info-grid">
              <div className="info-card">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>
                  System Info
                </h4>
                <div className="info-row"><span className="label">Hostname</span><span className="value">prod-web-01</span></div>
                <div className="info-row"><span className="label">OS</span><span className="value">Ubuntu 22.04.3 LTS</span></div>
                <div className="info-row"><span className="label">Kernel</span><span className="value">5.15.0-91-generic</span></div>
                <div className="info-row"><span className="label">Uptime</span><span className="value">72h 14m</span></div>
                <div className="info-row"><span className="label">Load Average</span><span className="value">1.23, 0.98, 0.87</span></div>
              </div>
              <div className="info-card">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  Network
                </h4>
                <div className="info-row"><span className="label">IP Address</span><span className="value">10.0.1.21</span></div>
                <div className="info-row"><span className="label">Public IP</span><span className="value">203.0.113.42</span></div>
                <div className="info-row"><span className="label">Interface</span><span className="value">eth0</span></div>
                <div className="info-row"><span className="label">Bandwidth</span><span className="value">1 Gbps</span></div>
                <div className="info-row"><span className="label">Firewall</span><span className="value">ufw active</span></div>
              </div>
              <div className="info-card">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/><rect x="18" y="7" width="4" height="5" rx="1"/><rect x="6" y="2" width="6" height="5" rx="1"/></svg>
                  Docker
                </h4>
                <div className="info-row"><span className="label">Containers</span><span className="value">4 running / 2 stopped</span></div>
                <div className="info-row"><span className="label">Images</span><span className="value">12</span></div>
                <div className="info-row"><span className="label">Volumes</span><span className="value">8</span></div>
                <div className="info-row"><span className="label">Networks</span><span className="value">3</span></div>
                <div className="info-row"><span className="label">Docker Version</span><span className="value">24.0.7</span></div>
              </div>
              <div className="info-card">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Security
                </h4>
                <div className="info-row"><span className="label">SSH Key Auth</span><span className="value text-success">Enabled</span></div>
                <div className="info-row"><span className="label">Root Login</span><span className="value text-warn">Permitted</span></div>
                <div className="info-row"><span className="label">Fail2ban</span><span className="value text-success">Active</span></div>
                <div className="info-row"><span className="label">Last Login</span><span className="value">2026-05-26 09:14</span></div>
                <div className="info-row"><span className="label">Open Ports</span><span className="value">22, 80, 443, 8080</span></div>
              </div>
            </div>

            <h3 style={{fontSize: "13px", fontWeight: 600, marginBottom: "var(--sp-3)"}}>All Servers Overview</h3>
            <div className="overview-grid">
              <div className="overview-card">
                <div className="ov-header">
                  <span className="status-dot online"></span>
                  <div>
                    <div className="ov-name">prod-web-01</div>
                    <div className="ov-ip">10.0.1.21 {"·"} Ubuntu 22.04</div>
                  </div>
                </div>
                <div className="ov-metrics">
                  <div className="ov-metric">CPU<span className="ov-val">23%</span></div>
                  <div className="ov-metric">MEM<span className="ov-val">78%</span></div>
                  <div className="ov-metric">DISK<span className="ov-val">54%</span></div>
                  <div className="ov-metric">NET<span className="ov-val">2.4M</span></div>
                </div>
              </div>
              <div className="overview-card">
                <div className="ov-header">
                  <span className="status-dot online"></span>
                  <div>
                    <div className="ov-name">prod-web-02</div>
                    <div className="ov-ip">10.0.1.22 {"·"} Ubuntu 22.04</div>
                  </div>
                </div>
                <div className="ov-metrics">
                  <div className="ov-metric">CPU<span className="ov-val">45%</span></div>
                  <div className="ov-metric">MEM<span className="ov-val">62%</span></div>
                  <div className="ov-metric">DISK<span className="ov-val">41%</span></div>
                  <div className="ov-metric">NET<span className="ov-val">1.8M</span></div>
                </div>
              </div>
              <div className="overview-card">
                <div className="ov-header">
                  <span className="status-dot online"></span>
                  <div>
                    <div className="ov-name">prod-db-master</div>
                    <div className="ov-ip">10.0.1.30 {"·"} Ubuntu 22.04</div>
                  </div>
                </div>
                <div className="ov-metrics">
                  <div className="ov-metric">CPU<span className="ov-val">67%</span></div>
                  <div className="ov-metric">MEM<span className="ov-val">89%</span></div>
                  <div className="ov-metric">DISK<span className="ov-val">72%</span></div>
                  <div className="ov-metric">NET<span className="ov-val">3.1M</span></div>
                </div>
              </div>
              <div className="overview-card">
                <div className="ov-header">
                  <span className="status-dot online"></span>
                  <div>
                    <div className="ov-name">staging-api</div>
                    <div className="ov-ip">10.0.2.10 {"·"} Ubuntu 22.04</div>
                  </div>
                </div>
                <div className="ov-metrics">
                  <div className="ov-metric">CPU<span className="ov-val">12%</span></div>
                  <div className="ov-metric">MEM<span className="ov-val">34%</span></div>
                  <div className="ov-metric">DISK<span className="ov-val">28%</span></div>
                  <div className="ov-metric">NET<span className="ov-val">0.4M</span></div>
                </div>
              </div>
              <div className="overview-card">
                <div className="ov-header">
                  <span className="status-dot warning"></span>
                  <div>
                    <div className="ov-name">staging-worker</div>
                    <div className="ov-ip">10.0.2.11 {"·"} Ubuntu 22.04</div>
                  </div>
                </div>
                <div className="ov-metrics">
                  <div className="ov-metric">CPU<span className="ov-val text-warn">92%</span></div>
                  <div className="ov-metric">MEM<span className="ov-val text-warn">95%</span></div>
                  <div className="ov-metric">DISK<span className="ov-val">61%</span></div>
                  <div className="ov-metric">NET<span className="ov-val">0.1M</span></div>
                </div>
              </div>
              <div className="overview-card">
                <div className="ov-header">
                  <span className="status-dot offline"></span>
                  <div>
                    <div className="ov-name">dev-build</div>
                    <div className="ov-ip">10.0.3.20 {"·"} Ubuntu 22.04</div>
                  </div>
                </div>
                <div className="ov-metrics">
                  <div className="ov-metric">CPU<span className="ov-val text-muted">{"—"}</span></div>
                  <div className="ov-metric">MEM<span className="ov-val text-muted">{"—"}</span></div>
                  <div className="ov-metric">DISK<span className="ov-val text-muted">{"—"}</span></div>
                  <div className="ov-metric">NET<span className="ov-val text-muted">{"—"}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab: Processes */}
        <div className="tab-panel" id="tab-processes">
          <div className="server-content">
            <div className="process-section">
              <div className="process-header">
                <h3>Running Processes</h3>
                <span className="text-muted text-sm">187 total</span>
                <input className="process-search" placeholder="Search processes..." type="text" />
                <button className="btn btn-danger btn-sm">Kill Process</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>PID</th>
                      <th>Name</th>
                      <th>User</th>
                      <th>CPU %</th>
                      <th>MEM %</th>
                      <th>RSS</th>
                      <th>Status</th>
                      <th>Started</th>
                      <th>Command</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>1</td><td style={{fontWeight: 500}}>systemd</td><td>root</td><td>0.0</td><td>0.3</td><td>12 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>/sbin/init</td></tr>
                    <tr><td>1247</td><td style={{fontWeight: 500}}>dockerd</td><td>root</td><td className="text-warn">8.2</td><td>2.1</td><td>168 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>/usr/bin/dockerd -H fd://</td></tr>
                    <tr><td>1893</td><td style={{fontWeight: 500}}>node</td><td>app</td><td>3.4</td><td className="text-warn">12.8</td><td>1024 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>node dist/server.js</td></tr>
                    <tr><td>2104</td><td style={{fontWeight: 500}}>nginx</td><td>www-data</td><td>0.1</td><td>0.4</td><td>32 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>nginx: master process</td></tr>
                    <tr><td>2205</td><td style={{fontWeight: 500}}>postgres</td><td>postgres</td><td>2.1</td><td>6.7</td><td>536 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>postgres: wal receiver</td></tr>
                    <tr><td>3012</td><td style={{fontWeight: 500}}>redis-server</td><td>redis</td><td>0.3</td><td>1.2</td><td>96 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>redis-server *:6379</td></tr>
                    <tr><td>4521</td><td style={{fontWeight: 500}}>sshd</td><td>root</td><td>0.0</td><td>0.1</td><td>8 MB</td><td><span className="badge badge-success">S</span></td><td>May 23</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>sshd: /usr/sbin/sshd</td></tr>
                    <tr><td>5678</td><td style={{fontWeight: 500}}>python3</td><td>app</td><td className="text-danger">45.2</td><td className="text-warn">8.4</td><td>672 MB</td><td><span className="badge badge-warn">R</span></td><td>09:12</td><td className="text-muted truncate" style={{maxWidth: "200px"}}>python3 ml_training.py --batch 256</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Tab: Services */}
        <div className="tab-panel" id="tab-services">
          <div className="server-content">
            <div className="service-list">
              <div style={{padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "var(--sp-3)"}}>
                <h3 style={{fontSize: "13px", fontWeight: 600}}>systemd Services</h3>
                <span className="text-muted text-sm">prod-web-01</span>
                <input className="process-search" placeholder="Search services..." type="text" style={{marginLeft: "auto"}} />
              </div>
              <div className="service-item"><span className="svc-name">nginx.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">A high performance web server and reverse proxy</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">docker.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">Docker Application Container Engine</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">postgresql.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">PostgreSQL RDBMS</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">redis-server.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">Advanced key-value store</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">sshd.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">OpenSSH server daemon</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">fail2ban.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">Ban hosts that cause multiple authentication errors</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">cron.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">Regular background program processing daemon</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">ufw.service</span><span className="svc-status badge-success">active</span><span className="svc-desc">Uncomplicated Firewall</span><div className="svc-actions"><button className="btn btn-ghost btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Stop</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
              <div className="service-item"><span className="svc-name">ml-worker.service</span><span className="svc-status badge-danger">failed</span><span className="svc-desc">ML training worker {"—"} crashed at 09:12</span><div className="svc-actions"><button className="btn btn-primary btn-sm">Restart</button><button className="btn btn-ghost btn-sm">Logs</button></div></div>
            </div>
          </div>
        </div>

        {/* Tab: Logs */}
        <div className="tab-panel" id="tab-logs">
          <div className="server-content">
            <div style={{display: "flex", alignItems: "center", gap: "var(--sp-3)", marginBottom: "var(--sp-3)"}}>
              <h3 style={{fontSize: "13px", fontWeight: 600}}>System Logs</h3>
              <select className="input" style={{fontSize: "11px"}}>
                <option>syslog</option>
                <option>auth.log</option>
                <option>kern.log</option>
                <option>nginx/error.log</option>
                <option>docker/daemon.log</option>
              </select>
              <select className="input" style={{fontSize: "11px"}}>
                <option>All Levels</option>
                <option>Error</option>
                <option>Warning</option>
                <option>Info</option>
              </select>
              <button className="btn btn-ghost btn-sm" style={{marginLeft: "auto"}}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
              <button className="btn btn-ghost btn-sm">Tail -f</button>
            </div>
            <div className="terminal-area" style={{border: "1px solid var(--border)", borderRadius: "var(--r-md)", minHeight: "400px"}}>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:14:02 prod-web-01 sshd[4521]: </span><span className="terminal-output">Accepted publickey for root from 192.168.1.100 port 52341 ssh2</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:13:45 prod-web-01 nginx[2104]: </span><span className="terminal-output">200 GET /api/users 12ms</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:13:46 prod-web-01 nginx[2104]: </span><span className="terminal-output">200 GET /api/users 8ms</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:12:01 prod-web-01 nginx[2104]: </span><span className="terminal-warn">upstream connection timeout</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:12:01 prod-web-01 nginx[2104]: </span><span className="terminal-warn">upstream connection timeout</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:11:33 prod-web-01 kernel: </span><span className="terminal-error">[UFW BLOCK] IN=eth0 SRC=45.33.32.104 DST=10.0.1.21 PROTO=TCP DPT=443</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:10:15 prod-web-01 systemd[1]: </span><span className="terminal-output">Started ml-worker.service</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:09:42 prod-web-01 dockerd[1247]: </span><span className="terminal-output">Container app-backend started</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:08:01 prod-web-01 CRON[5102]: </span><span className="terminal-output">(root) CMD (/usr/local/bin/backup.sh)</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:05:18 prod-web-01 fail2ban[3201]: </span><span className="terminal-warn">Ban 45.33.32.104 (sshd)</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 09:01:00 prod-web-01 systemd[1]: </span><span className="terminal-output">Starting Daily apt activities...</span></div>
              <div className="terminal-line"><span className="terminal-muted">May 26 08:55:33 prod-web-01 postgres[2205]: </span><span className="terminal-output">checkpoint complete: wrote 128 buffers</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
