import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../i18n";
import { type DbConnectionConfig, connectionMatchesGroup, listConnections, listDatabases, listTables } from "./api";
import {
  DatabaseFilterDialog,
  type SchemaFilterState,
  getVisibleItems,
  makeTableFilterKey,
  mergeFilter,
  SchemaFilterDialog,
} from "./DatabaseFilterDialog";

interface Table {
  name: string;
}

interface LoadedDatabase {
  name: string;
  tables?: Table[];
  loadingTables?: boolean;
  loadError?: string;
}

interface LoadedConnection {
  config: DbConnectionConfig;
  databases?: LoadedDatabase[];
  loadingDatabases?: boolean;
  databasesError?: string;
}

type TreeNodeType = "connection" | "database" | "table" | "column";

interface TreeNodeProps {
  id: string;
  label: string;
  type: TreeNodeType;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  meta?: string;
  isPk?: boolean;
  isFk?: boolean;
  hasChildren: boolean;
  active?: boolean;
}

function TreeNode({
  label,
  type,
  depth,
  expanded,
  onToggle,
  meta,
  isPk,
  isFk,
  hasChildren,
  active,
}: TreeNodeProps) {
  const indent = depth * 16 + 8;

  return (
    <div
      className={`tree-node tree-node--${type}${active ? " tree-node--active" : ""}`}
      style={{ paddingLeft: indent }}
      onClick={hasChildren ? onToggle : undefined}
    >
      <span className={`tree-arrow${hasChildren ? "" : " tree-leaf"}${expanded ? " tree-arrow--open" : ""}`}>
        {hasChildren ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
            <path d="M9 18l6-6-6-6" />
          </svg>
        ) : (
          <span className="tree-dot" />
        )}
      </span>
      <span className="tree-icon">
        {type === "connection" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <circle cx="6" cy="6" r="1" fill="currentColor" />
            <circle cx="6" cy="18" r="1" fill="currentColor" />
          </svg>
        )}
        {type === "database" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
          </svg>
        )}
        {type === "table" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
        )}
        {type === "column" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <path d="M12 2v20" />
            <path d="M2 12h20" />
          </svg>
        )}
      </span>
      <span className="tree-label">{label}</span>
      {isPk && <span className="tree-badge tree-badge--pk">PK</span>}
      {isFk && <span className="tree-badge tree-badge--fk">FK</span>}
      {meta && <span className="tree-meta">{meta}</span>}
    </div>
  );
}

function parseDbNodeId(id: string): { connId: string; dbName: string } | null {
  if (!id.startsWith("db:")) {
    return null;
  }
  const rest = id.slice(3);
  const sep = rest.indexOf(":");
  if (sep < 0) {
    return null;
  }
  return { connId: rest.slice(0, sep), dbName: rest.slice(sep + 1) };
}

interface SchemaBrowserProps {
  onCreateConnection?: () => void;
  refreshToken?: number;
  groupFilter?: string;
}

