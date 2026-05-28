import { useState, useCallback, useRef } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { DockLayout, DockPanel, DockHandle } from "../../components/dock";
import { SqlEditor } from "./SqlEditor";

// ─── Types ───

interface ColumnSchema {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
}

interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

interface DbConnection {
  id: string;
  name: string;
  type: "PostgreSQL" | "MySQL" | "SQLite" | "SQL Server" | "MongoDB" | "Redis";
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  status: "online" | "offline" | "warning";
  group: string;
}

interface OpenTab {
  connectionId: string;
  title: string;
}

type SchemaTree =
  | { kind: "connection"; id: string; label: string; type: string; status: string; children: SchemaTree[] }
  | { kind: "db"; id: string; label: string; children: SchemaTree[] }
  | { kind: "table"; id: string; label: string; columns: SchemaCol[] }
  | { kind: "column"; id: string; label: string; type: string; isPK?: boolean; isFK?: boolean };

interface SchemaCol {
  name: string;
  type: string;
  isPK?: boolean;
  isFK?: boolean;
}

// ─── Constants ───

const DB_TYPE_COLORS: Record<string, string> = {
  PostgreSQL: "#336791",
  MySQL: "#00758F",
  SQLite: "#044A64",
  "SQL Server": "#CC2927",
  MongoDB: "#47A248",
  Redis: "#DC382D",
};

const MOCK_CONNECTIONS: DbConnection[] = [
  { id: "c1", name: "App DB Primary", type: "PostgreSQL", host: "192.168.1.200", port: 5432, user: "app_user", password: "", database: "app_production", status: "online", group: "Production" },
  { id: "c2", name: "Analytics DB", type: "PostgreSQL", host: "192.168.1.201", port: 5432, user: "analytics", password: "", database: "analytics", status: "online", group: "Production" },
  { id: "c3", name: "Cache Cluster", type: "Redis", host: "192.168.1.210", port: 6379, user: "admin", password: "", database: "0", status: "online", group: "Production" },
  { id: "c4", name: "User Store", type: "MySQL", host: "10.0.1.50", port: 3306, user: "webapp", password: "", database: "users", status: "warning", group: "Staging" },
  { id: "c5", name: "Staging PG", type: "PostgreSQL", host: "10.0.1.51", port: 5432, user: "dev", password: "", database: "staging", status: "online", group: "Staging" },
  { id: "c6", name: "Mongo Replica", type: "MongoDB", host: "10.0.1.60", port: 27017, user: "admin", password: "", database: "main", status: "offline", group: "Staging" },
  { id: "c7", name: "Local SQLite", type: "SQLite", host: "localhost", port: 0, user: "", password: "", database: "dev.db", status: "online", group: "Development" },
  { id: "c8", name: "Dev MySQL", type: "MySQL", host: "172.16.0.10", port: 3306, user: "root", password: "", database: "dev", status: "online", group: "Development" },
  { id: "c9", name: "SQL Server Test", type: "SQL Server", host: "172.16.0.20", port: 1433, user: "sa", password: "", database: "testdb", status: "offline", group: "Development" },
];

