import { useMemo, useState, type ReactNode } from "react";
import { useActionStore } from "../../stores/actionStore";

type WorkflowSection = "scripts" | "templates" | "deploy" | "patrol" | "data" | "history";

type RiskTone = "success" | "warn" | "danger" | "accent";

const SECTIONS: Array<{ id: WorkflowSection; title: string; label: string; icon: ReactNode }> = [
  {
    id: "scripts",
    title: "Scripts",
    label: "Quick Scripts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 17l6-6-6-6" />
        <path d="M12 19h8" />
      </svg>
    ),
  },
  {
    id: "templates",
    title: "Scripts",
    label: "Command Templates",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    ),
  },
  {
    id: "deploy",
    title: "Workflows",
    label: "Deploy Flows",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    id: "patrol",
    title: "Workflows",
    label: "Patrol Templates",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    id: "data",
    title: "Workflows",
    label: "Data Workflows",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    id: "history",
    title: "History",
    label: "Execution Log",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
];

const QUICK_SCRIPTS = [
  {
    name: "Deploy to Production",
    desc: "拉取最新代码、构建镜像、更新 Compose、检查健康状态并输出部署摘要。",
    type: "Shell",
    risk: "High Risk",
    riskTone: "danger" as RiskTone,
    typeTone: "accent" as RiskTone,
    color: "var(--success)",
    target: "prod-web-01, prod-web-02",
    command: "./deploy-prod.sh",
  },
  {
    name: "DB Backup & Verify",
    desc: "备份生产数据库、校验完整性、上传至远程存储并发送通知。",
    type: "SQL",
    risk: "Medium",
    riskTone: "warn" as RiskTone,
    typeTone: "warn" as RiskTone,
    color: "var(--accent)",
    target: "prod-db-master",
    command: "./backup-db.sh --verify",
  },
  {
    name: "Docker Cleanup",
    desc: "清理悬空镜像、停止的容器、未使用的卷和网络，释放磁盘空间。",
    type: "Docker",
    risk: "Low",
    riskTone: "success" as RiskTone,
    typeTone: "accent" as RiskTone,
    color: "var(--warn)",
    target: "All Servers",
    command: "docker system prune -af",
  },
  {
    name: "Server Health Check",
    desc: "批量检查 CPU、内存、磁盘、服务状态、证书有效期和安全更新。",
    type: "Shell",
    risk: "Read-only",
    riskTone: "success" as RiskTone,
    typeTone: "accent" as RiskTone,
    color: "var(--danger)",
    target: "All Servers",
    command: "./server-health-check.sh --readonly",
  },
  {
    name: "Log Rotation",
    desc: "压缩归档超过 7 天的日志文件，清理 30 天前的归档，报告释放空间。",
    type: "Shell",
    risk: "Low",
    riskTone: "success" as RiskTone,
    typeTone: "accent" as RiskTone,
    color: "var(--accent)",
    target: "prod-web-01",
    command: "./logrotate-maint.sh",
  },
  {
    name: "SSL Cert Renew",
    desc: "检查证书到期时间、自动续期 Let's Encrypt 证书并重载 Nginx。",
    type: "Shell",
    risk: "Medium",
    riskTone: "warn" as RiskTone,
    typeTone: "accent" as RiskTone,
    color: "var(--success)",
    target: "prod-web-01, prod-web-02",
    command: "./renew-cert.sh",
  },
];

const DEPLOY_FLOWS = [
  {
    name: "Production Deploy",
    risk: "High Risk",
    riskTone: "danger" as RiskTone,
    meta: "Last run: 2h ago · 3m 42s",
    steps: [
      ["Git Pull", "拉取 main 分支最新代码到生产服务器", "Passed"],
      ["Build Docker Image", "构建镜像并打上 git commit SHA", "Passed"],
      ["Run Tests", "执行 smoke tests 与关键集成检查", "Passed"],
      ["Docker Compose Up", "滚动更新应用容器", "Passed"],
      ["Health Check", "检查 /health 与核心 API", "Passed"],
      ["Notify", "发送部署结果到通知渠道", "Passed"],
    ],
  },
  {
    name: "Staging Deploy",
    risk: "Medium",
    riskTone: "warn" as RiskTone,
    meta: "Last run: 1d ago · 2m 18s",
    steps: [
      ["Git Pull (develop)", "拉取 develop 分支代码", "Ready"],
      ["Build & Push", "构建镜像并推送到 staging registry", "Ready"],
      ["Deploy to Staging", "更新 staging 环境容器", "Ready"],
    ],
  },
];

