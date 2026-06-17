import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useI18n } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { ScopedSearch } from "../../components/ui/ScopedSearch";
import {
  type DbConnectionConfig,
  connectionMatchesGroup,
  listConnections,
  isConnectionEnabled,
  connectionHasTableSchemaChildren,
} from "./api";
import type { DbConnectionGroup } from "../../stores/dbGroupStore";
import { useDbSchemaFilterStore } from "../../stores/dbSchemaFilterStore";
import { useDbSchemaTreeExpandedStore } from "../../stores/dbSchemaTreeExpandedStore";
import { useDbSchemaCacheStore } from "../../stores/dbSchemaCacheStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { getEngineIconByType } from "./engineIcons";
import {
  DatabaseFilterDialog,
  getVisibleItems,
  makeTableFilterKey,
  mergeFilter,
  SchemaFilterDialog,
} from "./DatabaseFilterDialog";
import {
  buildColumnTreeItem,
  buildConnectionTreeItem,
  buildDatabaseTreeItem,
  buildFolderTreeItem,
  buildGroupTreeItem,
  buildIndexTreeItem,
  buildTableTreeItem,
  handleSchemaTreeDragStart,
  handleSchemaTreeDragEnd,
  isSchemaTreeItemDraggable,
  type SchemaTreeItem,
} from "./schemaTreeItem";
import {
  handleSchemaTreePointerDown,
  registerSchemaTreeReorderListener,
  shouldSuppressSchemaTreeClick,
} from "./schemaTreePointerDrag";
import { reorderOrderedNames } from "./schemaTreeReorder";
import {
  nextSchemaChildLimit,
  paginateSchemaChildren,
} from "./schemaTreePagination";
import { mergeConnectionsWithCache, type CachedConnection, type CachedDatabase } from "./schemaCacheMerge";
import { refreshAllSchemaCache } from "./schemaCacheRefresh";
import type { SchemaCacheSnapshot } from "./schemaCache";
import { textSearchMatches } from "../../lib/textSearchMatch";

type LoadedDatabase = CachedDatabase;

type LoadedConnection = CachedConnection;

interface TreeNodeProps {
  item: SchemaTreeItem;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  meta?: string;
  isPk?: boolean;
  isFk?: boolean;
  hasChildren: boolean;
  active?: boolean;
  onSelect?: () => void;
  onLabelClick?: () => void;
  onContextMenu?: (e: ReactMouseEvent) => void;
  iconUrl?: string | null;
  reorderScope?: string;
  reorderName?: string;
  onMetaClick?: () => void;
  metaTitle?: string;
  /** 表节点：名称后显示的灰色注释 */
  labelComment?: string;
  /** 连接节点：是否启用（禁用与树折叠无关） */
  connectionEnabled?: boolean;
}

function SchemaLoadMoreButton({
  depth,
  remaining,
  onClick,
  label,
}: {
  depth: number;
  remaining: number;
  onClick: () => void;
  label: string;
}) {
  const indent = depth * 16 + 8;
  return (
    <button
      type="button"
      className="schema-load-more-btn"
      style={{ paddingLeft: indent }}
      onClick={onClick}
    >
      {label}
      {remaining > 0 ? ` (${remaining})` : ""}
    </button>
  );
}

