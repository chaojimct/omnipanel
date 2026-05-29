import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { DockWorkspace, DockLayout, DockPanel, DockHandle } from "../../components/dock";
import { SchemaBrowser } from "./SchemaBrowser";
import { ConnectionDialog } from "./ConnectionDialog";
import { useActionStore } from "../../stores/actionStore";
import { useDbGroupStore } from "../../stores/dbGroupStore";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";
import { quickInput } from "../../lib/quickInput";
import { SqlEditor } from "./SqlEditor";
import {
  connectionMatchesGroup,
  listConnections,
  type DbConnectionConfig,
} from "./api";

const DEFAULT_SQL = `SELECT 1;`;

/** db_execute_query 的返回结构（serde camelCase）。 */
interface QueryResult {
  columns: string[];
  rows: unknown[][];
  rowsAffected: number;
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

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

  const [connections, setConnections] = useState<DbConnectionConfig[]>([]);
  const [activeConnId, setActiveConnId] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const activeGroupName = useMemo(
    () => getGroupName(activeGroupId),
    [activeGroupId, getGroupName, groups]
  );

  const groupConnections = useMemo(
    () => connections.filter((conn) => connectionMatchesGroup(conn, activeGroupName)),
    [connections, activeGroupName]
  );

  const activeConn = useMemo(
    () => groupConnections.find((c) => c.id === activeConnId) ?? groupConnections[0] ?? null,
    [groupConnections, activeConnId]
  );

  const refreshConnections = useCallback(async () => {
    try {
      const list = await listConnections();
      setConnections(list);
      setActiveConnId((prev) => {
        if (prev && list.some((item) => item.id === prev)) {
          return prev;
        }
        const inGroup = list.find((item) => connectionMatchesGroup(item, activeGroupName));
        return inGroup?.id ?? list[0]?.id ?? null;
      });
    } catch {
      // 非 Tauri 环境（纯前端 dev）忽略。
    }
  }, [activeGroupName]);

  useEffect(() => {
    void refreshConnections();
  }, [refreshConnections, schemaRefreshToken]);

  useEffect(() => {
    setActiveConnId((prev) => {
      if (prev && groupConnections.some((item) => item.id === prev)) {
        return prev;
      }
      return groupConnections[0]?.id ?? null;
    });
  }, [activeGroupId, groupConnections]);

  const schema = useMemo(() => {
    if (!activeConn?.database.trim()) {
      return [];
    }
    return [{ name: activeConn.database, columns: [] }];
  }, [activeConn]);

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

  const runQuery = useCallback(async () => {
    if (!activeConn) {
      setError(t("database.results.noConnection"));
      return;
    }
    setRunning(true);
    setError(null);
    enqueueAction({
      type: "sql",
      title: t("database.actions.runQuery"),
      description: `${activeConn.name} · ${t("database.actions.runQueryDesc")}`,
      command: sql,
      resourceId: activeConn.id,
      source: "用户",
    });
    const started = performance.now();
    try {
      const res = await invoke<QueryResult>("db_execute_query", { connection: activeConn, sql });
      setResult(res);
      setElapsed(Math.round(performance.now() - started));
    } catch (e) {
      setResult(null);
      setError(typeof e === "string" ? e : JSON.stringify(e));
    } finally {
      setRunning(false);
    }
  }, [activeConn, enqueueAction, sql, t]);

  const rowCount = result?.rows.length ?? 0;

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
                  <select
                    className="db-select"
                    value={activeConn?.id ?? ""}
                    onChange={(event) => setActiveConnId(event.target.value || null)}
                    disabled={groupConnections.length === 0}
                  >
                    {groupConnections.length === 0 ? (
                      <option value="">{t("database.results.noConnection")}</option>
                    ) : (
                      groupConnections.map((conn) => (
                        <option key={conn.id} value={conn.id}>
                          {conn.name} · {conn.database || conn.db_type}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginLeft: "auto" }}
                    onClick={runQuery}
                    disabled={running || !activeConn}
                  >
                    {running ? t("database.running") : t("database.runSql")}
                  </button>
                </div>
                <SqlEditor value={sql} onChange={setSql} onRun={runQuery} schema={schema} />
              </div>
            </DockPanel>
            <DockHandle direction="vertical" />
            <DockPanel defaultSize={45} minSize={20}>
              <div className="results-area">
                <div className="results-header">
                  <h3>{t("database.results.preview")}</h3>
                  <span className="results-meta">
                    {t("database.results.meta", {
                      rows: rowCount,
                      ms: elapsed ?? 0,
                      mode: t("common.readonly"),
                    })}
                  </span>
                </div>
                {error ? (
                  <div
                    className="empty-state compact text-danger"
                    style={{ padding: "var(--sp-4)", whiteSpace: "pre-wrap" }}
                  >
                    {error}
                  </div>
                ) : result === null ? (
                  <div className="empty-state compact" style={{ padding: "var(--sp-4)" }}>
                    {t("database.results.runHint")}
                  </div>
                ) : result.columns.length === 0 ? (
                  <div className="empty-state compact" style={{ padding: "var(--sp-4)" }}>
                    {t("database.results.affected", { rows: result.rowsAffected })}
                  </div>
                ) : (
                  <div className="results-grid">
                    <table>
                      <thead>
                        <tr>
                          {result.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{cellToText(cell)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="exec-stats">
                  <span className="stat">
                    {t("database.results.title")}: <span className="stat-val">{rowCount}</span>
                  </span>
                  <span className="stat">
                    Latency: <span className="stat-val">{elapsed ?? 0}ms</span>
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
