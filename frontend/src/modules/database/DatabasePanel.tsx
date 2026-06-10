import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";
import { SchemaBrowser, type SchemaTableSelection } from "./SchemaBrowser";
import { ConnectionDialog } from "./ConnectionDialog";
import { ContextMenu } from "../../components/ui/ContextMenu";
import { buildTabCloseMenuItems, type TabContextMenuAction } from "../../components/ui/contextMenuItems";
import { useActionStore } from "../../stores/actionStore";
import { useDbGroupStore } from "../../stores/dbGroupStore";
import { useDbSchemaFilterStore } from "../../stores/dbSchemaFilterStore";
import { getVisibleNames, mergeFilter } from "./DatabaseFilterDialog";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";
import { quickInput } from "../../lib/quickInput";
import { isSqlMonacoEditorFocused, sqlAtOffset } from "./lsp/sqlStatement";
import {
  connectionMatchesGroup,
  countTable,
  introspectSchema,
  introspectTable,
  listConnections,
  listDatabases,
  previewTable,
  type DbColumnMeta,
  type DbConnectionConfig,
} from "./api";
import { buildDatabaseSchema, introspectToTableSchemas } from "./lsp/sqlCompletion";
import type { DatabaseSchema } from "./types";
import {
  makeSqlTabId,
  makeSqlTabLabel,
  makeTableTabLabel,
  type SqlWorkspaceTab,
} from "./workspaceTabs";
import { CellEditorDialog } from "./cell_editor";
import { SubWindow } from "../../components/ui/SubWindow";
import { useDbToolboxStore } from "../../stores/dbToolboxStore";
import { DatabaseToolbox } from "./toolbox/DatabaseToolbox";
import {
  createDefaultSqlTabState,
  createDefaultTablePreviewState,
  rowsToRecord,
  tabModeToEditorOpenMode,
  type SqlTabState,
  type TablePreviewState,
  type QueryResult,
} from "./dbWorkspaceState";
import { DbPanelSurface } from "./DbPanelSurface";
import { DockableWorkspace } from "../../components/dock";
import { DbWorkspaceProvider, type DbWorkspaceContextValue } from "../../contexts/DbWorkspaceContext";
import { useDbDockLayoutStore } from "../../stores/dbDockLayoutStore";

const INITIAL_SQL_TAB_ID = makeSqlTabId();
const INITIAL_SQL_TAB: SqlWorkspaceTab = {
  id: INITIAL_SQL_TAB_ID,
  kind: "sql",
  label: makeSqlTabLabel(1),
};

