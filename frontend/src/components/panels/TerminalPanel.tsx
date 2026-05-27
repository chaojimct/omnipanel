export function TerminalPanel() {
  return (
    <div className="term-workspace">
      <div className="term-panes">
        {/* Top Pane */}
        <div className="term-pane" style={{flex:2}}>
          <div className="term-pane-header">
            <span className="env-prod">SSH</span>
            <span className="term-host-info">deploy@192.168.1.100</span>
            <span className="term-host-info">|</span>
            <span className="term-host-info">bash</span>
          </div>
          <div className="terminal-area" style={{padding: "var(--sp-4)"}}>
            <div className="terminal-line"><span className="terminal-muted">Last login: Mon May 26 10:32:15 on ttys001</span></div>
            <div className="terminal-line"><span className="terminal-success">user@web-server:~$ ssh deploy@192.168.1.100</span></div>
            <div className="terminal-line"><span className="terminal-output">Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)</span></div>
            <div className="terminal-line"><span className="terminal-output"> * Documentation:  https://help.ubuntu.com</span></div>
            <div className="terminal-line"><span className="terminal-output"> * Management:     https://landscape.canonical.com</span></div>
            <div className="terminal-line"><span className="terminal-output"> * Support:        https://ubuntu.com/advantage</span></div>
            <div className="terminal-line"><span className="terminal-success">deploy@web-server:~$ docker ps</span></div>
            <div className="terminal-line"><span className="terminal-output">CONTAINER ID   IMAGE          STATUS       PORTS                  NAMES</span></div>
            <div className="terminal-line"><span className="terminal-output">a1b2c3d4e5f6   nginx:1.25     Up 2 days    0.0.0.0:80-&gt;80/tcp     nginx-proxy</span></div>
            <div className="terminal-line"><span className="terminal-output">f6e5d4c3b2a1   postgres:14    Up 5 days    0.0.0.0:5432-&gt;5432     postgres-14</span></div>
            <div className="terminal-line"><span className="terminal-output">b2c3d4e5f6a1   redis:7-alpine Up 5 days    0.0.0.0:6379-&gt;6379     redis-cache</span></div>
            <div className="terminal-line"><span className="terminal-success">deploy@web-server:~$ <span className="cursor-blink">{"​"}</span></span></div>
          </div>
        </div>

        <div className="term-split-handle"></div>

        {/* Bottom Pane */}
        <div className="term-pane" style={{flex:1}}>
          <div className="term-pane-header">
            <span className="env-prod">DB</span>
            <span className="term-host-info">postgresql://db.internal:5432/app_production</span>
          </div>
          <div className="terminal-area" style={{padding: "var(--sp-4)"}}>
            <div className="terminal-line"><span className="terminal-muted">Connected to database: postgresql://db.internal:5432/app_production</span></div>
            <div className="terminal-line"><span className="terminal-success">postgres=# SELECT version();</span></div>
            <div className="terminal-line"><span className="terminal-output">PostgreSQL 14.10 (Ubuntu 14.10-0ubuntu0.22.04.1) on x86_64-pc-linux-gnu</span></div>
            <div className="terminal-line"><span className="terminal-success">postgres=# SELECT count(*) FROM users;</span></div>
            <div className="terminal-line"><span className="terminal-output"> count</span></div>
            <div className="terminal-line"><span className="terminal-output">-------</span></div>
            <div className="terminal-line"><span className="terminal-output"> 12847</span></div>
            <div className="terminal-line"><span className="terminal-output">(1 row)</span></div>
            <div className="terminal-line"><span className="terminal-success">postgres=# <span className="cursor-blink">{"​"}</span></span></div>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      <div className="ai-panel" style={{width: "360px"}}>
        <div className="ai-context-chips">
          <span className="context-chip"><span className="ctx-dot" style={{background: "var(--accent)"}}></span>web-server</span>
          <span className="context-chip"><span className="ctx-dot" style={{background: "var(--success)"}}></span>postgres-14</span>
          <span className="context-chip"><span className="ctx-dot" style={{background: "var(--success)"}}></span>app_production</span>
        </div>
        <div className="ai-messages">
          <div className="ai-msg assistant">
            <div className="ai-msg-body">I can help you analyze the database or suggest queries. What would you like to do?</div>
          </div>
          <div className="ai-msg user">
            <div className="ai-msg-body">Show me the top 10 tables by row count</div>
          </div>
          <div className="ai-msg assistant">
            <div className="ai-msg-body">Here's a query to find the top 10 tables by row count:

SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 10;</div>
          </div>
        </div>
        <div className="ai-input">
          <input placeholder="Ask AI anything..." type="text" />
          <button className="btn btn-primary btn-sm">Send</button>
        </div>
      </div>
    </div>
  );
}
