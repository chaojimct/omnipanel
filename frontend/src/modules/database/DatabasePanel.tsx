import { useCallback, useMemo, useState } from "react";
import { DockWorkspace, DockLayout, DockPanel, DockHandle } from "../../components/dock";
import { SchemaBrowser } from "./SchemaBrowser";
import { ConnectionDialog } from "./ConnectionDialog";
import { useActionStore } from "../../stores/actionStore";
import { useDbGroupStore } from "../../stores/dbGroupStore";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";
import { quickInput } from "../../lib/quickInput";
import { SqlEditor } from "./SqlEditor";

const DEFAULT_SQL = `SELECT id, email, status, created_at
FROM users
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 50;`;

const DEMO_SCHEMA = [
  {
    name: "users",
    columns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "email", type: "varchar" },
      { name: "name", type: "varchar" },
      { name: "role", type: "enum" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "user_id", type: "uuid", isFk: true },
      { name: "total", type: "decimal" },
      { name: "status", type: "enum" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
  {
    name: "products",
    columns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "name", type: "varchar" },
      { name: "price", type: "decimal" },
      { name: "category", type: "varchar" },
    ],
  },
  {
    name: "sessions",
    columns: [
      { name: "id", type: "uuid", isPk: true },
      { name: "user_id", type: "uuid", isFk: true },
      { name: "token", type: "varchar" },
      { name: "expires_at", type: "timestamptz" },
    ],
  },
  {
    name: "audit_logs",
    columns: [
      { name: "id", type: "bigint", isPk: true },
      { name: "user_id", type: "uuid", isFk: true },
      { name: "action", type: "varchar" },
      { name: "table_name", type: "varchar" },
      { name: "record_id", type: "uuid" },
      { name: "created_at", type: "timestamptz" },
    ],
  },
];

const resultRows = [
  ["1001", "alice@example.com", "active", "2026-05-28 09:41"],
  ["1002", "bob@example.com", "active", "2026-05-28 09:38"],
  ["1003", "carol@example.com", "active", "2026-05-28 09:12"],
];

export function DatabasePanel() {
  const { t } = useI18n();
  const [sql, setSql] = useState(DEFAULT_SQL);
  const enqueueAction = useActionStore((s) => s.enqueueAction);
  const groups = useDbGroupStore((s) => s.groups);
  const activeGroupId = useDbGroupStore((s) => s.activeGroupId);
  const setActiveGroupId = useDbGroupStore((s) => s.setActiveGroupId);
  const addGroup = useDbGroupStore((s) => s.addGroup);
  const getGroupName = useDbGroupStore((s) => s.getGroupName);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [schemaRefreshToken, setSchemaRefreshToken] = useState(0);

  const handleCreateGroup = useCallback(async () => {
    const name = await quickInput({
      title: t("database.groups.createTitle"),
      subtitle: t("database.groups.nameLabel"),
      placeholder: t("database.groups.namePlaceholder"),
      validate: (value) => {
        if (!value.trim()) {
          return t("database.groups.nameRequired");
        }
        if (groups.some((group) => group.name === value.trim())) {
          return t("database.groups.duplicate");
        }
        return null;
      },
    });
    if (name) {
      addGroup(name);
    }
  }, [addGroup, groups, t]);

  const activeGroupName = useMemo(
    () => getGroupName(activeGroupId),
    [activeGroupId, getGroupName, groups]
  );

  const topbarTabs = useMemo(
    () =>
      groups.map((group) => ({
        id: group.id,
        label: group.name,
        active: group.id === activeGroupId,
      })),
    [groups, activeGroupId]
  );

  useTopbarTabs(
    topbarTabs,
    {
      onSelect: (id) => setActiveGroupId(id),
      onAdd: () => void handleCreateGroup(),
    },
    { mode: "connection", showAddTab: true, addTabTitle: t("database.groups.new") }
  );

  const runQuery = () => {
    enqueueAction({
      type: "sql",
      title: t("database.actions.runQuery"),
      description: t("database.actions.runQueryDesc"),
      command: sql,
      resourceId: activeGroupId,
      source: "用户",
    });
  };

  return (
    <>
    <DockWorkspace
      leftPreset="schema"
      left={
        <SchemaBrowser
          onCreateConnection={() => setDialogOpen(true)}
          refreshToken={schemaRefreshToken}
          groupFilter={activeGroupName}
        />
      }
      main={
        <DockLayout direction="vertical">
          <DockPanel defaultSize={55} minSize={30}>
            <div className="db-editor-area">
              <div className="sql-toolbar">
                <select className="db-select" defaultValue="app_production">
                  <option value="app_production">app_production</option>
                  <option value="analytics">analytics</option>
                </select>
                <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={runQuery}>
                  {t("database.runSql")}
                </button>
              </div>
              <SqlEditor value={sql} onChange={setSql} onRun={runQuery} schema={DEMO_SCHEMA} />
            </div>
          </DockPanel>
          <DockHandle direction="vertical" />
          <DockPanel defaultSize={45} minSize={20}>
            <div className="results-area">
              <div className="results-header">
                <h3>{t("database.results.preview")}</h3>
                <span className="results-meta">
                  {t("database.results.meta", {
                    rows: resultRows.length,
                    ms: 18,
                    mode: t("common.readonly"),
                  })}
                </span>
              </div>
              <div className="results-grid">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row) => (
                      <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="exec-stats">
                <span className="stat">
                  {t("database.results.title")}: <span className="stat-val">{resultRows.length}</span>
                </span>
                <span className="stat">
                  Latency: <span className="stat-val">18ms</span>
                </span>
              </div>
            </div>
          </DockPanel>
        </DockLayout>
      }
    />
    <ConnectionDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onSaved={() => setSchemaRefreshToken((token) => token + 1)}
      defaultGroup={activeGroupName}
      groups={groups}
    />
    </>
  );
}