export function DatabasePanel() {
  const { t } = useI18n();
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
  const [sqlTabStates, setSqlTabStates] = useState<Record<string, SqlTabState>>(() => ({
    [INITIAL_SQL_TAB_ID]: createDefaultSqlTabState(),
  }));

  const [workspaceTabs, setWorkspaceTabs] = useState<SqlWorkspaceTab[]>([INITIAL_SQL_TAB]);
  const [activeWorkspaceTabId, setActiveWorkspaceTabId] = useState(INITIAL_SQL_TAB_ID);
  const [tablePreviews, setTablePreviews] = useState<Record<string, TablePreviewState>>({});
  const [activeTableKey, setActiveTableKey] = useState<string | null>(null);
  const [tableColumnMeta, setTableColumnMeta] = useState<Record<string, DbColumnMeta[]>>({});
  const [tabModes, setTabModes] = useState<Record<string, "data" | "sql">>({});
  const [databasesByConnId, setDatabasesByConnId] = useState<Record<string, string[]>>({});
  const [schemaByKey, setSchemaByKey] = useState<Record<string, DatabaseSchema>>({});
  const [schemaLoadingKey, setSchemaLoadingKey] = useState<string | null>(null);
  const [cellEdit, setCellEdit] = useState<{
    tabId: string;
    column: string;
    row: Record<string, unknown>;
  } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; tabId: string; index: number } | null>(null);
  const toolboxOpen = useDbToolboxStore((s) => s.open);
  const setToolboxOpen = useDbToolboxStore((s) => s.setOpen);
  const dockLayout = useDbDockLayoutStore((s) => s.savedLayout);
  const setDockLayout = useDbDockLayoutStore((s) => s.setSavedLayout);

  const activeGroupName = useMemo(
    () => getGroupName(activeGroupId),
    [activeGroupId, getGroupName, groups],
  );

  const groupConnections = useMemo(
    () => connections.filter((conn) => connectionMatchesGroup(conn, activeGroupName)),
    [connections, activeGroupName],
  );

  const activeConn = useMemo(
    () => groupConnections.find((c) => c.id === activeConnId) ?? groupConnections[0] ?? null,
    [groupConnections, activeConnId],
  );

  const activeWorkspaceTab = useMemo(
    () => workspaceTabs.find((tab) => tab.id === activeWorkspaceTabId) ?? null,
    [workspaceTabs, activeWorkspaceTabId],
  );

  const updateSqlTabState = useCallback((tabId: string, patch: Partial<SqlTabState>) => {
    setSqlTabStates((prev) => ({
      ...prev,
      [tabId]: { ...(prev[tabId] ?? createDefaultSqlTabState()), ...patch },
    }));
  }, []);

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

  const activeSqlTabId =
    activeWorkspaceTab?.kind === "sql" ? activeWorkspaceTab.id : null;
  const activeSqlTabState = activeSqlTabId
    ? (sqlTabStates[activeSqlTabId] ?? createDefaultSqlTabState())
    : null;
  const activeSqlDatabase = activeSqlTabState?.database ?? "";

  const connectionForSql = useMemo(() => {
    if (!activeConn) {
      return null;
    }
    if (!activeSqlDatabase.trim()) {
      return activeConn;
    }
    return { ...activeConn, database: activeSqlDatabase };
  }, [activeConn, activeSqlDatabase]);

  const databaseFilters = useDbSchemaFilterStore((s) => s.databaseFilters);
  const hydrateSchemaFilters = useDbSchemaFilterStore((s) => s.hydrate);
  const setDatabaseFilters = useDbSchemaFilterStore((s) => s.setDatabaseFilters);
  const filtersHydrated = useDbSchemaFilterStore((s) => s.hydrated);

  const allDatabasesForActiveConn = activeConn
    ? (databasesByConnId[activeConn.id] ?? [])
    : [];

  const databasesForActiveConn = useMemo(() => {
    if (!activeConn) {
      return [];
    }
    return getVisibleNames(allDatabasesForActiveConn, databaseFilters[activeConn.id]);
  }, [activeConn, allDatabasesForActiveConn, databaseFilters]);

  useEffect(() => {
    if (!filtersHydrated) {
      void hydrateSchemaFilters();
    }
  }, [filtersHydrated, hydrateSchemaFilters, schemaRefreshToken]);

  const sqlCompletionSchemas = useMemo((): DatabaseSchema[] => {
    if (!activeConn || !activeSqlDatabase.trim()) {
      return [];
    }
    const key = `${activeConn.id}:${activeSqlDatabase}`;
    const cached = schemaByKey[key];
    if (cached) {
      return [cached];
    }
    return [buildDatabaseSchema(activeSqlDatabase, [])];
  }, [activeConn, activeSqlDatabase, schemaByKey]);

  useEffect(() => {
    if (!activeConn) {
      return;
    }
    if (databasesByConnId[activeConn.id]) {
      return;
    }
    let cancelled = false;
    void listDatabases(activeConn)
      .then((names) => {
        if (!cancelled) {
          setDatabasesByConnId((prev) => ({ ...prev, [activeConn.id]: names }));
          setDatabaseFilters((prev) => ({
            ...prev,
            [activeConn.id]: mergeFilter(prev[activeConn.id], names),
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fallback = activeConn.database.trim() ? [activeConn.database] : [];
          setDatabasesByConnId((prev) => ({ ...prev, [activeConn.id]: fallback }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeConn, databasesByConnId]);

  useEffect(() => {
    if (!activeSqlTabId || !activeConn || databasesForActiveConn.length === 0) {
      return;
    }
    const tabState = sqlTabStates[activeSqlTabId];
    const current = tabState?.database.trim() ?? "";
    const preset = activeConn.database.trim();
    const pick =
      current && databasesForActiveConn.includes(current)
        ? current
        : preset && databasesForActiveConn.includes(preset)
          ? preset
          : databasesForActiveConn[0];
    if (pick && pick !== current) {
      updateSqlTabState(activeSqlTabId, { database: pick });
    }
  }, [
    activeSqlTabId,
    activeConn,
    databasesForActiveConn,
    sqlTabStates,
    updateSqlTabState,
  ]);

  useEffect(() => {
    if (!activeConn || !activeSqlDatabase.trim()) {
      return;
    }
    const key = `${activeConn.id}:${activeSqlDatabase}`;
    if (schemaByKey[key]) {
      return;
    }
    let cancelled = false;
    setSchemaLoadingKey(key);
    void introspectSchema(activeConn, activeSqlDatabase)
      .then((result) => {
        if (cancelled) {
          return;
        }
        const tables = introspectToTableSchemas(result.tables);
        setSchemaByKey((prev) => ({
          ...prev,
          [key]: buildDatabaseSchema(result.database, tables),
        }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setSchemaLoadingKey((current) => (current === key ? null : current));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeConn, activeSqlDatabase, schemaByKey]);

  const loadTablePreview = useCallback(
    async (tabId: string, connection: DbConnectionConfig, dbName: string, tableName: string) => {
      const connForSchema = { ...connection, database: dbName };
      const defaultState = createDefaultTablePreviewState();
      const prev = defaultState;

      // 1) 查询总数
      setTablePreviews((prevMap) => ({
        ...prevMap,
        [tabId]: { ...(prevMap[tabId] ?? defaultState), loading: true, error: null },
      }));
      let totalRows = 0;
      try {
        totalRows = await countTable(connForSchema, tableName, dbName);
      } catch (e) {
        setTablePreviews((prevMap) => ({
          ...prevMap,
          [tabId]: {
            ...(prevMap[tabId] ?? defaultState),
            loading: false,
            error: typeof e === "string" ? e : String(e),
          },
        }));
        return;
      }

      // 2) 查询当前页数据
      const pageSize = prev.pageSize;
      try {
        const data = await previewTable(connForSchema, tableName, pageSize, 0);
        setTablePreviews((prevMap) => ({
          ...prevMap,
          [tabId]: { ...(prevMap[tabId] ?? defaultState), loading: false, error: null, data, totalRows, page: 0, pageSize },
        }));
      } catch (e) {
        setTablePreviews((prevMap) => ({
          ...prevMap,
          [tabId]: {
            ...(prevMap[tabId] ?? defaultState),
            loading: false,
            error: typeof e === "string" ? e : String(e),
          },
        }));
      }
    },
    [],
  );

  const refreshTablePreview = useCallback(
    (tabId: string, connId: string, dbName: string, tableName: string) => {
      const connection = connections.find((c) => c.id === connId);
      if (!connection) return;
      const connForSchema = { ...connection, database: dbName };

      setTablePreviews((prev) => {
        const existing = prev[tabId] ?? createDefaultTablePreviewState();
        const pageSize = existing.pageSize;
        const page = existing.page;

        Promise.all([
          countTable(connForSchema, tableName, dbName),
          previewTable(connForSchema, tableName, pageSize, page * pageSize),
        ])
          .then(([totalRows, data]) => {
            setTablePreviews((p) => {
              const cur = p[tabId];
              if (!cur) return p;
              return { ...p, [tabId]: { ...cur, loading: false, error: null, data, totalRows } };
            });
          })
          .catch((e) => {
            setTablePreviews((p) => {
              const cur = p[tabId];
              if (!cur) return p;
              return { ...p, [tabId]: { ...cur, loading: false, error: typeof e === "string" ? e : String(e) } };
            });
          });

        return { ...prev, [tabId]: { ...existing, loading: true } };
      });
    },
    [connections],
  );

  const goToPage = useCallback(
    (tabId: string, connId: string, dbName: string, tableName: string, page: number) => {
      const connection = connections.find((c) => c.id === connId);
      if (!connection) return;
      const connForSchema = { ...connection, database: dbName };
      setTablePreviews((prev) => {
        const existing = prev[tabId] ?? createDefaultTablePreviewState();
        const pageSize = existing.pageSize;

        previewTable(connForSchema, tableName, pageSize, page * pageSize)
          .then((data) => {
            setTablePreviews((p) => {
              const cur = p[tabId];
              if (!cur) return p;
              return { ...p, [tabId]: { ...cur, loading: false, data, page } };
            });
          })
          .catch((e) => {
            setTablePreviews((p) => {
              const cur = p[tabId];
              if (!cur) return p;
              return { ...p, [tabId]: { ...cur, loading: false, error: typeof e === "string" ? e : String(e) } };
            });
          });

        return { ...prev, [tabId]: { ...existing, loading: true } };
      });
    },
    [connections],
  );

  const handleCellEdit = useCallback(
    (tabId: string, cellInfo: { rowIndex: number; column: string; row: Record<string, unknown> }) => {
      setCellEdit({ tabId, column: cellInfo.column, row: cellInfo.row });
    },
    [],
  );

  const handleCellSave = useCallback(
    async (value: unknown) => {
      if (!cellEdit) return;
      const { tabId, column, row } = cellEdit;
      const preview = tablePreviews[tabId];
      if (!preview || !preview.connId || !preview.dbName || !preview.tableName) {
        setCellEdit(null);
        return;
      }
      const connection = connections.find((c) => c.id === preview.connId);
      if (!connection) {
        setCellEdit(null);
        return;
      }
      const colMeta = tableColumnMeta[tabId];
      if (!colMeta) {
        setCellEdit(null);
        return;
      }
      // Build PK WHERE clause
      const pkCols = colMeta.filter((c) => c.isPk);
      if (pkCols.length === 0) {
        setCellEdit(null);
        return;
      }
      const pkConditions = pkCols
        .map((pk) => {
          const val = row[pk.name];
          if (val === null || val === undefined) return `${pk.name} IS NULL`;
          if (typeof val === "number") return `${pk.name} = ${val}`;
          return `${pk.name} = '${String(val).replace(/'/g, "\\'")}'`;
        })
        .join(" AND ");

      const connForSchema = { ...connection, database: preview.dbName };
      const escapedValue =
        typeof value === "number"
          ? String(value)
          : value === null
            ? "NULL"
            : `'${String(value).replace(/'/g, "\\'")}'`;

      const sql = `UPDATE \`${preview.tableName}\` SET \`${column}\` = ${escapedValue} WHERE ${pkConditions} LIMIT 1`;

      try {
        await invoke("db_execute_query", { connection: connForSchema, sql });
        setCellEdit(null);
        // Refresh preview
        refreshTablePreview(tabId, preview.connId, preview.dbName, preview.tableName);
      } catch (e) {
        console.error("Cell update failed:", e);
        setCellEdit(null);
      }
    },
    [cellEdit, tablePreviews, connections, tableColumnMeta, refreshTablePreview],
  );

  const handleSelectTable = useCallback(
    (selection: SchemaTableSelection) => {
      const tableKey = `tbl:${selection.connId}:${selection.dbName}:${selection.tableName}`;
      const tabId = makeSqlTabId();
      setActiveTableKey(tableKey);
      setActiveConnId(selection.connId);

      // Create a SQL tab with collapsed editor for table preview
      setWorkspaceTabs((prev) => {
        const tab: SqlWorkspaceTab = {
          id: tabId,
          kind: "sql",
          label: makeTableTabLabel(selection.dbName, selection.tableName),
        };
        return [...prev, tab];
      });
      setActiveWorkspaceTabId(tabId);
      setTabModes((prev) => ({ ...prev, [tabId]: "data" }));

      // Set the database for the SQL tab
      setSqlTabStates((prev) => ({
        ...prev,
        [tabId]: { ...createDefaultSqlTabState(selection.dbName), sql: `SELECT * FROM \`${selection.tableName}\` LIMIT 100;` },
      }));

      // Initialize preview metadata (before loadTablePreview's async updates)
      setTablePreviews((prev) => ({
        ...prev,
        [tabId]: { ...createDefaultTablePreviewState(), loading: true, connId: selection.connId, dbName: selection.dbName, tableName: selection.tableName },
      }));

      void loadTablePreview(
        tabId,
        selection.connection,
        selection.dbName,
        selection.tableName,
      );
      // Fetch column metadata for cell editing
      void introspectTable(selection.connection, selection.dbName, selection.tableName)
        .then((schema) => {
          setTableColumnMeta((prev) => ({ ...prev, [tabId]: schema.columns }));
        })
        .catch(() => {});
    },
    [loadTablePreview],
  );

  const openNewSqlTab = useCallback(() => {
    const tabId = makeSqlTabId();
    const sqlTabCount = workspaceTabs.length + 1;
    const tab: SqlWorkspaceTab = {
      id: tabId,
      kind: "sql",
      label: makeSqlTabLabel(sqlTabCount),
    };
    const presetDb = activeConn?.database.trim() ?? "";
    setSqlTabStates((prev) => ({
      ...prev,
      [tabId]: createDefaultSqlTabState(presetDb),
    }));
    setWorkspaceTabs((prev) => [...prev, tab]);
    setActiveWorkspaceTabId(tabId);
    setTabModes((prev) => ({ ...prev, [tabId]: "sql" }));
  }, [activeConn?.database, workspaceTabs]);

  const closeWorkspaceTab = useCallback((tabId: string) => {
    setWorkspaceTabs((prev) => {
      const idx = prev.findIndex((tab) => tab.id === tabId);
      const next = prev.filter((tab) => tab.id !== tabId);
      setActiveWorkspaceTabId((current) => {
        if (current !== tabId) {
          return current;
        }
        const fallback = next[Math.min(idx, Math.max(0, next.length - 1))];
        return fallback?.id ?? "";
      });
      return next;
    });
    setSqlTabStates((prev) => {
      if (!(tabId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTablePreviews((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTableColumnMeta((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
    setTabModes((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  }, []);

  const renameWorkspaceTab = useCallback((tabId: string, label: string) => {
    const nextLabel = label.trim();
    if (!nextLabel) return;
    setWorkspaceTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, label: nextLabel } : tab)),
    );
  }, []);

  const handleRenameTab = useCallback(
    async (tabId: string) => {
      const tab = workspaceTabs.find((item) => item.id === tabId);
      if (!tab) return;

      const name = await quickInput({
        title: t("database.workspace.renameTabTitle"),
        subtitle: t("shell.topbar.rename"),
        placeholder: t("database.workspace.renameTabPlaceholder"),
        defaultValue: tab.label,
        validate: (value) => {
          if (!value.trim()) {
            return t("database.workspace.renameTabRequired");
          }
          return null;
        },
      });

      if (name) {
        renameWorkspaceTab(tabId, name);
      }
    },
    [workspaceTabs, t, renameWorkspaceTab],
  );

  const handleContextAction = useCallback(
    (action: TabContextMenuAction) => {
      if (!ctxMenu) return;
      const idx = ctxMenu.index;
      const tabList = workspaceTabs;
      const { tabId } = ctxMenu;

      if (action === "rename") {
        setCtxMenu(null);
        void handleRenameTab(tabId);
        return;
      }

      if (action === "close") {
        closeWorkspaceTab(tabId);
      } else if (action === "closeLeft") {
        for (let i = idx - 1; i >= 0; i--) closeWorkspaceTab(tabList[i].id);
      } else if (action === "closeRight") {
        for (let i = tabList.length - 1; i > idx; i--) closeWorkspaceTab(tabList[i].id);
      } else if (action === "closeOthers") {
        for (let i = tabList.length - 1; i >= 0; i--) {
          if (i !== idx) closeWorkspaceTab(tabList[i].id);
        }
      } else if (action === "closeAll") {
        for (let i = tabList.length - 1; i >= 0; i--) closeWorkspaceTab(tabList[i].id);
      }
      setCtxMenu(null);
    },
    [ctxMenu, workspaceTabs, closeWorkspaceTab, handleRenameTab],
  );


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
    [groups, activeGroupId],
  );

  useTopbarTabs(
    topbarTabs,
    {
      onSelect: (id) => setActiveGroupId(id),
      onAdd: () => void handleCreateGroup(),
    },
    { mode: "connection", showAddTab: true, addTabTitle: t("database.groups.new") },
  );

  const runQuery = useCallback(async (sqlOverride?: string, tabIdOverride?: string) => {
    const tabId = tabIdOverride ?? activeWorkspaceTab?.id;
    const tab = tabId ? workspaceTabs.find((t) => t.id === tabId) : null;
    if (!tab || tab.kind !== "sql") {
      return;
    }
    const resolvedTabId = tab.id;
    const tabState = sqlTabStates[resolvedTabId] ?? createDefaultSqlTabState();
    const conn = connectionForSql;
    const sql = (sqlOverride ?? tabState.sql).trim();
    if (!conn) {
      updateSqlTabState(resolvedTabId, { error: t("database.results.noConnection") });
      return;
    }
    if (!tabState.database.trim()) {
      updateSqlTabState(resolvedTabId, { error: t("database.workspace.selectDatabase") });
      return;
    }
    if (!sql) {
      updateSqlTabState(resolvedTabId, { error: t("database.results.emptySql") });
      return;
    }
    updateSqlTabState(resolvedTabId, { running: true, error: null });
    enqueueAction({
      type: "sql",
      title: t("database.actions.runQuery"),
      description: `${conn.name} · ${t("database.actions.runQueryDesc")}`,
      command: sql,
      resourceId: conn.id,
      source: "用户",
    });
    const started = performance.now();
    try {
      const res = await invoke<QueryResult>("db_execute_query", {
        connection: conn,
        sql,
      });
      updateSqlTabState(resolvedTabId, {
        result: res,
        elapsed: Math.round(performance.now() - started),
        running: false,
      });
    } catch (e) {
      updateSqlTabState(resolvedTabId, {
        result: null,
        error: typeof e === "string" ? e : JSON.stringify(e),
        running: false,
      });
    }
  }, [
    connectionForSql,
    activeWorkspaceTab,
    workspaceTabs,
    enqueueAction,
    sqlTabStates,
    t,
    updateSqlTabState,
  ]);

  // 表预览（data）模式：编辑器常折叠且无焦点，在此统一处理 ⌘/Ctrl+Enter。
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter" || e.shiftKey || e.altKey) {
        return;
      }
      if (isSqlMonacoEditorFocused()) return;

      const tabId = activeWorkspaceTabId;
      if (!tabId) return;
      const tabState = sqlTabStates[tabId];
      if (!tabState) return;

      const statement = sqlAtOffset(tabState.sql, tabState.cursorOffset);
      if (!statement) return;

      e.preventDefault();
      e.stopPropagation();
      void runQuery(statement, tabId);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [activeWorkspaceTabId, sqlTabStates, runQuery]);

  const ctxValue = useMemo<DbWorkspaceContextValue>(() => ({
    tabs: workspaceTabs,
    activeTabId: activeWorkspaceTabId,
    setActiveTabId: setActiveWorkspaceTabId,
    closeTab: closeWorkspaceTab,
    runQuery,
    updateSqlTabState,
    refreshTablePreview,
    goToPage,
    handleCellEdit,
    sqlTabStates,
    tablePreviews,
    tableColumnMeta,
    tabModes,
    setTabMode: (id, mode) => setTabModes((prev) => ({ ...prev, [id]: mode })),
    activeConn,
    groupConnections,
    databasesByConnId,
    schemaByKey,
    schemaLoadingKey,
    setActiveConnId,
    sqlCompletionSchemas,
    connectionForSql,
    rowsToRecord,
    tabModeToEditorOpenMode,
  }), [
    workspaceTabs, activeWorkspaceTabId, setActiveWorkspaceTabId, closeWorkspaceTab,
    runQuery, updateSqlTabState, refreshTablePreview, goToPage, handleCellEdit,
    sqlTabStates, tablePreviews, tableColumnMeta, tabModes,
    activeConn, groupConnections, databasesByConnId, schemaByKey, schemaLoadingKey,
    setActiveConnId, sqlCompletionSchemas, connectionForSql,
  ]);

  return (
    <DbWorkspaceProvider value={ctxValue}>
      <SidebarWorkspace
        preset="schema"
        sidebarMinPx={280}
        sidebar={
          <SchemaBrowser
            onCreateConnection={() => setDialogOpen(true)}
            onNewQuery={openNewSqlTab}
            onSelectTable={handleSelectTable}
            activeTableKey={activeTableKey}
            refreshToken={schemaRefreshToken}
            groupFilter={activeGroupName}
          />
        }
      >
        <DockableWorkspace
          className="db-workspace"
          tabs={workspaceTabs.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeTabId={activeWorkspaceTabId}
          onActiveTabChange={setActiveWorkspaceTabId}
          onCloseTab={closeWorkspaceTab}
          savedLayout={dockLayout}
          onSavedLayoutChange={setDockLayout}
          emptyContent={t("database.workspace.emptyTabs")}
          renderPanel={(tabId) => {
            const tab = workspaceTabs.find((item) => item.id === tabId);
            if (!tab) return null;
            return (
              <div className="db-workspace-pane db-dock-pane">
                <DbPanelSurface tab={tab} />
              </div>
            );
          }}
          onTabContextMenu={(_event, tabId, index) => {
            setCtxMenu({ x: _event.clientX, y: _event.clientY, tabId, index });
          }}
        />
      </SidebarWorkspace>
      {ctxMenu && (
        <ContextMenu
          items={buildTabCloseMenuItems(
            t,
            workspaceTabs.length,
            ctxMenu.index,
            handleContextAction,
            { showRename: true },
          )}
          position={{ x: ctxMenu.x, y: ctxMenu.y }}
          onClose={() => setCtxMenu(null)}
        />
      )}
      <SubWindow
        open={toolboxOpen}
        title={t("database.toolbox.open")}
        onClose={() => setToolboxOpen(false)}
      >
        <DatabaseToolbox
          connections={groupConnections}
          initialSourceConnectionId={activeConn?.id}
          initialSourceDatabase={activeSqlDatabase}
        />
      </SubWindow>
      <ConnectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => setSchemaRefreshToken((token) => token + 1)}
        defaultGroup={activeGroupName}
        groups={groups}
      />
      {cellEdit && (() => {
        const colMeta = tableColumnMeta[cellEdit.tabId]?.find((c) => c.name === cellEdit.column);
        return (
          <CellEditorDialog
            open
            columnName={cellEdit.column}
            columnType={colMeta?.type ?? "text"}
            currentValue={cellEdit.row[cellEdit.column]}
            onSave={handleCellSave}
            onCancel={() => setCellEdit(null)}
          />
        );
      })()}
    </DbWorkspaceProvider>
  );
}
