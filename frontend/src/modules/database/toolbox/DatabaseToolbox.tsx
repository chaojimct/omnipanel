import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../../../i18n";
import {
  countTables,
  introspectSchema,
  listDatabases,
  listTables,
  type DbConnectionConfig,
} from "../api";
import { SyncSidePanel } from "./SyncSidePanel";
import {
  connectionWithDatabase,
  type DataSyncStrategy,
  type SyncSideSnapshot,
  type SyncTableInfo,
  type TableTargetStatus,
  type ToolboxTabId,
} from "./types";

const EMPTY_SNAPSHOT: SyncSideSnapshot = { tables: [], loading: false, error: null };

interface DatabaseToolboxProps {
  connections: DbConnectionConfig[];
  /** 打开工具箱时默认元库连接 */
  initialSourceConnectionId?: string | null;
  initialSourceDatabase?: string;
}

export function DatabaseToolbox({
  connections,
  initialSourceConnectionId,
  initialSourceDatabase = "",
}: DatabaseToolboxProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<ToolboxTabId>("dataSync");

  const [sourceConnId, setSourceConnId] = useState("");
  const [sourceDb, setSourceDb] = useState("");
  const [targetConnId, setTargetConnId] = useState("");
  const [targetDb, setTargetDb] = useState("");

  const [sourceDbs, setSourceDbs] = useState<string[]>([]);
  const [targetDbs, setTargetDbs] = useState<string[]>([]);
  const [sourceDbsLoading, setSourceDbsLoading] = useState(false);
  const [targetDbsLoading, setTargetDbsLoading] = useState(false);

  const [sourceSnapshot, setSourceSnapshot] = useState<SyncSideSnapshot>(EMPTY_SNAPSHOT);

  const [targetTableNames, setTargetTableNames] = useState<Set<string>>(() => new Set());
  const [targetTablesLoading, setTargetTablesLoading] = useState(false);

  const [sourceExpanded, setSourceExpanded] = useState<Set<string>>(() => new Set());
  const [sourceSelected, setSourceSelected] = useState<Set<string>>(() => new Set());
  const [tableTargetStatus, setTableTargetStatus] = useState<Record<string, TableTargetStatus>>({});
  const [tableSyncStrategies, setTableSyncStrategies] = useState<Record<string, DataSyncStrategy>>({});

  const targetConfigured = Boolean(targetConnId && targetDb.trim());

  const pickDefaultConnId = useCallback(
    (preferred?: string | null) => {
      if (preferred && connections.some((c) => c.id === preferred)) {
        return preferred;
      }
      return connections[0]?.id ?? "";
    },
    [connections],
  );

  useEffect(() => {
    const defaultConn = pickDefaultConnId(initialSourceConnectionId);
    setSourceConnId(defaultConn);
    setTargetConnId(defaultConn);
    if (initialSourceDatabase.trim()) {
      const db = initialSourceDatabase.trim();
      setSourceDb(db);
      setTargetDb(db);
    }
  }, [initialSourceConnectionId, initialSourceDatabase, pickDefaultConnId, connections]);

  const loadDatabases = useCallback(
    async (connId: string, side: "source" | "target") => {
      const conn = connections.find((c) => c.id === connId);
      const setDbs = side === "source" ? setSourceDbs : setTargetDbs;
      const setDb = side === "source" ? setSourceDb : setTargetDb;
      const setLoading = side === "source" ? setSourceDbsLoading : setTargetDbsLoading;

      if (!conn) {
        setDbs([]);
        return;
      }
      setLoading(true);
      try {
        const names = await listDatabases(conn);
        setDbs(names);
        setDb((current) => (current && names.includes(current) ? current : names[0] ?? ""));
      } catch (e) {
        setDbs([]);
        setDb("");
        console.error("[DatabaseToolbox] listDatabases failed:", e);
      } finally {
        setLoading(false);
      }
    },
    [connections],
  );

  useEffect(() => {
    if (!sourceConnId) {
      setSourceDbs([]);
      return;
    }
    void loadDatabases(sourceConnId, "source");
  }, [sourceConnId, loadDatabases]);

  useEffect(() => {
    if (!targetConnId) {
      setTargetDbs([]);
      return;
    }
    void loadDatabases(targetConnId, "target");
  }, [targetConnId, loadDatabases]);

  const loadTargetTableNames = useCallback(async () => {
    const conn = connections.find((c) => c.id === targetConnId);
    if (!conn || !targetDb.trim()) {
      setTargetTableNames(new Set());
      return;
    }
    setTargetTablesLoading(true);
    try {
      const scoped = connectionWithDatabase(conn, targetDb);
      const names = await listTables(scoped, targetDb);
      setTargetTableNames(new Set(names));
    } catch (e) {
      setTargetTableNames(new Set());
      console.error("[DatabaseToolbox] listTables (target) failed:", e);
    } finally {
      setTargetTablesLoading(false);
    }
  }, [connections, targetConnId, targetDb]);

  useEffect(() => {
    void loadTargetTableNames();
  }, [loadTargetTableNames]);

  const loadSideSnapshot = useCallback(
    async (connId: string, database: string, mode: ToolboxTabId) => {
      const conn = connections.find((c) => c.id === connId);
      if (!conn || !database.trim()) {
        setSourceSnapshot(EMPTY_SNAPSHOT);
        return;
      }

      setSourceSnapshot({ tables: [], loading: true, error: null });
      try {
        const scoped = connectionWithDatabase(conn, database);
        const result = await introspectSchema(scoped, database);
        let tables: SyncTableInfo[] = result.tables.map((tbl) => ({
          name: tbl.name,
          columns: tbl.columns,
          rowCount: mode === "dataSync" ? null : 0,
        }));

        if (mode === "dataSync" && tables.length > 0) {
          const counts = await countTables(
            scoped,
            database,
            tables.map((tbl) => tbl.name),
          );
          const countByName = new Map(counts.map((c) => [c.name, c.count]));
          tables = tables.map((tbl) => ({
            ...tbl,
            rowCount: countByName.get(tbl.name) ?? -1,
          }));
        }

        tables.sort((a, b) => a.name.localeCompare(b.name));
        setSourceSnapshot({ tables, loading: false, error: null });
      } catch (e) {
        setSourceSnapshot({
          tables: [],
          loading: false,
          error: typeof e === "string" ? e : String(e),
        });
      }
    },
    [connections],
  );

  useEffect(() => {
    setSourceSelected(new Set());
    setTableTargetStatus({});
    setTableSyncStrategies({});
    void loadSideSnapshot(sourceConnId, sourceDb, tab);
  }, [sourceConnId, sourceDb, tab, loadSideSnapshot]);

  /** 已勾选源表：对照目标库表名更新冲突/新增状态 */
  useEffect(() => {
    if (!targetConfigured || tab !== "dataSync") {
      setTableTargetStatus({});
      setTableSyncStrategies({});
      return;
    }

    if (targetTablesLoading) {
      setTableTargetStatus(() => {
        const next: Record<string, TableTargetStatus> = {};
        for (const name of sourceSelected) {
          next[name] = "checking";
        }
        return next;
      });
      return;
    }

    setTableTargetStatus(() => {
      const next: Record<string, TableTargetStatus> = {};
      for (const name of sourceSelected) {
        next[name] = targetTableNames.has(name) ? "conflict" : "new";
      }
      return next;
    });

    setTableSyncStrategies((prev) => {
      const next: Record<string, DataSyncStrategy> = {};
      for (const name of sourceSelected) {
        if (targetTableNames.has(name)) {
          next[name] = prev[name] ?? "rewrite";
        }
      }
      return next;
    });
  }, [sourceSelected, targetTableNames, targetTablesLoading, targetConfigured, tab]);

  const toggleSourceTable = useCallback((name: string) => {
    setSourceExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const toggleSourceSelected = useCallback((name: string) => {
    setSourceSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const selectSourceAllTables = useCallback((tableNames: string[], selected: boolean) => {
    setSourceSelected((prev) => {
      const next = new Set(prev);
      for (const name of tableNames) {
        if (selected) next.add(name);
        else next.delete(name);
      }
      return next;
    });
  }, []);

  const setTableSyncStrategy = useCallback((tableName: string, strategy: DataSyncStrategy) => {
    setTableSyncStrategies((prev) => ({ ...prev, [tableName]: strategy }));
  }, []);

  const sourceSelectedTableNames = useMemo(
    () => Array.from(sourceSelected),
    [sourceSelected],
  );

  const tabs = useMemo(
    () =>
      [
        { id: "dataSync" as const, label: t("database.toolbox.tabs.dataSync") },
        { id: "schemaSync" as const, label: t("database.toolbox.tabs.schemaSync") },
      ] satisfies { id: ToolboxTabId; label: string }[],
    [t],
  );

  return (
    <div className="db-toolbox">
      <nav className="db-toolbox-tabs" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`db-toolbox-tab${tab === item.id ? " active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="db-toolbox-panels" role="tabpanel">
        <div className="db-toolbox-split">
          <SyncSidePanel
            sideLabel={t("database.toolbox.side.source")}
            connections={connections}
            connectionId={sourceConnId}
            database={sourceDb}
            onConnectionChange={setSourceConnId}
            onDatabaseChange={setSourceDb}
            databases={sourceDbs}
            databasesLoading={sourceDbsLoading}
            snapshot={sourceSnapshot}
            tab={tab}
            expandedTables={sourceExpanded}
            onToggleTable={toggleSourceTable}
            selectedTables={sourceSelected}
            onToggleSelect={toggleSourceSelected}
            onSelectAllTables={selectSourceAllTables}
          />
          <div className="db-toolbox-split__divider" aria-hidden />
          <SyncSidePanel
            sideLabel={t("database.toolbox.side.target")}
            tableListMode="targetSync"
            connections={connections}
            connectionId={targetConnId}
            database={targetDb}
            onConnectionChange={setTargetConnId}
            onDatabaseChange={setTargetDb}
            databases={targetDbs}
            databasesLoading={targetDbsLoading}
            snapshot={EMPTY_SNAPSHOT}
            tab={tab}
            expandedTables={new Set()}
            onToggleTable={() => {}}
            selectedTables={new Set()}
            onToggleSelect={() => {}}
            onSelectAllTables={() => {}}
            sourceSelectedTableNames={sourceSelectedTableNames}
            targetConfigured={targetConfigured}
            targetTablesLoading={targetTablesLoading}
            tableTargetStatus={tableTargetStatus}
            tableSyncStrategies={tableSyncStrategies}
            onSyncStrategyChange={setTableSyncStrategy}
          />
        </div>
      </div>
    </div>
  );
}
