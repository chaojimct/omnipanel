export function WorkflowPanel() {
  return (
    <div className="wf-workspace">
      <div className="wf-sidebar">
        <div className="wf-section-title">Scripts</div>
        <div className="wf-nav-item active" data-wf="scripts">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg>
          Quick Scripts
        </div>
        <div className="wf-nav-item" data-wf="templates">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          Command Templates
        </div>
        <div className="wf-section-title" style={{marginTop: "var(--sp-3)"}}>Workflows</div>
        <div className="wf-nav-item" data-wf="deploy">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          Deploy Flows
        </div>
        <div className="wf-nav-item" data-wf="patrol">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          Patrol Templates
        </div>
        <div className="wf-nav-item" data-wf="data">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
          Data Workflows
        </div>
        <div className="wf-section-title" style={{marginTop: "var(--sp-3)"}}>History</div>
        <div className="wf-nav-item" data-wf="history">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          Execution Log
        </div>
      </div>

      <div className="wf-main">
        <div className="wf-content">
          {/* Scripts Panel */}
          <div className="wf-panel active" id="panel-scripts">
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-4)"}}>
              <div>
                <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Quick Scripts</h2>
                <p className="text-muted" style={{fontSize: "12px"}}>{"高频操作封装为一键脚本，支持参数化和批量执行"}</p>
              </div>
              <input className="input input-search" placeholder="Search scripts..." style={{width: "200px"}} />
            </div>

            <div className="script-grid">
              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  </div>
                  <div>
                    <div className="sc-name">Deploy to Production</div>
                  </div>
                </div>
                <div className="sc-desc">{"拉取最新代码、构建镜像、更新 Compose、检查健康状态并输出部署摘要。"}</div>
                <div className="sc-meta">
                  <span className="sc-type badge-accent">Shell</span>
                  <span className="sc-risk badge-danger">High Risk</span>
                  <span>prod-web-01, prod-web-02</span>
                </div>
              </div>

              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
                  </div>
                  <div>
                    <div className="sc-name">DB Backup &amp; Verify</div>
                  </div>
                </div>
                <div className="sc-desc">{"备份生产数据库、校验完整性、上传至远程存储并发送通知。"}</div>
                <div className="sc-meta">
                  <span className="sc-type badge-warn">SQL</span>
                  <span className="sc-risk badge-warn">Medium</span>
                  <span>prod-db-master</span>
                </div>
              </div>

              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--warn-soft)", color: "var(--warn)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg>
                  </div>
                  <div>
                    <div className="sc-name">Docker Cleanup</div>
                  </div>
                </div>
                <div className="sc-desc">{"清理悬空镜像、停止的容器、未使用的卷和网络，释放磁盘空间。"}</div>
                <div className="sc-meta">
                  <span className="sc-type badge-accent">Docker</span>
                  <span className="sc-risk badge-success">Low</span>
                  <span>All Servers</span>
                </div>
              </div>

              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--danger-soft)", color: "var(--danger)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <div>
                    <div className="sc-name">Server Health Check</div>
                  </div>
                </div>
                <div className="sc-desc">{"批量检查 CPU、内存、磁盘、服务状态、证书有效期和安全更新。"}</div>
                <div className="sc-meta">
                  <span className="sc-type badge-accent">Shell</span>
                  <span className="sc-risk badge-success">Read-only</span>
                  <span>All Servers</span>
                </div>
              </div>

              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                  </div>
                  <div>
                    <div className="sc-name">Log Rotation</div>
                  </div>
                </div>
                <div className="sc-desc">{"压缩归档超过 7 天的日志文件，清理 30 天前的归档，报告释放空间。"}</div>
                <div className="sc-meta">
                  <span className="sc-type badge-accent">Shell</span>
                  <span className="sc-risk badge-success">Low</span>
                  <span>prod-web-01</span>
                </div>
              </div>

              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <div className="sc-name">SSL Cert Renew</div>
                  </div>
                </div>
                <div className="sc-desc">{"检查证书到期时间、自动续期 Let's Encrypt 证书并重载 Nginx。"}</div>
                <div className="sc-meta">
                  <span className="sc-type badge-accent">Shell</span>
                  <span className="sc-risk badge-warn">Medium</span>
                  <span>prod-web-01, prod-web-02</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deploy Flows Panel */}
          <div className="wf-panel" id="panel-deploy">
            <div style={{marginBottom: "var(--sp-4)"}}>
              <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Deploy Flows</h2>
              <p className="text-muted" style={{fontSize: "12px"}}>{"将拉代码、构建、部署、检查串成可复用的流程"}</p>
            </div>

            <div className="wf-flow">
              <div className="wf-flow-header">
                <h3>Production Deploy</h3>
                <span className="badge badge-danger">High Risk</span>
                <span className="text-muted text-sm">Last run: 2h ago {"·"} 3m 42s</span>
                <button className="btn btn-primary btn-sm" style={{marginLeft: "auto"}}>Run</button>
              </div>
              <div className="wf-step">
                <div className="wf-step-num">1</div>
                <div className="wf-step-body">
                  <h4>Git Pull</h4>
                  <p>{"拉取 main 分支最新代码到生产服务器"}</p>
                </div>
                <div className="wf-step-actions">
                  <span className="badge badge-success">Passed</span>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">2</div>
                <div className="wf-step-body">
                  <h4>Build Docker Image</h4>
                  <p>{"使用 Dockerfile 构建应用镜像，标签为 git commit SHA"}</p>
                </div>
                <div className="wf-step-actions">
                  <span className="badge badge-success">Passed</span>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">3</div>
                <div className="wf-step-body">
                  <h4>Run Tests</h4>
                  <p>{"执行单元测试和集成测试，失败则中止部署"}</p>
                </div>
                <div className="wf-step-actions">
                  <span className="badge badge-success">Passed</span>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">4</div>
                <div className="wf-step-body">
                  <h4>Docker Compose Up</h4>
                  <p>{"更新 Compose 服务，滚动重启应用容器"}</p>
                </div>
                <div className="wf-step-actions">
                  <span className="badge badge-success">Passed</span>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">5</div>
                <div className="wf-step-body">
                  <h4>Health Check</h4>
                  <p>{"等待 30s 后检查 /health 端点，确认服务正常"}</p>
                </div>
                <div className="wf-step-actions">
                  <span className="badge badge-success">Passed</span>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">6</div>
                <div className="wf-step-body">
                  <h4>Notify</h4>
                  <p>{"发送部署结果到 Slack / 飞书通知"}</p>
                </div>
                <div className="wf-step-actions">
                  <span className="badge badge-success">Passed</span>
                </div>
              </div>
            </div>

            <div className="wf-flow">
              <div className="wf-flow-header">
                <h3>Staging Deploy</h3>
                <span className="badge badge-warn">Medium</span>
                <span className="text-muted text-sm">Last run: 1d ago {"·"} 2m 18s</span>
                <button className="btn btn-primary btn-sm" style={{marginLeft: "auto"}}>Run</button>
              </div>
              <div className="wf-step">
                <div className="wf-step-num">1</div>
                <div className="wf-step-body">
                  <h4>Git Pull (develop)</h4>
                  <p>{"拉取 develop 分支代码"}</p>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">2</div>
                <div className="wf-step-body">
                  <h4>Build &amp; Push</h4>
                  <p>{"构建镜像并推送到 staging registry"}</p>
                </div>
              </div>
              <div className="wf-connector"></div>
              <div className="wf-step">
                <div className="wf-step-num">3</div>
                <div className="wf-step-body">
                  <h4>Deploy to Staging</h4>
                  <p>{"更新 staging 环境容器"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Execution History Panel */}
          <div className="wf-panel" id="panel-history">
            <div style={{marginBottom: "var(--sp-4)"}}>
              <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Execution History</h2>
              <p className="text-muted" style={{fontSize: "12px"}}>{"所有脚本和工作流的执行记录"}</p>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Target</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Triggered By</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{fontWeight: 500}}>Production Deploy</td>
                    <td><span className="badge badge-accent">Workflow</span></td>
                    <td>prod-web-01, prod-web-02</td>
                    <td><span className="badge badge-success">Success</span></td>
                    <td>3m 42s</td>
                    <td>chaoj</td>
                    <td className="text-muted">2h ago</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: 500}}>DB Backup &amp; Verify</td>
                    <td><span className="badge badge-warn">SQL</span></td>
                    <td>prod-db-master</td>
                    <td><span className="badge badge-success">Success</span></td>
                    <td>1m 15s</td>
                    <td>Scheduled</td>
                    <td className="text-muted">6h ago</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: 500}}>Docker Cleanup</td>
                    <td><span className="badge badge-accent">Docker</span></td>
                    <td>All Servers</td>
                    <td><span className="badge badge-success">Success</span></td>
                    <td>28s</td>
                    <td>chaoj</td>
                    <td className="text-muted">1d ago</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: 500}}>Server Health Check</td>
                    <td><span className="badge badge-accent">Shell</span></td>
                    <td>All Servers</td>
                    <td><span className="badge badge-warn">Warning</span></td>
                    <td>45s</td>
                    <td>Scheduled</td>
                    <td className="text-muted">1d ago</td>
                  </tr>
                  <tr>
                    <td style={{fontWeight: 500}}>Staging Deploy</td>
                    <td><span className="badge badge-accent">Workflow</span></td>
                    <td>staging-api</td>
                    <td><span className="badge badge-success">Success</span></td>
                    <td>2m 18s</td>
                    <td>CI/CD</td>
                    <td className="text-muted">1d ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Command Templates Panel */}
          <div className="wf-panel" id="panel-templates">
            <div style={{marginBottom: "var(--sp-4)"}}>
              <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Command Templates</h2>
              <p className="text-muted" style={{fontSize: "12px"}}>{"带变量的命令模板，支持参数化执行"}</p>
            </div>
            <div className="script-grid">
              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 17l6-6-6-6"/><path d="M12 19h8"/></svg></div>
                  <div className="sc-name">Tail Service Logs</div>
                </div>
                <div className="sc-desc"><code>{"tail -f /var/log/{{service}}/error.log | grep \"{{keyword}}\""}</code></div>
                <div className="sc-meta"><span className="sc-type badge-accent">Shell</span><span className="sc-risk badge-success">Read-only</span></div>
              </div>
              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg></div>
                  <div className="sc-name">Query User by Email</div>
                </div>
                <div className="sc-desc"><code>{"SELECT * FROM users WHERE email = '{{email}}' LIMIT 10;"}</code></div>
                <div className="sc-meta"><span className="sc-type badge-warn">SQL</span><span className="sc-risk badge-success">Read-only</span></div>
              </div>
              <div className="script-card">
                <div className="sc-header">
                  <div className="sc-icon" style={{background: "var(--warn-soft)", color: "var(--warn)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="6" height="5" rx="1"/><rect x="10" y="7" width="6" height="5" rx="1"/></svg></div>
                  <div className="sc-name">Restart Container</div>
                </div>
                <div className="sc-desc"><code>{"docker restart {{container_name}}"}</code></div>
                <div className="sc-meta"><span className="sc-type badge-accent">Docker</span><span className="sc-risk badge-warn">Medium</span></div>
              </div>
            </div>
          </div>

          {/* Patrol Templates Panel */}
          <div className="wf-panel" id="panel-patrol">
            <div style={{marginBottom: "var(--sp-4)"}}>
              <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Patrol Templates</h2>
              <p className="text-muted" style={{fontSize: "12px"}}>{"定期巡检模板，自动检查服务器健康状态"}</p>
            </div>
            <div className="wf-flow">
              <div className="wf-flow-header">
                <h3>Daily Server Patrol</h3>
                <span className="badge badge-success">Read-only</span>
                <span className="text-muted text-sm">Schedule: Daily 08:00</span>
                <button className="btn btn-primary btn-sm" style={{marginLeft: "auto"}}>Run Now</button>
              </div>
              <div className="wf-step"><div className="wf-step-num">1</div><div className="wf-step-body"><h4>CPU &amp; Memory Check</h4><p>{"检查 CPU 和内存使用率，超过 90% 告警"}</p></div></div>
              <div className="wf-connector"></div>
              <div className="wf-step"><div className="wf-step-num">2</div><div className="wf-step-body"><h4>Disk Space Check</h4><p>{"检查磁盘使用率，超过 85% 告警"}</p></div></div>
              <div className="wf-connector"></div>
              <div className="wf-step"><div className="wf-step-num">3</div><div className="wf-step-body"><h4>Service Status</h4><p>{"检查 nginx、docker、postgresql 等关键服务状态"}</p></div></div>
              <div className="wf-connector"></div>
              <div className="wf-step"><div className="wf-step-num">4</div><div className="wf-step-body"><h4>SSL Certificate</h4><p>{"检查证书到期时间，30 天内到期告警"}</p></div></div>
              <div className="wf-connector"></div>
              <div className="wf-step"><div className="wf-step-num">5</div><div className="wf-step-body"><h4>Security Updates</h4><p>{"检查可用安全更新数量"}</p></div></div>
              <div className="wf-connector"></div>
              <div className="wf-step"><div className="wf-step-num">6</div><div className="wf-step-body"><h4>Generate Report</h4><p>{"汇总巡检结果，发送到通知渠道"}</p></div></div>
            </div>
          </div>

          {/* Data Workflows Panel */}
          <div className="wf-panel" id="panel-data">
            <div style={{marginBottom: "var(--sp-4)"}}>
              <h2 style={{fontSize: "16px", fontWeight: 700, marginBottom: "4px"}}>Data Workflows</h2>
              <p className="text-muted" style={{fontSize: "12px"}}>{"数据库数据排查、修复、同步和导出工作流"}</p>
            </div>
            <div className="script-grid">
              <div className="script-card">
                <div className="sc-header"><div className="sc-icon" style={{background: "var(--accent-soft)", color: "var(--accent)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div><div className="sc-name">Data Investigation</div></div>
                <div className="sc-desc">{"执行多段查询，自动汇总关键结果，生成 AI 分析摘要"}</div>
                <div className="sc-meta"><span className="sc-type badge-warn">SQL</span><span className="sc-risk badge-success">Read-only</span></div>
              </div>
              <div className="script-card">
                <div className="sc-header"><div className="sc-icon" style={{background: "var(--danger-soft)", color: "var(--danger)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></div><div className="sc-name">Data Repair</div></div>
                <div className="sc-desc">{"查询影响范围 → 生成修复 SQL + 回滚 SQL → 确认后执行"}</div>
                <div className="sc-meta"><span className="sc-type badge-warn">SQL</span><span className="sc-risk badge-danger">High Risk</span></div>
              </div>
              <div className="script-card">
                <div className="sc-header"><div className="sc-icon" style={{background: "var(--success-soft)", color: "var(--success)"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg></div><div className="sc-name">Data Sync</div></div>
                <div className="sc-desc">{"从源库读取、校验、转换、写入目标库，输出差异报告"}</div>
                <div className="sc-meta"><span className="sc-type badge-warn">SQL</span><span className="sc-risk badge-danger">High Risk</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
