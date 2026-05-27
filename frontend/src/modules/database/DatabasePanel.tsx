import { useState } from "react";
import { DockLayout, DockPanel, DockHandle } from "../../components/dock";
import { SchemaBrowser } from "./SchemaBrowser";
import { SqlEditor } from "./SqlEditor";
import { AiAssistant } from "./AiAssistant";

const INITIAL_SQL = `-- Recent orders with user details
SELECT
    u.name,
    u.email,
    o.id AS order_id,
    o.total,
    o.status,
    o.created_at
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.created_at > NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC
LIMIT 50;`;

export function DatabasePanel() {
  const [sql, setSql] = useState(INITIAL_SQL);

  return (
    <DockLayout>
      <DockPanel defaultSize={17} minSize={10} collapsible>
        <SchemaBrowser />
      </DockPanel>
      <DockHandle />
      <DockPanel minSize={30}>
        <DockLayout direction="vertical">
          <DockPanel defaultSize={55} minSize={20}>
            <div className="sql-toolbar" style={{display:"flex", alignItems:"center", padding:"var(--sp-2) var(--sp-4)", borderBottom:"1px solid var(--border)", gap:"var(--sp-2)", background:"var(--bg)"}}>
              <button className="btn btn-primary btn-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Run Query
              </button>
              <button className="btn btn-ghost btn-sm">Format</button>
              <button className="btn btn-ghost btn-sm">Explain</button>
              <select className="db-select" style={{marginLeft:"auto", padding:"3px 8px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", color:"var(--fg)", fontSize:"11px", fontFamily:"var(--font)"}}>
                <option>app_production</option>
                <option>analytics</option>
              </select>
            </div>
            <SqlEditor value={sql} onChange={setSql} />
          </DockPanel>
          <DockHandle direction="vertical" />
          <DockPanel minSize={20}>
            <div className="results-area" style={{flex:1, display:"flex", flexDirection:"column", minHeight:0, overflow:"hidden"}}>
              <div className="results-header" style={{display:"flex", alignItems:"center", padding:"var(--sp-2) var(--sp-4)", borderBottom:"1px solid var(--border)", gap:"var(--sp-3)", background:"var(--bg)", flexShrink:0}}>
                <h3 style={{fontSize:"12px", fontWeight:600}}>Results</h3>
                <span className="results-meta" style={{fontSize:"11px", color:"var(--meta)"}}>{"50 rows · 23ms"}</span>
                <div className="results-tabs" style={{display:"flex", gap:0, marginLeft:"var(--sp-4)"}}>
                  <div className="results-tab active" style={{padding:"var(--sp-1) var(--sp-3)", fontSize:"11px", color:"var(--fg)", borderBottom:"2px solid var(--accent)", cursor:"pointer"}}>Grid</div>
                  <div className="results-tab" style={{padding:"var(--sp-1) var(--sp-3)", fontSize:"11px", color:"var(--meta)", cursor:"pointer"}}>JSON</div>
                  <div className="results-tab" style={{padding:"var(--sp-1) var(--sp-3)", fontSize:"11px", color:"var(--meta)", cursor:"pointer"}}>Chart</div>
                </div>
              </div>
              <div className="results-grid" style={{flex:1, overflow:"auto"}}>
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
              <div className="exec-stats" style={{display:"flex", alignItems:"center", gap:"var(--sp-4)", padding:"var(--sp-2) var(--sp-4)", borderTop:"1px solid var(--border)", fontSize:"11px", color:"var(--meta)", background:"var(--bg-deeper)", flexShrink:0}}>
                <span className="stat">Rows: <span className="stat-val" style={{color:"var(--fg-2)", fontWeight:500}}>50</span></span>
                <span className="stat">Time: <span className="stat-val" style={{color:"var(--fg-2)", fontWeight:500}}>23ms</span></span>
                <span className="stat">Plan: <span className="stat-val" style={{color:"var(--fg-2)", fontWeight:500}}>Nested Loop Join</span></span>
                <span className="stat">Cost: <span className="stat-val" style={{color:"var(--fg-2)", fontWeight:500}}>124.56</span></span>
              </div>
            </div>
          </DockPanel>
        </DockLayout>
      </DockPanel>
      <DockHandle />
      <DockPanel defaultSize={23} minSize={15} collapsible>
        <AiAssistant />
      </DockPanel>
    </DockLayout>
  );
}