const HISTORY = [
  ["Production Deploy", "Workflow", "prod-web-01, prod-web-02", "Success", "3m 42s", "chaoj", "2h ago"],
  ["DB Backup & Verify", "SQL", "prod-db-master", "Success", "1m 15s", "Scheduled", "6h ago"],
  ["Docker Cleanup", "Docker", "All Servers", "Success", "28s", "chaoj", "1d ago"],
  ["Server Health Check", "Shell", "All Servers", "Warning", "45s", "Scheduled", "1d ago"],
  ["Staging Deploy", "Workflow", "staging-api", "Success", "2m 18s", "CI/CD", "1d ago"],
];

const TEMPLATES = [
  ["Tail Service Logs", "tail -f /var/log/{{service}}/error.log | grep \"{{keyword}}\"", "Shell", "Read-only"],
  ["Query User by Email", "SELECT * FROM users WHERE email = '{{email}}' LIMIT 10;", "SQL", "Read-only"],
  ["Restart Container", "docker restart {{container_name}}", "Docker", "Medium"],
];

const DATA_WORKFLOWS = [
  ["Data Investigation", "执行多段查询，自动汇总关键结果，生成 AI 分析摘要", "Read-only"],
  ["Data Repair", "查询影响范围 → 生成修复 SQL + 回滚 SQL → 确认后执行", "High Risk"],
  ["Data Sync", "从源库读取、校验、转换、写入目标库，输出差异报告", "High Risk"],
];

function badgeClass(tone: RiskTone) {
  return `badge badge-${tone}`;
}