const MOCK_TABLES: Record<string, TableSchema[]> = {
  app_production: [
    { name: "users", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "email", type: "varchar" }, { name: "name", type: "varchar" }, { name: "role", type: "enum" }, { name: "created_at", type: "timestamptz" }] },
    { name: "orders", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "user_id", type: "uuid", isFK: true }, { name: "total", type: "decimal" }, { name: "status", type: "enum" }, { name: "created_at", type: "timestamptz" }] },
    { name: "products", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "name", type: "varchar" }, { name: "price", type: "decimal" }, { name: "category", type: "varchar" }, { name: "stock", type: "integer" }, { name: "created_at", type: "timestamptz" }] },
    { name: "sessions", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "user_id", type: "uuid", isFK: true }, { name: "token", type: "varchar" }, { name: "expires_at", type: "timestamptz" }, { name: "created_at", type: "timestamptz" }] },
    { name: "audit_logs", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "user_id", type: "uuid", isFK: true }, { name: "action", type: "varchar" }, { name: "target", type: "varchar" }, { name: "details", type: "jsonb" }, { name: "created_at", type: "timestamptz" }] },
  ],
  analytics: [
    { name: "events", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "name", type: "varchar" }, { name: "properties", type: "jsonb" }, { name: "timestamp", type: "timestamptz" }] },
    { name: "page_views", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "url", type: "varchar" }, { name: "referrer", type: "varchar" }, { name: "user_agent", type: "text" }, { name: "ip", type: "varchar" }, { name: "timestamp", type: "timestamptz" }] },
  ],
  users: [
    { name: "users", columns: [{ name: "id", type: "int", isPK: true }, { name: "email", type: "varchar" }, { name: "name", type: "varchar" }, { name: "password_hash", type: "varchar" }, { name: "created_at", type: "timestamp" }] },
    { name: "roles", columns: [{ name: "id", type: "int", isPK: true }, { name: "name", type: "varchar" }] },
  ],
  dev: [
    { name: "users", columns: [{ name: "id", type: "int", isPK: true }, { name: "name", type: "varchar" }, { name: "email", type: "varchar" }] },
    { name: "posts", columns: [{ name: "id", type: "int", isPK: true }, { name: "title", type: "varchar" }, { name: "body", type: "text" }, { name: "user_id", type: "int", isFK: true }] },
  ],
  staging: [
    { name: "accounts", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "name", type: "varchar" }, { name: "plan", type: "varchar" }, { name: "created_at", type: "timestamptz" }] },
    { name: "billing", columns: [{ name: "id", type: "uuid", isPK: true }, { name: "account_id", type: "uuid", isFK: true }, { name: "amount", type: "decimal" }, { name: "due_date", type: "date" }] },
  ],
  testdb: [
    { name: "employees", columns: [{ name: "id", type: "int", isPK: true }, { name: "name", type: "varchar" }, { name: "department", type: "varchar" }, { name: "salary", type: "decimal" }] },
    { name: "departments", columns: [{ name: "id", type: "int", isPK: true }, { name: "name", type: "varchar" }, { name: "budget", type: "decimal" }] },
  ],
};

const GROUPS = ["Production", "Staging", "Development"];

const STATUS_COLORS = {
  online: "var(--success)",
  offline: "var(--muted)",
  warning: "var(--warn)",
};

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

// ─── Utils ───

function buildTree(connections: DbConnection[]): SchemaTree[] {
  return connections.map((c) => ({
    kind: "connection" as const,
    id: c.id,
    label: c.name,
    type: c.type,
    status: c.status,
    children: [
      {
        kind: "db" as const,
        id: `${c.id}:db`,
        label: c.database,
        children: (MOCK_TABLES[c.database] || []).map((t) => ({
          kind: "table" as const,
          id: `${c.id}:${t.name}`,
          label: t.name,
          columns: t.columns.map((col) => ({
            name: col.name,
            type: col.type,
            isPK: col.isPK,
            isFK: col.isFK,
          })),
        })),
      },
    ],
  }));
}

// ─── Connection Form Modal ───

const DB_TYPES = ["PostgreSQL", "MySQL", "SQLite", "SQL Server", "MongoDB", "Redis"] as const;

function ConnectionFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (conn: DbConnection) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("MySQL");
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState("3306");
  const [user, setUser] = useState("root");
  const [password, setPassword] = useState("");
  const [database, setDatabase] = useState("");
  const [group, setGroup] = useState("Development");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const portForType = (t: string) => {
    const m: Record<string, string> = { PostgreSQL: "5432", MySQL: "3306", SQLite: "", "SQL Server": "1433", MongoDB: "27017", Redis: "6379" };
    return m[t] || "3306";
  };

  const handleTypeChange = (t: string) => {
    setType(t);
    setPort(portForType(t));
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{ success: boolean; message: string }>("db_test_connection", {
        host,
        port: parseInt(port) || 0,
        user,
        password,
        database,
      });
      setTestResult({ ok: result.success, msg: result.message });
    } catch {
      setTestResult({ ok: false, msg: "Failed to reach backend" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!name.trim() || !host.trim()) return;
    onSave({
      id: `conn-${Date.now()}`,
      name: name.trim(),
      type: type as DbConnection["type"],
      host: host.trim(),
      port: parseInt(port) || 0,
      user,
      password,
      database: database.trim(),
      status: "offline",
      group,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 100,
        display: "grid",
        placeItems: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "var(--bg-deeper)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          width: 440,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, flex: 1, margin: 0 }}>New Connection</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ width: 24, height: 24, display: "grid", placeItems: "center" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <FormRow label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Database" />
          </FormRow>

          <FormRow label="Type">
            <select value={type} onChange={(e) => handleTypeChange(e.target.value)}>
              {DB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormRow>

          <FormRow label="Host">
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="localhost" />
          </FormRow>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FormRow label="Port">
              <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="3306" />
            </FormRow>
            <FormRow label="Database">
              <input value={database} onChange={(e) => setDatabase(e.target.value)} placeholder="mydb" />
            </FormRow>
          </div>

          <FormRow label="User">
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="root" />
          </FormRow>

          <FormRow label="Password">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </FormRow>

          <FormRow label="Group">
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormRow>
        </div>

        {testResult && (
          <div style={{ padding: "0 20px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: testResult.ok ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
              {testResult.ok ? "✓" : "✗"}
            </span>
            <span style={{ color: testResult.ok ? "var(--fg)" : "var(--danger)" }}>
              {testResult.msg}
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "12px 20px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost btn-sm" onClick={handleTest} disabled={testing}>
            {testing ? "Testing..." : "Test Connection"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={!name.trim() || !host.trim()}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "var(--meta)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ─── Schema Tree ───

function TreeNode({ node, depth, onSelect, onOpen }: { node: SchemaTree; depth: number; onSelect: (id: string) => void; onOpen: (connId: string) => void }) {
  const [expanded, setExpanded] = useState(depth < 2);

  const toggle = () => setExpanded((v) => !v);

  if (node.kind === "connection") {
    return (
      <div>
        <div
          onClick={() => { toggle(); onOpen(node.id); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 500, ...hoverBg }}
        >
          <Chevron expanded={expanded} />
          <DbTypeBadge type={node.type} />
          <span style={{ flex: 1 }}>{node.label}</span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[node.status as keyof typeof STATUS_COLORS] || "var(--muted)" }} />
        </div>
        {expanded && node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} onOpen={onOpen} />
        ))}
      </div>
    );
  }

  if (node.kind === "db") {
    const dbColor = DB_TYPE_COLORS["PostgreSQL"] || "var(--meta)";
    return (
      <div>
        <div onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 20px", borderRadius: 4, cursor: "pointer", fontSize: 11, color: "var(--meta)", ...hoverBg }}>
          <Chevron expanded={expanded} />
          <DatabaseIcon />
          <span>{node.label}</span>
        </div>
        {expanded && node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} onOpen={onOpen} />
        ))}
      </div>
    );
  }

  if (node.kind === "table") {
    return (
      <div>
        <div
          onClick={() => { toggle(); onSelect(node.id); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 8px 3px 36px", borderRadius: 4, cursor: "pointer", fontSize: 11, ...hoverBg }}
        >
          <Chevron expanded={expanded} />
          <TableIcon />
          <span>{node.label}</span>
        </div>
        {expanded && node.columns.map((col) => (
          <div key={col.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 8px 2px 52px", fontSize: 10, color: "var(--muted)" }}>
            <ColumnIcon isPK={col.isPK} />
            <span>{col.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 9, color: "var(--meta)", background: "var(--surface)", padding: "0 4px", borderRadius: 2 }}>{col.type}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10" style={{ flexShrink: 0, transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.12s" }}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12" style={{ flexShrink: 0 }}>
      <ellipse cx="12" cy="5" rx="7" ry="2" /><path d="M5 5v14c0 1.1 3.13 2 7 2s7-.9 7-2V5" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  );
}

function ColumnIcon({ isPK }: { isPK?: boolean }) {
  const color = isPK ? "var(--warn)" : undefined;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="1.5" width="10" height="10" style={{ flexShrink: 0 }}>
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" />
    </svg>
  );
}

const hoverBg = {
  ":hover": { background: "var(--surface)" },
};

// ─── Schema Tree Panel ───

function SchemaTreePanel({
  connections,
  onSelectConnection,
}: {
  connections: DbConnection[];
  onSelectConnection: (connId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [conns, setConns] = useState(connections);

  const tree = buildTree(conns);

  const handleSaveConnection = (conn: DbConnection) => {
    setConns((prev) => [...prev, conn]);
    setShowForm(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-3) var(--sp-4)", borderBottom: "1px solid var(--border)" }}>
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Explorer</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} title="Add connection">+</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "var(--sp-2) var(--sp-3)", borderBottom: "1px solid var(--border)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
        <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ border: "none", outline: "none", background: "transparent", color: "var(--fg)", fontSize: 12, width: "100%" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-2)" }}>
        {tree
          .filter((n) => !search || n.label.toLowerCase().includes(search.toLowerCase()))
          .map((node) => (
            <TreeNode key={node.id} node={node} depth={0} onSelect={onSelectConnection} onOpen={onSelectConnection} />
          ))}
      </div>
      {showForm && <ConnectionFormModal onClose={() => setShowForm(false)} onSave={handleSaveConnection} />}
    </>
  );
}

// ─── Database type badge ───

function DbTypeBadge({ type, size = 22 }: { type: string; size?: number }) {
  const color = DB_TYPE_COLORS[type] || "var(--meta)";
  const short = type === "Microsoft SQL Server" ? "MSSQL" : type.slice(0, 2).toUpperCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: 4, background: `${color}1a`, color, fontSize: size > 18 ? 9 : 8, fontWeight: 700, flexShrink: 0 }}>
      {short}
    </span>
  );
}

// ─── Tab Bar ───

function TabBar({ tabs, activeId, onSelect, onClose }: { tabs: OpenTab[]; activeId: string | null; onSelect: (id: string) => void; onClose: (id: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", background: "var(--bg-deeper)", flexShrink: 0, height: 34, overflowX: "auto", overflowY: "hidden" }}>
      {tabs.map((tab) => {
        const isActive = tab.connectionId === activeId;
        return (
          <div key={tab.connectionId} onClick={() => onSelect(tab.connectionId)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", height: "100%", fontSize: 12, color: isActive ? "var(--fg)" : "var(--muted)", borderRight: "1px solid var(--border)", borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent", background: isActive ? "var(--bg)" : "transparent", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.12s, border-color 0.12s, background 0.12s" }}>
            <span>{tab.title}</span>
            <span onClick={(e) => { e.stopPropagation(); onClose(tab.connectionId); }} style={{ width: 16, height: 16, display: "grid", placeItems: "center", borderRadius: 2, fontSize: 12, lineHeight: 1, color: "var(--muted)", opacity: 0, transition: "opacity 0.12s" }} className="tab-close-btn">×</span>
          </div>
        );
      })}
      <style>{`.tab-close-btn { opacity: 0; } div:hover > .tab-close-btn { opacity: 0.5; } .tab-close-btn:hover { opacity: 1 !important; }`}</style>
    </div>
  );
}

// ─── Connection Workspace ───

function ConnectionWorkspace({ connection }: { connection: DbConnection }) {
  const [sql, setSql] = useState(INITIAL_SQL);

  return (
    <DockLayout direction="vertical">
      <DockPanel defaultSize={130}>
        <div className="sql-toolbar">
          <button className="btn btn-primary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Run Query
          </button>
          <button className="btn btn-ghost btn-sm">Format</button>
          <button className="btn btn-ghost btn-sm">Explain</button>
          <select className="db-select" style={{ marginLeft: "auto" }}><option>{connection.database}</option></select>
        </div>
        <SqlEditor value={sql} onChange={setSql} />
      </DockPanel>
      <DockHandle direction="vertical" />
      <DockPanel>
        <div className="results-area">
          <div className="results-header">
            <h3>Results</h3>
            <span className="results-meta">50 rows · 23ms</span>
            <div className="results-tabs">
              <div className="results-tab active">Grid</div>
              <div className="results-tab">JSON</div>
              <div className="results-tab">Chart</div>
            </div>
          </div>
          <div className="results-grid">
            <table>
              <thead><tr><th>name</th><th>email</th><th>order_id</th><th>total</th><th>status</th><th>created_at</th></tr></thead>
              <tbody>
                <tr><td>Chen Wei</td><td>chen.wei@example.com</td><td className="text-muted">a1b2c3d4</td><td>¥ 2,480.00</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-26 08:42</td></tr>
                <tr><td>Li Xiaoming</td><td>lxm@example.com</td><td className="text-muted">e5f6g7h8</td><td>¥ 890.00</td><td><span className="badge badge-accent">processing</span></td><td className="text-muted">2026-05-26 07:15</td></tr>
                <tr><td>Wang Fang</td><td>wang.f@example.com</td><td className="text-muted">i9j0k1l2</td><td>¥ 3,120.50</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-25 22:30</td></tr>
                <tr><td>Zhang Lei</td><td>zhangl@example.com</td><td className="text-muted">m3n4o5p6</td><td>¥ 560.00</td><td><span className="badge badge-warn">pending</span></td><td className="text-muted">2026-05-25 19:08</td></tr>
                <tr><td>Liu Yan</td><td>liu.yan@example.com</td><td className="text-muted">q7r8s9t0</td><td>¥ 1,750.00</td><td><span className="badge badge-success">completed</span></td><td className="text-muted">2026-05-25 16:44</td></tr>
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
      </DockPanel>
    </DockLayout>
  );
}

// ─── Welcome View ───

function WelcomeView({ onConnect }: { onConnect: (id: string) => void }) {
  const recent = MOCK_CONNECTIONS.filter((c) => c.status === "online").slice(0, 4);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 32, overflow: "auto" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "grid", placeItems: "center", margin: "0 auto 16px", fontSize: 20, fontWeight: 700 }}>DB</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Database Explorer</h1>
        <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 400, lineHeight: 1.6 }}>
          Connect to your databases to browse schemas, run queries, and manage data across PostgreSQL, MySQL, SQLite, and more.
        </p>
      </div>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--meta)", marginBottom: 12 }}>Quick Connect</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {recent.map((conn) => (
            <div key={conn.id} onClick={() => onConnect(conn.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", cursor: "pointer", transition: "border-color 0.12s" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
              <DbTypeBadge type={conn.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{conn.name}</div>
                <div style={{ fontSize: 10, color: "var(--meta)" }}>{conn.host}:{conn.port}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" style={{ color: "var(--meta)", flexShrink: 0 }}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {Object.entries(DB_TYPE_COLORS).map(([name, color]) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: `${color}12`, borderRadius: 999, fontSize: 11, color, fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Panel ───

export function DatabasePanel() {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const leftPanelRef = useRef<PanelImperativeHandle>(null);

  const toggleLeftPanel = useCallback(() => {
    const panel = leftPanelRef.current;
    if (!panel) return;
    leftCollapsed ? panel.expand() : panel.collapse();
  }, [leftCollapsed]);

  const openConnection = useCallback((connId: string) => {
    setOpenTabs((prev) => {
      if (prev.find((t) => t.connectionId === connId)) return prev;
      const conn = MOCK_CONNECTIONS.find((c) => c.id === connId);
      if (!conn) return prev;
      return [...prev, { connectionId: connId, title: conn.name }];
    });
    setActiveTabId(connId);
  }, []);

  const closeTab = useCallback((connId: string) => {
    setOpenTabs((prev) => {
      const idx = prev.findIndex((t) => t.connectionId === connId);
      const next = prev.filter((t) => t.connectionId !== connId);
      setActiveTabId((active) => {
        if (active !== connId) return active;
        if (next.length === 0) return null;
        return next[Math.min(idx, next.length - 1)].connectionId;
      });
      return next;
    });
  }, []);

  const activeConnection = MOCK_CONNECTIONS.find((c) => c.id === activeTabId) || null;

  return (
    <DockLayout>
      <DockPanel panelRef={leftPanelRef} defaultSize={280} collapsible onResize={(size) => setLeftCollapsed(size.asPercentage === 0)}>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, position: "relative" }}>
          <SchemaTreePanel connections={MOCK_CONNECTIONS} onSelectConnection={openConnection} />
          {!leftCollapsed && (
            <button onClick={toggleLeftPanel} title="Hide connections" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 20, height: 32, display: "grid", placeItems: "center", borderTopLeftRadius: "var(--r-sm)", borderBottomLeftRadius: "var(--r-sm)", color: "var(--muted)", cursor: "pointer", zIndex: 1, border: "none", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          )}
        </div>
      </DockPanel>
      <DockHandle />
      <DockPanel>
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {leftCollapsed && (
            <button onClick={toggleLeftPanel} title="Show connections" style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 20, height: 32, display: "grid", placeItems: "center", borderTopRightRadius: "var(--r-sm)", borderBottomRightRadius: "var(--r-sm)", color: "var(--muted)", cursor: "pointer", zIndex: 1, border: "none", background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--fg)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          )}
          {activeConnection ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
              <TabBar tabs={openTabs} activeId={activeTabId} onSelect={setActiveTabId} onClose={closeTab} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                <ConnectionWorkspace connection={activeConnection} />
              </div>
            </div>
          ) : (
            <WelcomeView onConnect={openConnection} />
          )}
        </div>
      </DockPanel>
    </DockLayout>
  );
}