function TreeNode({
  item,
  depth,
  expanded,
  onToggle,
  meta,
  isPk,
  isFk,
  hasChildren,
  active,
  onSelect,
  onLabelClick,
  onContextMenu,
  iconUrl,
  reorderScope,
  reorderName,
  onMetaClick,
  metaTitle,
  labelComment,
  connectionEnabled = true,
}: TreeNodeProps) {
  const { t } = useI18n();
  const { type, label } = item;
  const indent = depth * 16 + 8;
  const draggable = isSchemaTreeItemDraggable(type);
  const isConnection = type === "connection";
  const connectionStateClass = isConnection
    ? connectionEnabled
      ? " tree-node--connection-enabled"
      : " tree-node--connection-disabled"
    : "";

  return (
    <div
      className={`tree-node tree-node--${type}${active ? " tree-node--active" : ""}${draggable ? " tree-node--draggable" : ""}${connectionStateClass}`}
      style={{ paddingLeft: indent }}
      data-schema-item-type={type}
      {...(reorderScope && reorderName
        ? {
            "data-schema-reorder-scope": reorderScope,
            "data-schema-reorder-name": reorderName,
          }
        : {})}
      draggable={draggable}
      onPointerDown={draggable ? (event) => handleSchemaTreePointerDown(item, event) : undefined}
      onDragStart={
        draggable ? (event) => handleSchemaTreeDragStart(item, event) : undefined
      }
      onDragEnd={draggable ? () => handleSchemaTreeDragEnd(item) : undefined}
      onContextMenu={onContextMenu}
    >
      <span
        className={`tree-arrow${hasChildren ? "" : " tree-leaf"}${expanded ? " tree-arrow--open" : ""}`}
        onClick={(event) => {
          event.stopPropagation();
          if (hasChildren) {
            onToggle();
          }
        }}
      >
        {hasChildren ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10">
            <path d="M9 18l6-6-6-6" />
          </svg>
        ) : (
          <span className="tree-dot" />
        )}
      </span>
      <span className="tree-icon">
        {type === "connection" ? (
          iconUrl ? (
            <img src={iconUrl} alt="" className="tree-engine-logo" draggable={false} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="18" r="1" fill="currentColor" />
            </svg>
          )
        ) : null}
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
        {(type === "folder" || type === "group") && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        )}
        {type === "column" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <path d="M12 2v20" />
            <path d="M2 12h20" />
          </svg>
        )}
        {type === "index" && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <path d="M4 6h16M4 10h10M4 14h14M4 18h8" />
          </svg>
        )}
      </span>
      {isConnection && (
        <span
          className={`tree-conn-status${connectionEnabled ? " tree-conn-status--enabled" : " tree-conn-status--disabled"}`}
          title={
            connectionEnabled
              ? t("database.sidebar.connectionEnabled")
              : t("database.sidebar.connectionDisabled")
          }
          aria-hidden
        />
      )}
      <span
        className="tree-label"
        onClick={() => {
          if (shouldSuppressSchemaTreeClick()) {
            return;
          }
          if (onLabelClick) {
            onLabelClick();
            return;
          }
          if (!hasChildren) {
            onSelect?.();
            return;
          }
          onToggle();
        }}
      >
        {label}
        {labelComment ? (
          <span className="tree-label-comment" title={labelComment}>
            {labelComment}
          </span>
        ) : null}
      </span>
      {isPk && <span className="tree-badge tree-badge--pk">PK</span>}
      {isFk && <span className="tree-badge tree-badge--fk">FK</span>}
      {meta && (
        <span
          className={`tree-meta${onMetaClick ? " tree-meta--clickable" : ""}`}
          title={metaTitle}
          onClick={
            onMetaClick
              ? (event) => {
                  event.stopPropagation();
                  onMetaClick();
                }
              : undefined
          }
        >
          {meta}
        </span>
      )}
    </div>
  );
}

function makeTableNodeId(connId: string, dbName: string, tableName: string) {
  return `tbl:${connId}:${dbName}:${tableName}`;
}

function parseTableNodeId(id: string): { connId: string; dbName: string; tableName: string } | null {
  if (!id.startsWith("tbl:")) {
    return null;
  }
  const parts = id.slice(4).split(":");
  if (parts.length < 3) {
    return null;
  }
  const connId = parts[0];
  const tableName = parts[parts.length - 1];
  const dbName = parts.slice(1, -1).join(":");
  return { connId, dbName, tableName };
}

function tableColumnsFolderId(tableId: string) {
  return `${tableId}:cols`;
}

function tableIndexesFolderId(tableId: string) {
  return `${tableId}:idxs`;
}

export type SchemaTableSelection = {
  connId: string;
  dbName: string;
  tableName: string;
  connection: DbConnectionConfig;
};

export type SchemaDatabaseSelection = {
  connId: string;
  dbName: string;
  connection: DbConnectionConfig;
};

export function makeDatabaseNodeId(connId: string, dbName: string) {
  return `db:${connId}:${dbName}`;
}