export function SchemaBrowser({ onCreateConnection, refreshToken = 0, groupFilter }: SchemaBrowserProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [connections, setConnections] = useState<LoadedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [databaseFilters, setDatabaseFilters] = useState<Record<string, SchemaFilterState>>({});
  const [tableFilters, setTableFilters] = useState<Record<string, SchemaFilterState>>({});
  const [filterDialogConnId, setFilterDialogConnId] = useState<string | null>(null);
  const [filterDialogTable, setFilterDialogTable] = useState<{ connId: string; dbName: string } | null>(
    null
  );
  const connectionsRef = useRef(connections);
  const loadingDatabasesRef = useRef(new Set<string>());
  const loadingTablesRef = useRef(new Set<string>());
  const pendingDatabaseLoadsRef = useRef(new Map<string, Promise<DbConnectionConfig | null>>());

  connectionsRef.current = connections;

  const syncDatabaseFilter = useCallback((connId: string, names: string[]) => {
    setDatabaseFilters((prev) => ({
      ...prev,
      [connId]: mergeFilter(prev[connId], names),
    }));
  }, []);

  const syncTableFilter = useCallback((connId: string, dbName: string, names: string[]) => {
    const key = makeTableFilterKey(connId, dbName);
    setTableFilters((prev) => ({
      ...prev,
      [key]: mergeFilter(prev[key], names),
    }));
  }, []);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    loadingDatabasesRef.current.clear();
    loadingTablesRef.current.clear();
    pendingDatabaseLoadsRef.current.clear();
    try {
      const list = await listConnections();
      const filtered = groupFilter
        ? list.filter((config) => connectionMatchesGroup(config, groupFilter))
        : list;
      setConnections(filtered.map((config) => ({ config })));
    } catch (error) {
      setConnections([]);
      setLoadError(String(error));
    } finally {
      setLoading(false);
    }
  }, [groupFilter]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections, refreshToken]);

  const ensureDatabasesLoaded = useCallback(async (connId: string): Promise<DbConnectionConfig | null> => {
    const pending = pendingDatabaseLoadsRef.current.get(connId);
    if (pending) {
      return pending;
    }

    const current = connectionsRef.current.find((item) => item.config.id === connId);
    if (!current) {
      return null;
    }
    if (current.databases !== undefined) {
      return current.config;
    }

    const loadPromise = (async (): Promise<DbConnectionConfig | null> => {
      loadingDatabasesRef.current.add(connId);
      const config = current.config;

      const markLoading = (prev: LoadedConnection[]) =>
        prev.map((item) =>
          item.config.id === connId ? { ...item, loadingDatabases: true, databasesError: undefined } : item
        );
      connectionsRef.current = markLoading(connectionsRef.current);
      setConnections(connectionsRef.current);

      const applyDatabases = (databases: LoadedDatabase[], databasesError?: string) => {
        const next = connectionsRef.current.map((item) =>
          item.config.id === connId
            ? { ...item, databases, loadingDatabases: false, databasesError }
            : item
        );
        connectionsRef.current = next;
        setConnections(next);
        if (databases.length > 0) {
          syncDatabaseFilter(connId, databases.map((db) => db.name));
        }
      };

      const presetDb = config.database.trim();
      if (presetDb) {
        applyDatabases([{ name: presetDb }]);
        loadingDatabasesRef.current.delete(connId);
        return config;
      }

      try {
        const names = await listDatabases(config);
        applyDatabases(names.map((name) => ({ name })));
        return config;
      } catch (error) {
        applyDatabases([], String(error));
        return config;
      } finally {
        loadingDatabasesRef.current.delete(connId);
      }
    })();

    pendingDatabaseLoadsRef.current.set(connId, loadPromise);
    try {
      return await loadPromise;
    } finally {
      pendingDatabaseLoadsRef.current.delete(connId);
    }
  }, [syncDatabaseFilter]);

  const ensureTablesLoaded = useCallback(async (connId: string, dbName: string, config: DbConnectionConfig) => {
    const cacheKey = `${connId}:${dbName}`;
    const current = connectionsRef.current.find((item) => item.config.id === connId);
    const db = current?.databases?.find((item) => item.name === dbName);
    if (db?.tables !== undefined || db?.loadingTables || loadingTablesRef.current.has(cacheKey)) {
      return;
    }

    loadingTablesRef.current.add(cacheKey);

    const markLoading = (prev: LoadedConnection[]) =>
      prev.map((item) =>
        item.config.id === connId
          ? {
              ...item,
              databases: item.databases?.map((entry) =>
                entry.name === dbName ? { ...entry, loadingTables: true, loadError: undefined } : entry
              ),
            }
          : item
      );
    connectionsRef.current = markLoading(connectionsRef.current);
    setConnections(connectionsRef.current);

    try {
      const tables = await listTables(config, dbName);
      const next = connectionsRef.current.map((item) =>
        item.config.id === connId
          ? {
              ...item,
              databases: item.databases?.map((entry) =>
                entry.name === dbName
                  ? {
                      ...entry,
                      tables: tables.map((name) => ({ name })),
                      loadingTables: false,
                    }
                  : entry
              ),
            }
          : item
      );
      connectionsRef.current = next;
      setConnections(next);
      if (tables.length > 0) {
        syncTableFilter(connId, dbName, tables);
      }
    } catch (error) {
      const next = connectionsRef.current.map((item) =>
        item.config.id === connId
          ? {
              ...item,
              databases: item.databases?.map((entry) =>
                entry.name === dbName
                  ? {
                      ...entry,
                      tables: [],
                      loadingTables: false,
                      loadError: String(error),
                    }
                  : entry
              ),
            }
          : item
      );
      connectionsRef.current = next;
      setConnections(next);
    } finally {
      loadingTablesRef.current.delete(cacheKey);
    }
  }, [syncTableFilter]);

  const toggle = (id: string) => {
    const willExpand = !expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    if (!willExpand) {
      return;
    }

    if (id.startsWith("conn:")) {
      void ensureDatabasesLoaded(id.slice(5));
      return;
    }

    const parsed = parseDbNodeId(id);
    if (parsed) {
      void (async () => {
        const config = await ensureDatabasesLoaded(parsed.connId);
        if (config) {
          await ensureTablesLoaded(parsed.connId, parsed.dbName, config);
        }
      })();
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return connections;
    }

    const q = search.toLowerCase();
    return connections
      .map((conn) => {
        const nameMatch = conn.config.name.toLowerCase().includes(q);
        const allDatabases = conn.databases ?? [];
        const visibleDatabases = getVisibleItems(allDatabases, databaseFilters[conn.config.id]);
        const databases = visibleDatabases
          .map((db) => {
            const dbMatch = nameMatch || db.name.toLowerCase().includes(q);
            const allTables = db.tables ?? [];
            const visibleTables = getVisibleItems(
              allTables,
              tableFilters[makeTableFilterKey(conn.config.id, db.name)]
            );
            const tables = visibleTables.filter(
              (table) => dbMatch || table.name.toLowerCase().includes(q)
            );
            if (dbMatch) {
              return db;
            }
            if (tables.length > 0) {
              return { ...db, tables };
            }
            return null;
          })
          .filter((db): db is LoadedDatabase => db !== null);

        if (nameMatch) {
          return conn;
        }
        if (databases.length > 0) {
          return { ...conn, databases };
        }
        return null;
      })
      .filter((conn): conn is LoadedConnection => conn !== null);
  }, [connections, search, databaseFilters, tableFilters]);

  const filterDialogConn = filterDialogConnId
    ? connections.find((conn) => conn.config.id === filterDialogConnId)
    : undefined;

  const filterDialogTableDb =
    filterDialogTable &&
    connections
      .find((conn) => conn.config.id === filterDialogTable.connId)
      ?.databases?.find((db) => db.name === filterDialogTable.dbName);

  return (
    <div className="schema-panel">
      <div className="schema-header">
        <h3>{t("database.sidebar.title")}</h3>
        <button
          className="btn-icon"
          title={t("database.sidebar.createConnection")}
          onClick={onCreateConnection}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button className="btn-icon" title={t("database.sidebar.refresh")} onClick={() => void loadConnections()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>
      <div className="schema-search">
        <input
          className="input input-search"
          placeholder={t("database.sidebar.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", fontSize: "11px" }}
        />
      </div>
      <div className="schema-tree">
        {loading && (
          <div style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-secondary, #8e8e93)" }}>
            {t("common.loading")}
          </div>
        )}
        {!loading && loadError && (
          <div style={{ padding: "12px 16px", fontSize: "12px", color: "var(--color-danger, #ff3b30)" }}>
            {t("database.sidebar.loadFailed")}: {loadError}
          </div>
        )}
        {!loading && !loadError && filtered.length === 0 && (
          <div style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-secondary, #8e8e93)" }}>
            {t("database.sidebar.empty")}
          </div>
        )}
        {filtered.map((conn) => {
          const connId = `conn:${conn.config.id}`;
          const connExpanded = expanded.has(connId);
          const allDatabases = conn.databases ?? [];
          const filter = databaseFilters[conn.config.id];
          const visibleDatabases = getVisibleItems(allDatabases, filter);
          const visibleCount = visibleDatabases.length;
          const totalCount = allDatabases.length;
          const isFiltered = totalCount > 0 && visibleCount < totalCount;

          return (
            <div key={conn.config.id}>
              <TreeNode
                id={connId}
                label={conn.config.name}
                type="connection"
                depth={0}
                expanded={connExpanded}
                onToggle={() => toggle(connId)}
                meta={
                  conn.loadingDatabases
                    ? t("common.loading")
                    : conn.databases
                      ? isFiltered
                        ? `${visibleCount}/${totalCount} DB`
                        : `${totalCount} DB`
                      : conn.config.db_type
                }
                hasChildren
              />
              {connExpanded && conn.databasesError && (
                <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--color-danger, #ff3b30)" }}>
                  {conn.databasesError}
                </div>
              )}
              {connExpanded &&
                !conn.loadingDatabases &&
                totalCount === 0 &&
                !conn.databasesError && (
                  <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--text-secondary, #8e8e93)" }}>
                    {t("database.sidebar.noDatabases")}
                  </div>
                )}
              {connExpanded && !conn.loadingDatabases && totalCount > 0 && (
                <button
                  type="button"
                  className="schema-filter-btn"
                  onClick={() => setFilterDialogConnId(conn.config.id)}
                >
                  {t("database.sidebar.filterDisplay")}
                  {isFiltered ? ` (${visibleCount}/${totalCount})` : ""}
                </button>
              )}
              {connExpanded &&
                !conn.loadingDatabases &&
                visibleCount === 0 &&
                totalCount > 0 && (
                  <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--text-secondary, #8e8e93)" }}>
                    {t("database.sidebar.filterHidden")}
                  </div>
                )}
              {connExpanded &&
                !conn.loadingDatabases &&
                visibleDatabases.map((db) => {
                  const dbId = `db:${conn.config.id}:${db.name}`;
                  const dbExpanded = expanded.has(dbId);
                  const allTables = db.tables ?? [];
                  const tableFilter = tableFilters[makeTableFilterKey(conn.config.id, db.name)];
                  const visibleTables = getVisibleItems(allTables, tableFilter);
                  const tableVisibleCount = visibleTables.length;
                  const tableTotalCount = allTables.length;
                  const isTableFiltered = tableTotalCount > 0 && tableVisibleCount < tableTotalCount;

                  return (
                    <div key={db.name}>
                      <TreeNode
                        id={dbId}
                        label={db.name}
                        type="database"
                        depth={1}
                        expanded={dbExpanded}
                        onToggle={() => toggle(dbId)}
                        meta={
                          db.loadingTables
                            ? t("common.loading")
                            : db.loadError
                              ? t("database.sidebar.tablesFailed")
                              : db.tables
                                ? isTableFiltered
                                  ? `${tableVisibleCount}/${tableTotalCount} tables`
                                  : `${tableTotalCount} tables`
                                : undefined
                        }
                        hasChildren
                      />
                      {dbExpanded && db.loadError && (
                        <div
                          style={{
                            padding: "4px 40px",
                            fontSize: "11px",
                            color: "var(--color-danger, #ff3b30)",
                          }}
                        >
                          {db.loadError}
                        </div>
                      )}
                      {dbExpanded &&
                        !db.loadingTables &&
                        tableTotalCount === 0 &&
                        !db.loadError && (
                          <div
                            style={{
                              padding: "4px 40px",
                              fontSize: "11px",
                              color: "var(--text-secondary, #8e8e93)",
                            }}
                          >
                            {t("database.sidebar.noTables")}
                          </div>
                        )}
                      {dbExpanded && !db.loadingTables && tableTotalCount > 0 && (
                        <button
                          type="button"
                          className="schema-filter-btn schema-filter-btn--depth-2"
                          onClick={() =>
                            setFilterDialogTable({ connId: conn.config.id, dbName: db.name })
                          }
                        >
                          {t("database.sidebar.filterDisplay")}
                          {isTableFiltered ? ` (${tableVisibleCount}/${tableTotalCount})` : ""}
                        </button>
                      )}
                      {dbExpanded &&
                        !db.loadingTables &&
                        tableVisibleCount === 0 &&
                        tableTotalCount > 0 && (
                          <div
                            style={{
                              padding: "4px 40px",
                              fontSize: "11px",
                              color: "var(--text-secondary, #8e8e93)",
                            }}
                          >
                            {t("database.sidebar.filterHiddenTables")}
                          </div>
                        )}
                      {dbExpanded &&
                        visibleTables.map((tbl) => (
                          <TreeNode
                            key={tbl.name}
                            id={`tbl:${conn.config.id}:${db.name}:${tbl.name}`}
                            label={tbl.name}
                            type="table"
                            depth={2}
                            expanded={false}
                            onToggle={() => {}}
                            hasChildren={false}
                          />
                        ))}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {filterDialogConn && filterDialogConn.databases && (
        <DatabaseFilterDialog
          open={filterDialogConnId !== null}
          connectionName={filterDialogConn.config.name}
          databases={filterDialogConn.databases.map((db) => db.name)}
          initial={
            databaseFilters[filterDialogConn.config.id] ??
            mergeFilter(undefined, filterDialogConn.databases.map((db) => db.name))
          }
          onClose={() => setFilterDialogConnId(null)}
          onApply={(state) => {
            setDatabaseFilters((prev) => ({
              ...prev,
              [filterDialogConn.config.id]: state,
            }));
          }}
        />
      )}

      {filterDialogTable && filterDialogTableDb?.tables && (
        <SchemaFilterDialog
          open={filterDialogTable !== null}
          title={t("database.filter.tableTitle", { name: filterDialogTable.dbName })}
          items={filterDialogTableDb.tables.map((tbl) => tbl.name)}
          initial={
            tableFilters[makeTableFilterKey(filterDialogTable.connId, filterDialogTable.dbName)] ??
            mergeFilter(undefined, filterDialogTableDb.tables.map((tbl) => tbl.name))
          }
          onClose={() => setFilterDialogTable(null)}
          onApply={(state) => {
            setTableFilters((prev) => ({
              ...prev,
              [makeTableFilterKey(filterDialogTable.connId, filterDialogTable.dbName)]: state,
            }));
          }}
        />
      )}
    </div>
  );
}