export function WorkflowPanel() {
  const enqueueAction = useActionStore((state) => state.enqueueAction);
  const [activeSection, setActiveSection] = useState<WorkflowSection>("scripts");
  const [query, setQuery] = useState("");

  const groupedSections = useMemo(() => {
    return Array.from(new Set(SECTIONS.map((section) => section.title))).map((title) => ({
      title,
      items: SECTIONS.filter((section) => section.title === title),
    }));
  }, []);

  const filteredScripts = QUICK_SCRIPTS.filter((script) =>
    [script.name, script.desc, script.target].some((field) => field.toLowerCase().includes(query.toLowerCase()))
  );

  const runAction = (title: string, description: string, command?: string) => {
    enqueueAction({
      type: "workflow",
      title,
      description,
      command,
      resourceId: "prod-web-01",
      source: "用户",
    });
  };

  return (
    <div className="wf-workspace">
      <div className="wf-sidebar">
        {groupedSections.map((group) => (
          <div key={group.title}>
            <div className="wf-section-title">{group.title}</div>
            {group.items.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`wf-nav-item${activeSection === section.id ? " active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="wf-main">
        <div className="wf-content">
          {activeSection === "scripts" && (
            <div className="wf-panel active">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--sp-4)", gap: "var(--sp-3)" }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Quick Scripts</h2>
                  <p className="text-muted" style={{ fontSize: 12 }}>高频操作封装为一键脚本，支持参数化和批量执行</p>
                </div>
                <input
                  className="input input-search"
                  placeholder="Search scripts..."
                  style={{ width: 220 }}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="script-grid">
                {filteredScripts.map((script) => (
                  <button
                    key={script.name}
                    type="button"
                    className="script-card"
                    style={{ textAlign: "left" }}
                    onClick={() => runAction(script.name, `${script.target} · ${script.desc}`, script.command)}
                  >
                    <div className="sc-header">
                      <div className="sc-icon" style={{ background: `${script.color}20`, color: script.color }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                        </svg>
                      </div>
                      <div className="sc-name">{script.name}</div>
                    </div>
                    <div className="sc-desc">{script.desc}</div>
                    <div className="sc-meta">
                      <span className={badgeClass(script.typeTone)}>{script.type}</span>
                      <span className={badgeClass(script.riskTone)}>{script.risk}</span>
                      <span>{script.target}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "deploy" && (
            <div className="wf-panel active">
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Deploy Flows</h2>
                <p className="text-muted" style={{ fontSize: 12 }}>保留分步审批与回滚入口，不盲目照搬静态稿</p>
              </div>
              {DEPLOY_FLOWS.map((flow) => (
                <div key={flow.name} className="wf-flow">
                  <div className="wf-flow-header">
                    <h3>{flow.name}</h3>
                    <span className={badgeClass(flow.riskTone)}>{flow.risk}</span>
                    <span className="text-muted text-sm">{flow.meta}</span>
                    <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={() => runAction(flow.name, `${flow.name} · 审批式执行`, `workflow run ${flow.name}`)}>
                      Run
                    </button>
                  </div>
                  {flow.steps.map(([title, desc, status], index) => (
                    <div key={title}>
                      <div className="wf-step">
                        <div className="wf-step-num">{index + 1}</div>
                        <div className="wf-step-body">
                          <h4>{title}</h4>
                          <p>{desc}</p>
                        </div>
                        <div className="wf-step-actions">
                          <span className={status === "Passed" ? "badge badge-success" : "badge badge-muted"}>{status}</span>
                        </div>
                      </div>
                      {index < flow.steps.length - 1 && <div className="wf-connector" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {activeSection === "history" && (
            <div className="wf-panel active">
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Execution History</h2>
                <p className="text-muted" style={{ fontSize: 12 }}>所有脚本和工作流的执行记录</p>
              </div>
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
                  {HISTORY.map((row) => (
                    <tr key={row[0]}>
                      <td style={{ fontWeight: 500 }}>{row[0]}</td>
                      <td><span className="badge badge-accent">{row[1]}</span></td>
                      <td>{row[2]}</td>
                      <td><span className={`badge ${row[3] === "Warning" ? "badge-warn" : "badge-success"}`}>{row[3]}</span></td>
                      <td>{row[4]}</td>
                      <td>{row[5]}</td>
                      <td className="text-muted">{row[6]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === "templates" && (
            <div className="wf-panel active">
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Command Templates</h2>
                <p className="text-muted" style={{ fontSize: 12 }}>保留模板化参数与预执行审阅能力</p>
              </div>
              <div className="script-grid">
                {TEMPLATES.map(([name, command, type, risk]) => (
                  <div key={name} className="script-card">
                    <div className="sc-header">
                      <div className="sc-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                      <div className="sc-name">{name}</div>
                    </div>
                    <div className="sc-desc"><code>{command}</code></div>
                    <div className="sc-meta">
                      <span className="badge badge-accent">{type}</span>
                      <span className={`badge ${risk === "Medium" ? "badge-warn" : "badge-success"}`}>{risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "patrol" && (
            <div className="wf-panel active">
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Patrol Templates</h2>
                <p className="text-muted" style={{ fontSize: 12 }}>定期巡检模板，自动检查服务器健康状态</p>
              </div>
              <div className="wf-flow">
                <div className="wf-flow-header">
                  <h3>Daily Server Patrol</h3>
                  <span className="badge badge-success">Read-only</span>
                  <span className="text-muted text-sm">Schedule: Daily 08:00</span>
                  <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={() => runAction("Daily Server Patrol", "巡检模板 · 只读巡检", "workflow run patrol --readonly")}>
                    Run Now
                  </button>
                </div>
                {[
                  "CPU & Memory Check",
                  "Disk Space Check",
                  "Service Status",
                  "SSL Certificate",
                  "Security Updates",
                  "Generate Report",
                ].map((step, index, list) => (
                  <div key={step}>
                    <div className="wf-step">
                      <div className="wf-step-num">{index + 1}</div>
                      <div className="wf-step-body">
                        <h4>{step}</h4>
                        <p>自动采集指标并生成结构化结果，异常项进入待确认队列</p>
                      </div>
                    </div>
                    {index < list.length - 1 && <div className="wf-connector" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "data" && (
            <div className="wf-panel active">
              <div style={{ marginBottom: "var(--sp-4)" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Data Workflows</h2>
                <p className="text-muted" style={{ fontSize: 12 }}>数据库数据排查、修复、同步和导出工作流</p>
              </div>
              <div className="script-grid">
                {DATA_WORKFLOWS.map(([name, desc, risk]) => (
                  <div key={name} className="script-card">
                    <div className="sc-header">
                      <div className="sc-icon" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3v18h18" />
                          <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                      </div>
                      <div className="sc-name">{name}</div>
                    </div>
                    <div className="sc-desc">{desc}</div>
                    <div className="sc-meta">
                      <span className="badge badge-warn">SQL</span>
                      <span className={`badge ${risk === "High Risk" ? "badge-danger" : "badge-success"}`}>{risk}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