function syncFiltersFromSnapshot(
  snapshot: SchemaCacheSnapshot,
  syncDatabaseFilter: (connId: string, names: string[]) => void,
  syncTableFilter: (connId: string, dbName: string, names: string[]) => void,
) {
  for (const [connId, entry] of Object.entries(snapshot.connections)) {
    if (entry.databases.length > 0) {
      syncDatabaseFilter(connId, entry.databases.map((db) => db.name));
    }
    for (const db of entry.databases) {
      if (db.tables.length > 0) {
        syncTableFilter(connId, db.name, db.tables.map((table) => table.name));
      }
    }
  }
}

interface SchemaBrowserProps {
  groups: DbConnectionGroup[];
  activeGroupId?: string;
  activeConnId?: string | null;
  onCreateConnection?: () => void;
  onCreateGroup?: () => void;
  onSelectGroup?: (groupId: string) => void;
  onSelectConnection?: (connId: string) => void;
  onNewQuery?: () => void;
  onSelectTable?: (selection: SchemaTableSelection) => void;
  onSelectDatabase?: (selection: SchemaDatabaseSelection) => void;
  onContextTable?: (selection: SchemaTableSelection, event: ReactMouseEvent) => void;
  onContextConnection?: (connId: string, event: ReactMouseEvent) => void;
  activeTableKey?: string | null;
  activeDatabaseKey?: string | null;
  refreshToken?: number;
}

