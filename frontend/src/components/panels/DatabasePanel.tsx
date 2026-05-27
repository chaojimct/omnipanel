export function DatabasePanel() {
  return (
    <div className="db-layout">
      {/* Schema Browser */}
      <div className="schema-panel">
        <div className="schema-header">
          <h3>Schema</h3>
          <button className="btn-icon" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
        <div className="schema-search">
          <input className="input input-search" placeholder="Search tables..." style={{width: "100%", fontSize: "11px"}} />
        </div>
        <div className="schema-tree">
          <div className="schema-db">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
            app_production
          </div>

          <div className="schema-table active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            users
          </div>
          <div className="schema-col"><span className="col-key">PK</span> id <span className="col-type">uuid</span></div>
          <div className="schema-col">email <span className="col-type">varchar</span></div>
          <div className="schema-col">name <span className="col-type">varchar</span></div>
          <div className="schema-col">role <span className="col-type">enum</span></div>
          <div className="schema-col">created_at <span className="col-type">timestamptz</span></div>

          <div className="schema-table">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            orders
          </div>
          <div className="schema-col"><span className="col-key">PK</span> id <span className="col-type">uuid</span></div>
          <div className="schema-col"><span className="col-key">FK</span> user_id <span className="col-type">uuid</span></div>
          <div className="schema-col">total <span className="col-type">decimal</span></div>
          <div className="schema-col">status <span className="col-type">enum</span></div>
          <div className="schema-col">created_at <span className="col-type">timestamptz</span></div>

          <div className="schema-table">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            products
          </div>
          <div className="schema-table">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            sessions
          </div>
          <div className="schema-table">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            audit_logs
          </div>

          <div className="schema-db" style={{marginTop: "var(--sp-3)"}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
            analytics
          </div>
          <div className="schema-table">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            events
          </div>
          <div className="schema-table">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
            page_views
          </div>
        </div>
      </div>

      {/* Editor + Results */}
      <div className="db-editor-area">
        <div className="sql-editor-wrap">
          <div className="sql-toolbar">
            <button className="btn btn-primary btn-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Run Query
            </button>
            <button className="btn btn-ghost btn-sm">Format</button>
            <button className="btn btn-ghost btn-sm">Explain</button>
            <select className="db-select" style={{marginLeft: "auto"}}>
              <option>app_production</option>
              <option>analytics</option>
            </select>
          </div>
          <div className="sql-editor" contentEditable={true} spellCheck={false} suppressContentEditableWarning={true}><span className="comment">{"-- Recent orders with user details"}</span>
<span className="kw">{"SELECT"}</span>
    {"    u."}<span className="tbl">{"name"}</span>{","}
    {"    u."}<span className="tbl">{"email"}</span>{","}
    {"    o."}<span className="tbl">{"id"}</span>{" "}<span className="kw">{"AS"}</span>{" order_id,"}
    {"    o."}<span className="tbl">{"total"}</span>{","}
    {"    o."}<span className="tbl">{"status"}</span>{","}
    {"    o."}<span className="tbl">{"created_at"}</span>
<span className="kw">{"FROM"}</span>{" "}<span className="tbl">{"orders"}</span>{" o"}
<span className="kw">{"JOIN"}</span>{" "}<span className="tbl">{"users"}</span>{" u "}<span className="kw">{"ON"}</span>{" u."}<span className="tbl">{"id"}</span>{" "}<span className="op">{"="}</span>{" o."}<span className="tbl">{"user_id"}</span>
<span className="kw">{"WHERE"}</span>{" o."}<span className="tbl">{"created_at"}</span>{" "}<span className="op">{">"}</span>{" "}<span className="fn">{"NOW"}</span>{"() "}<span className="op">{"-"}</span>{" "}<span className="kw">{"INTERVAL"}</span>{" "}<span className="str">{"'7 days'"}</span>
<span className="kw">{"ORDER BY"}</span>{" o."}<span className="tbl">{"created_at"}</span>{" "}<span className="kw">{"DESC"}</span>
<span className="kw">{"LIMIT"}</span>{" "}<span className="num">{"50"}</span>{";"}</div>
        </div>

        <div className="results-area">
          <div className="results-header">
            <h3>Results</h3>
            <span className="results-meta">{"50 rows · 23ms"}</span>
            <div className="results-tabs">
              <div className="results-tab active">Grid</div>
              <div className="results-tab">JSON</div>
              <div className="results-tab">Chart</div>
            </div>
          </div>
          <div className="results-grid">
            <table>
              <thead>
                <tr>
                  <th>name</th>
                  <th>email</th>
                  <th>order_id</th>
                  <th>total</th>
                  <th>status</th>
                  <th>created_at</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Chen Wei</td><td>chen.wei@example.com</td><td className="text-muted">a1b2c3d4</td><td>{"¥ 2,480.00"}</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-26 08:42</td></tr>
                <tr><td>Li Xiaoming</td><td>lxm@example.com</td><td className="text-muted">e5f6g7h8</td><td>{"¥ 890.00"}</td><td><span className="badge badge-accent">processing</span></td><td className="text-muted">2026-05-26 07:15</td></tr>
                <tr><td>Wang Fang</td><td>wang.f@example.com</td><td className="text-muted">i9j0k1l2</td><td>{"¥ 3,120.50"}</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-25 22:30</td></tr>
                <tr><td>Zhang Lei</td><td>zhangl@example.com</td><td className="text-muted">m3n4o5p6</td><td>{"¥ 560.00"}</td><td><span className="badge badge-warn">pending</span></td><td className="text-muted">2026-05-25 19:08</td></tr>
                <tr><td>Liu Yan</td><td>liu.yan@example.com</td><td className="text-muted">q7r8s9t0</td><td>{"¥ 1,750.00"}</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-25 16:44</td></tr>
                <tr><td>Zhao Min</td><td>zhaom@example.com</td><td className="text-muted">u1v2w3x4</td><td>{"¥ 420.00"}</td><td><span className="badge badge-danger">cancelled</span></td><td className="text-muted">2026-05-25 14:22</td></tr>
                <tr><td>Sun Jie</td><td>sun.jie@example.com</td><td className="text-muted">y5z6a7b8</td><td>{"¥ 6,800.00"}</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-25 11:05</td></tr>
                <tr><td>Huang Tao</td><td>huangt@example.com</td><td className="text-muted">c9d0e1f2</td><td>{"¥ 340.00"}</td><td><span className="badge badge-accent">processing</span></td><td className="text-muted">2026-05-24 23:18</td></tr>
                <tr><td>Zhou Lin</td><td>zhou.l@example.com</td><td className="text-muted">g3h4i5j6</td><td>{"¥ 1,200.00"}</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-24 20:51</td></tr>
                <tr><td>Wu Jing</td><td>wuj@example.com</td><td className="text-muted">k7l8m9n0</td><td>{"¥ 950.00"}</td><td><span className="badge badge-warn">pending</span></td><td className="text-muted">2026-05-24 18:33</td></tr>
              </tbody>
            </table>
          </div>
          <div className="exec-stats">
            <span className="stat">Rows: <span className="stat-val">50</span></span>
            <span className="stat">Time: <span className="stat-val">23ms</span></span>
            <span className="stat">Plan: <span className="stat-val">Nested Loop Join</span></span>
            <span className="stat">Cost: <span className="stat-val">124.56</span></span>
          </div>
        </div>
      </div>

      {/* AI Panel */}
      <div className="db-ai-panel">
        <div className="db-ai-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" width="16" height="16"><path d="M12 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z"/><path d="M18 14h.01M6 14h.01"/><path d="M12 17v4M8 21h8"/></svg>
          <h3>AI Assistant</h3>
          <span className="badge badge-accent" style={{marginLeft: "auto"}}>NL2SQL</span>
        </div>
        <div className="db-ai-messages">
          <div className="db-ai-msg">
            <div className="msg-role ai">AI</div>
            <div>Connected to <code>app_production</code>. I can see 5 tables in the current schema. Try asking me to generate queries in natural language.</div>
          </div>
          <div className="db-ai-msg">
            <div className="msg-role user">User</div>
            <div>Show me the top 5 users by total order amount this month</div>
          </div>
          <div className="db-ai-msg">
            <div className="msg-role ai">AI</div>
            <div>Generated SQL:<br /><br /><code style={{display: "block", padding: "8px", background: "var(--bg-deeper)", borderRadius: "4px", fontSize: "12px", lineHeight: "1.5"}}>{"SELECT u.name, u.email,\n  SUM(o.total) AS total_amount\nFROM orders o\nJOIN users u ON u.id = o.user_id\nWHERE o.created_at >= date_trunc('month', NOW())\nGROUP BY u.id, u.name, u.email\nORDER BY total_amount DESC\nLIMIT 5;"}</code><br /><br /><span className="text-accent" style={{cursor: "pointer"}}>Run Query</span> {" · "} <span style={{cursor: "pointer"}}>Copy</span></div>
          </div>
        </div>
        <div className="db-ai-input">
          <input className="input" placeholder="Ask in natural language..." style={{width: "100%"}} />
        </div>
      </div>
    </div>
  );
}