export function SchemaBrowser({
  groups,
  activeGroupId,
  activeConnId = null,
  onCreateConnection,
  onCreateGroup,
  onSelectGroup,
  onSelectConnection,
  onNewQuery,
  onSelectTable,
  onSelectDatabase,
  onContextTable,
  onContextConnection,
  activeTableKey = null,
  activeDatabaseKey = null,
  refreshToken = 0,
}: SchemaBrowserProps) {
  const { t } = useI18n();
  const resolvedTheme = useSettingsStore((s) => s.resolved);
  const [search, setSearch] = useState("");
  const expandedNodeIds = useDbSchemaTreeExpandedStore((s) => s.expandedNodeIds);
  const expandedHydrated = useDbSchemaTreeExpandedStore((s) => s.hydrated);
  const hydrateSchemaExpanded = useDbSchemaTreeExpandedStore((s) => s.hydrate);
  const updateExpanded = useDbSchemaTreeExpandedStore((s) => s.updateExpanded);
  const [childVisibleLimits, setChildVisibleLimits] = useState<Record<string, number>>({});
  const [connections, setConnections] = useState<LoadedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const databaseFilters = useDbSchemaFilterStore((s) => s.databaseFilters);
  const tableFilters = useDbSchemaFilterStore((s) => s.tableFilters);
  const filtersHydrated = useDbSchemaFilterStore((s) => s.hydrated);
  const hydrateSchemaFilters = useDbSchemaFilterStore((s) => s.hydrate);
  const setDatabaseFilters = useDbSchemaFilterStore((s) => s.setDatabaseFilters);
  const setTableFilters = useDbSchemaFilterStore((s) => s.setTableFilters);
  const [filterDialogConnId, setFilterDialogConnId] = useState<string | null>(null);
  const [filterDialogTable, setFilterDialogTable] = useState<{ connId: string; dbName: string } | null>(
    null
  );
  const sidebarRef = useRef<HTMLDivElement>(null);
  const schemaTreeRef = useRef<HTMLDivElement>(null);
  const connectionsRef = useRef(connections);
  const hydrateSchemaCache = useDbSchemaCacheStore((s) => s.hydrate);
  const replaceSchemaSnapshot = useDbSchemaCacheStore((s) => s.replaceSnapshot);
  const schemaSnapshot = useDbSchemaCacheStore((s) => s.snapshot);
  const [refreshingSchema, setRefreshingSchema] = useState(false);

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
    try {
      await hydrateSchemaCache();
      const list = await listConnections();
      const snapshot = useDbSchemaCacheStore.getState().snapshot;
      const merged = mergeConnectionsWithCache(list, snapshot);
      connectionsRef.current = merged;
      setConnections(merged);
    } catch (error) {
      setConnections([]);
      setLoadError(String(error));
    } finally {
      setLoading(false);
    }
  }, [hydrateSchemaCache]);

  const refreshSchemaCache = useCallback(async () => {
    setRefreshingSchema(true);
    setLoadError(null);
    try {
      const list = await listConnections();
      const snapshot = await refreshAllSchemaCache();
      await replaceSchemaSnapshot(snapshot);
      const merged = mergeConnectionsWithCache(list, snapshot);
      connectionsRef.current = merged;
      setConnections(merged);
      syncFiltersFromSnapshot(snapshot, syncDatabaseFilter, syncTableFilter);
    } catch (error) {
      setLoadError(String(error));
    } finally {
      setRefreshingSchema(false);
    }
  }, [replaceSchemaSnapshot, syncDatabaseFilter, syncTableFilter]);

  useEffect(() => {
    const configs = connectionsRef.current.map((item) => item.config);
    if (configs.length === 0) {
      return;
    }
    const merged = mergeConnectionsWithCache(configs, schemaSnapshot);
    connectionsRef.current = merged;
    setConnections(merged);
  }, [schemaSnapshot]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections, refreshToken]);

  useEffect(() => {
    if (!activeGroupId) return;
    const groupNodeId = `grp:${activeGroupId}`;
    updateExpanded((prev) => {
      if (prev.has(groupNodeId)) return prev;
      const next = new Set(prev);
      next.add(groupNodeId);
      return next;
    });
  }, [activeGroupId, updateExpanded]);

  useEffect(() => {
    if (!filtersHydrated) {
      void hydrateSchemaFilters();
    }
  }, [filtersHydrated, hydrateSchemaFilters]);

  useEffect(() => {
    if (!expandedHydrated) {
      void hydrateSchemaExpanded();
    }
  }, [expandedHydrated, hydrateSchemaExpanded]);

  useEffect(() => {
    return registerSchemaTreeReorderListener((item, target) => {
      if (target.kind === "database" && item.connId && item.dbName) {
        setDatabaseFilters((prev) => {
          const existing = prev[item.connId!];
          if (!existing) {
            return prev;
          }
          const nextOrder = reorderOrderedNames(
            existing.orderedNames,
            item.dbName!,
            target.insertBeforeName,
          );
          if (!nextOrder) {
            return prev;
          }
          return {
            ...prev,
            [item.connId!]: { ...existing, orderedNames: nextOrder },
          };
        });
        return;
      }

      if (target.kind === "table" && item.connId && item.dbName && item.tableName) {
        const key = makeTableFilterKey(item.connId, item.dbName);
        setTableFilters((prev) => {
          const existing = prev[key];
          if (!existing) {
            return prev;
          }
          const nextOrder = reorderOrderedNames(
            existing.orderedNames,
            item.tableName!,
            target.insertBeforeName,
          );
          if (!nextOrder) {
            return prev;
          }
          return {
            ...prev,
            [key]: { ...existing, orderedNames: nextOrder },
          };
        });
      }
    });
  }, [setDatabaseFilters, setTableFilters]);

  const loadMoreChildren = useCallback((parentNodeId: string) => {
    setChildVisibleLimits((prev) => ({
      ...prev,
      [parentNodeId]: nextSchemaChildLimit(prev, parentNodeId),
    }));
  }, []);

  const toggle = (id: string) => {
    if (id.startsWith("conn:")) {
      const connId = id.slice(5);
      const conn = connectionsRef.current.find((item) => item.config.id === connId);
      if (conn && !isConnectionEnabled(conn.config)) {
        return;
      }
    }

    const willExpand = !expandedNodeIds.has(id);
    updateExpanded((prev) => {
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

    const tableParsed = parseTableNodeId(id);
    if (tableParsed) {
      const conn = connectionsRef.current.find((item) => item.config.id === tableParsed.connId);
      if (conn && connectionHasTableSchemaChildren(conn.config)) {
        updateExpanded((prev) => {
          const next = new Set(prev);
          next.add(tableColumnsFolderId(id));
          next.add(tableIndexesFolderId(id));
          return next;
        });
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return connections;
    }

    const q = search.trim();
    const tableMatchesQuery = (table: { name: string; comment?: string }) =>
      textSearchMatches(q, table.name) || (table.comment ? textSearchMatches(q, table.comment) : false);

    return connections
      .map((conn) => {
        const nameMatch = textSearchMatches(q, conn.config.name);
        const allDatabases = conn.databases ?? [];
        const visibleDatabases = getVisibleItems(allDatabases, databaseFilters[conn.config.id]);
        const databases = visibleDatabases
          .map((db) => {
            const dbMatch = nameMatch || textSearchMatches(q, db.name);
            const allTables = db.tables ?? [];
            const visibleTables = getVisibleItems(
              allTables,
              tableFilters[makeTableFilterKey(conn.config.id, db.name)]
            );
            const tables = visibleTables.filter(
              (table) => dbMatch || tableMatchesQuery(table),
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

  const groupSections = useMemo(() => {
    const sections = groups.map((group) => ({
      group,
      connections: filtered.filter((conn) => connectionMatchesGroup(conn.config, group.name)),
    }));
    if (!search.trim()) {
      return sections;
    }
    return sections.filter((section) => section.connections.length > 0);
  }, [groups, filtered, search]);

  const hasAnyConnection = filtered.length > 0;

  const filterDialogConn = filterDialogConnId
    ? connections.find((conn) => conn.config.id === filterDialogConnId)
    : undefined;

  const filterDialogTableDb =
    filterDialogTable &&
    connections
      .find((conn) => conn.config.id === filterDialogTable.connId)
      ?.databases?.find((db) => db.name === filterDialogTable.dbName);

  return (
    <div className="schema-panel" ref={sidebarRef}>
      <div className="schema-header">
        <h3>{t("database.sidebar.title")}</h3>
        {onCreateGroup && (
          <Button variant="icon" title={t("database.groups.new")} onClick={onCreateGroup}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2v-5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              <path d="M12 11v6M9 14h6" />
            </svg>
          </Button>
        )}
        <Button
          variant="icon"
          title={t("database.sidebar.createConnection")}
          onClick={onCreateConnection}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </Button>
        <Button
          variant="icon"
          title={t("database.sidebar.refresh")}
          disabled={refreshingSchema}
          onClick={() => void refreshSchemaCache()}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </Button>
        {onNewQuery && (
          <Button variant="icon" title={t("database.sidebar.newQuery")} onClick={onNewQuery}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M8 13h8M8 17h5" />
            </svg>
          </Button>
        )}
      </div>
      <ScopedSearch
        className="schema-tree-scoped-search"
        value={search}
        onChange={setSearch}
        placeholder={t("database.sidebar.search")}
        enabled={filterDialogConnId === null && filterDialogTable === null}
      >
        <div className="schema-tree" ref={schemaTreeRef} tabIndex={-1}>
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
        {!loading && !loadError && !hasAnyConnection && (
          <div style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-secondary, #8e8e93)" }}>
            {t("database.sidebar.empty")}
          </div>
        )}
        {groupSections.map(({ group, connections: groupConns }) => {
          const groupNodeId = `grp:${group.id}`;
          const groupExpanded = expandedNodeIds.has(groupNodeId);
          const totalInGroup = connections.filter((conn) =>
            connectionMatchesGroup(conn.config, group.name),
          ).length;
          const groupItem = buildGroupTreeItem(group.id, group.name);
          const pagedGroupConns = paginateSchemaChildren(groupConns, groupNodeId, childVisibleLimits);

          return (
            <div key={group.id}>
              <TreeNode
                item={groupItem}
                depth={0}
                expanded={groupExpanded}
                onToggle={() => toggle(groupNodeId)}
                meta={String(totalInGroup)}
                hasChildren
                active={activeGroupId === group.id}
                onLabelClick={() => onSelectGroup?.(group.id)}
              />
              {groupExpanded && groupConns.length === 0 && (
                <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--text-secondary, #8e8e93)" }}>
                  {t("database.sidebar.noConnectionsInGroup")}
                </div>
              )}
              {groupExpanded &&
                pagedGroupConns.visible.map((conn) => {
          const connId = `conn:${conn.config.id}`;
          const connExpanded = expandedNodeIds.has(connId);
          const allDatabases = conn.databases ?? [];
          const filter = databaseFilters[conn.config.id];
          const visibleDatabases = getVisibleItems(allDatabases, filter);
          const visibleCount = visibleDatabases.length;
          const totalCount = allDatabases.length;
          const isFiltered = totalCount > 0 && visibleCount < totalCount;
          const pagedDatabases = paginateSchemaChildren(visibleDatabases, connId, childVisibleLimits);

          const engineIconUrl = getEngineIconByType(conn.config.db_type, resolvedTheme);
          const connItem = buildConnectionTreeItem(conn.config.id, conn.config.name, conn.config.db_type);
          const connEnabled = isConnectionEnabled(conn.config);

          return (
            <div key={conn.config.id}>
              <TreeNode
                item={connItem}
                depth={1}
                expanded={connExpanded}
                onToggle={() => toggle(connId)}
                active={activeConnId === conn.config.id}
                connectionEnabled={connEnabled}
                onLabelClick={() => onSelectConnection?.(conn.config.id)}
                onContextMenu={
                  onContextConnection
                    ? (e) => onContextConnection(conn.config.id, e)
                    : undefined
                }
                iconUrl={engineIconUrl}
                meta={
                  !connEnabled
                    ? t("database.sidebar.connectionDisabled")
                    : conn.databases
                      ? isFiltered
                        ? `${visibleCount}/${totalCount} DB`
                        : `${totalCount} DB`
                      : refreshingSchema
                        ? t("common.loading")
                        : t("database.sidebar.cacheEmpty")
                }
                onMetaClick={
                  connEnabled &&
                  conn.databases &&
                  totalCount > 0
                    ? () => setFilterDialogConnId(conn.config.id)
                    : undefined
                }
                metaTitle={
                  connEnabled &&
                  conn.databases &&
                  totalCount > 0
                    ? t("database.sidebar.filterDisplay")
                    : undefined
                }
                hasChildren={connEnabled}
              />
              {connEnabled && connExpanded && conn.databasesError && (
                <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--color-danger, #ff3b30)" }}>
                  {conn.databasesError}
                </div>
              )}
              {connEnabled &&
                connExpanded &&
                !conn.databases &&
                !conn.databasesError && (
                  <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--text-secondary, #8e8e93)" }}>
                    {t("database.sidebar.cacheEmptyHint")}
                  </div>
                )}
              {connEnabled &&
                connExpanded &&
                conn.databases &&
                totalCount === 0 &&
                !conn.databasesError && (
                  <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--text-secondary, #8e8e93)" }}>
                    {t("database.sidebar.noDatabases")}
                  </div>
                )}
              {connEnabled &&
                connExpanded &&
                conn.databases &&
                visibleCount === 0 &&
                totalCount > 0 && (
                  <div style={{ padding: "4px 24px", fontSize: "11px", color: "var(--text-secondary, #8e8e93)" }}>
                    {t("database.sidebar.filterHidden")}
                  </div>
                )}
              {connEnabled &&
                connExpanded &&
                conn.databases &&
                pagedDatabases.visible.map((db) => {
                  const dbId = makeDatabaseNodeId(conn.config.id, db.name);
                  const dbExpanded = expandedNodeIds.has(dbId);
                  const allTables = db.tables ?? [];
                  const tableFilter = tableFilters[makeTableFilterKey(conn.config.id, db.name)];
                  const visibleTables = getVisibleItems(allTables, tableFilter);
                  const tableVisibleCount = visibleTables.length;
                  const tableTotalCount = allTables.length;
                  const isTableFiltered = tableTotalCount > 0 && tableVisibleCount < tableTotalCount;
                  const pagedTables = paginateSchemaChildren(visibleTables, dbId, childVisibleLimits);
                  const dbItem = buildDatabaseTreeItem(conn.config.id, db.name);

                  return (
                    <div key={db.name}>
                      <TreeNode
                        item={dbItem}
                        depth={2}
                        expanded={dbExpanded}
                        onToggle={() => toggle(dbId)}
                        reorderScope={conn.config.id}
                        reorderName={db.name}
                        active={activeDatabaseKey === dbId}
                        onLabelClick={() => {
                          if (!dbExpanded) {
                            toggle(dbId);
                          }
                          onSelectDatabase?.({
                            connId: conn.config.id,
                            dbName: db.name,
                            connection: conn.config,
                          });
                        }}
                        meta={
                          db.loadError
                            ? t("database.sidebar.tablesFailed")
                            : db.tables
                              ? isTableFiltered
                                ? `${tableVisibleCount}/${tableTotalCount} tables`
                                : `${tableTotalCount} tables`
                              : undefined
                        }
                        onMetaClick={
                          db.tables && tableTotalCount > 0
                            ? () =>
                                setFilterDialogTable({
                                  connId: conn.config.id,
                                  dbName: db.name,
                                })
                            : undefined
                        }
                        metaTitle={
                          db.tables && tableTotalCount > 0
                            ? t("database.sidebar.filterDisplay")
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
                      {dbExpanded &&
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
                        pagedTables.visible.map((tbl) => {
                          const tableKey = makeTableNodeId(conn.config.id, db.name, tbl.name);
                          const tableExpanded = expandedNodeIds.has(tableKey);
                          const showTableSchemaChildren = connectionHasTableSchemaChildren(conn.config);
                          const colsFolderId = tableColumnsFolderId(tableKey);
                          const idxFolderId = tableIndexesFolderId(tableKey);
                          const colsExpanded = expandedNodeIds.has(colsFolderId);
                          const idxExpanded = expandedNodeIds.has(idxFolderId);
                          const columns = tbl.columns ?? [];
                          const indexes = tbl.indexes ?? [];
                          const pagedColumns = paginateSchemaChildren(columns, colsFolderId, childVisibleLimits);
                          const pagedIndexes = paginateSchemaChildren(indexes, idxFolderId, childVisibleLimits);
                          const tableItem = buildTableTreeItem(conn.config.id, db.name, tbl.name);
                          const colsFolderItem = buildFolderTreeItem(
                            colsFolderId,
                            t("database.sidebar.fields"),
                            conn.config.id,
                            db.name,
                            tbl.name,
                          );
                          const idxFolderItem = buildFolderTreeItem(
                            idxFolderId,
                            t("database.sidebar.indexes"),
                            conn.config.id,
                            db.name,
                            tbl.name,
                          );

                          return (
                            <div key={tbl.name}>
                              <TreeNode
                                item={tableItem}
                                depth={3}
                                expanded={tableExpanded}
                                onToggle={() => toggle(tableKey)}
                                reorderScope={makeTableFilterKey(conn.config.id, db.name)}
                                reorderName={tbl.name}
                                hasChildren={showTableSchemaChildren}
                                active={activeTableKey === tableKey}
                                labelComment={tbl.comment?.trim() || undefined}
                                onLabelClick={() =>
                                  onSelectTable?.({
                                    connId: conn.config.id,
                                    dbName: db.name,
                                    tableName: tbl.name,
                                    connection: conn.config,
                                  })
                                }
                                onContextMenu={
                                  onContextTable
                                    ? (e) =>
                                        onContextTable(
                                          {
                                            connId: conn.config.id,
                                            dbName: db.name,
                                            tableName: tbl.name,
                                            connection: conn.config,
                                          },
                                          e,
                                        )
                                    : undefined
                                }
                                meta={
                                  !showTableSchemaChildren
                                    ? undefined
                                    : tbl.detailsError
                                      ? t("database.sidebar.detailsFailed")
                                      : tbl.columns
                                        ? `${columns.length} ${t("database.sidebar.fields")} · ${indexes.length} ${t("database.sidebar.indexes")}`
                                        : undefined
                                }
                              />
                              {showTableSchemaChildren && tableExpanded && tbl.detailsError && (
                                <div
                                  style={{
                                    padding: "4px 56px",
                                    fontSize: "11px",
                                    color: "var(--color-danger, #ff3b30)",
                                  }}
                                >
                                  {tbl.detailsError}
                                </div>
                              )}
                              {showTableSchemaChildren && tableExpanded && tbl.columns && (
                                <>
                                  <TreeNode
                                    item={colsFolderItem}
                                    depth={4}
                                    expanded={colsExpanded}
                                    onToggle={() => toggle(colsFolderId)}
                                    meta={String(columns.length)}
                                    hasChildren={columns.length > 0}
                                  />
                                  {colsExpanded &&
                                    pagedColumns.visible.map((col) => (
                                      <TreeNode
                                        key={`${tableKey}:col:${col.name}`}
                                        item={buildColumnTreeItem(
                                          conn.config.id,
                                          db.name,
                                          tbl.name,
                                          col.name,
                                          col.type,
                                          `${tableKey}:col:${col.name}`,
                                        )}
                                        depth={5}
                                        expanded={false}
                                        onToggle={() => {}}
                                        hasChildren={false}
                                        meta={col.type}
                                        isPk={col.isPk}
                                        isFk={col.isFk}
                                      />
                                    ))}
                                  {colsExpanded && pagedColumns.hasMore && (
                                    <SchemaLoadMoreButton
                                      depth={5}
                                      remaining={pagedColumns.remaining}
                                      label={t("database.sidebar.loadMore")}
                                      onClick={() => loadMoreChildren(colsFolderId)}
                                    />
                                  )}
                                  {colsExpanded && columns.length === 0 && !tbl.detailsError && (
                                    <div
                                      style={{
                                        padding: "4px 72px",
                                        fontSize: "11px",
                                        color: "var(--text-secondary, #8e8e93)",
                                      }}
                                    >
                                      {t("database.sidebar.noColumns")}
                                    </div>
                                  )}
                                  <TreeNode
                                    item={idxFolderItem}
                                    depth={4}
                                    expanded={idxExpanded}
                                    onToggle={() => toggle(idxFolderId)}
                                    meta={String(indexes.length)}
                                    hasChildren={indexes.length > 0}
                                  />
                                  {idxExpanded &&
                                    pagedIndexes.visible.map((idx) => (
                                      <TreeNode
                                        key={`${tableKey}:idx:${idx.name}`}
                                        item={buildIndexTreeItem(
                                          conn.config.id,
                                          db.name,
                                          tbl.name,
                                          idx.name,
                                          `${tableKey}:idx:${idx.name}`,
                                        )}
                                        depth={5}
                                        expanded={false}
                                        onToggle={() => {}}
                                        hasChildren={false}
                                        meta={idx.columns.join(", ")}
                                      />
                                    ))}
                                  {idxExpanded && pagedIndexes.hasMore && (
                                    <SchemaLoadMoreButton
                                      depth={5}
                                      remaining={pagedIndexes.remaining}
                                      label={t("database.sidebar.loadMore")}
                                      onClick={() => loadMoreChildren(idxFolderId)}
                                    />
                                  )}
                                  {idxExpanded && indexes.length === 0 && !tbl.detailsError && (
                                    <div
                                      style={{
                                        padding: "4px 72px",
                                        fontSize: "11px",
                                        color: "var(--text-secondary, #8e8e93)",
                                      }}
                                    >
                                      {t("database.sidebar.noIndexes")}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      {dbExpanded && pagedTables.hasMore && (
                        <SchemaLoadMoreButton
                          depth={3}
                          remaining={pagedTables.remaining}
                          label={t("database.sidebar.loadMore")}
                          onClick={() => loadMoreChildren(dbId)}
                        />
                      )}
                    </div>
                  );
                })}
              {connEnabled && connExpanded && conn.databases && pagedDatabases.hasMore && (
                <SchemaLoadMoreButton
                  depth={2}
                  remaining={pagedDatabases.remaining}
                  label={t("database.sidebar.loadMore")}
                  onClick={() => loadMoreChildren(connId)}
                />
              )}
            </div>
          );
                })}
              {groupExpanded && pagedGroupConns.hasMore && (
                <SchemaLoadMoreButton
                  depth={1}
                  remaining={pagedGroupConns.remaining}
                  label={t("database.sidebar.loadMore")}
                  onClick={() => loadMoreChildren(groupNodeId)}
                />
              )}
            </div>
          );
        })}
      </div>
      </ScopedSearch>

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
