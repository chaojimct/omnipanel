import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "../../i18n";
import { ScopedSearch } from "../../components/ui/ScopedSearch";
import { fetchTableDdl, listTables } from "./api";
import { formatSqlDdl } from "./formatSqlDdl";
import type { SchemaDatabaseSelection, SchemaTableSelection } from "./SchemaBrowser";
import { TableDdlViewer } from "./TableDdlViewer";

interface DatabaseTablesPanelProps {
  selection: SchemaDatabaseSelection;
  onSelectTable: (selection: SchemaTableSelection) => void;
}

export function DatabaseTablesPanel({
  selection,
  onSelectTable,
}: DatabaseTablesPanelProps) {
  const { t } = useI18n();
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [previewTableName, setPreviewTableName] = useState<string | null>(null);
  const [ddl, setDdl] = useState("");
  const [ddlLoading, setDdlLoading] = useState(false);
  const [ddlError, setDdlError] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const names = await listTables(selection.connection, selection.dbName);
      setTables(names);
    } catch (err) {
      setError(String(err));
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [selection.connection, selection.dbName]);

  useEffect(() => {
    setSearch("");
    setPreviewTableName(null);
    setDdl("");
    setDdlError(null);
    void loadTables();
  }, [loadTables, selection.connId, selection.dbName]);

  useEffect(() => {
    if (!previewTableName) {
      setDdl("");
      setDdlError(null);
      setDdlLoading(false);
      return;
    }

    let cancelled = false;
    setDdlLoading(true);
    setDdlError(null);
    setDdl("");

    void fetchTableDdl(selection.connection, selection.dbName, previewTableName)
      .then((raw) => {
        if (cancelled) {
          return;
        }
        setDdl(formatSqlDdl(raw, selection.connection.db_type));
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setDdlError(String(err));
      })
      .finally(() => {
        if (!cancelled) {
          setDdlLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [previewTableName, selection.connection, selection.dbName]);

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((name) => name.toLowerCase().includes(q));
  }, [search, tables]);

  const handlePreviewTable = useCallback((tableName: string) => {
    setPreviewTableName(tableName);
  }, []);

  const handleOpenTable = useCallback(
    (tableName: string) => {
      onSelectTable({
        connId: selection.connId,
        dbName: selection.dbName,
        tableName,
        connection: selection.connection,
      });
    },
    [onSelectTable, selection.connId, selection.dbName, selection.connection],
  );

  return (
    <ScopedSearch
      className="db-tables-panel db-tables-panel--dock"
      value={search}
      onChange={setSearch}
      placeholder={t("database.tablesPanel.search")}
    >
      <div className="db-tables-panel-meta">
        {loading
          ? t("common.loading")
          : error
            ? t("database.sidebar.tablesFailed")
            : t("database.tablesPanel.count", { count: filteredTables.length })}
      </div>

      <div className="db-tables-panel-body">
        <div className="db-tables-panel-list">
          {error && (
            <div className="db-tables-panel-error">{error}</div>
          )}
          {!loading && !error && filteredTables.length === 0 && (
            <div className="db-tables-panel-empty">{t("database.sidebar.noTables")}</div>
          )}
          {filteredTables.map((tableName) => {
            const selected = previewTableName === tableName;
            return (
              <button
                key={tableName}
                type="button"
                className={`db-tables-panel-item${selected ? " is-selected" : ""}`}
                onClick={() => handlePreviewTable(tableName)}
                onDoubleClick={() => handleOpenTable(tableName)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M3 15h18M9 3v18" />
                </svg>
                <span className="db-tables-panel-item-name">{tableName}</span>
              </button>
            );
          })}
        </div>

        <div className="db-tables-panel-ddl">
          {!previewTableName ? (
            <div className="db-tables-panel-ddl-empty">
              {t("database.tablesPanel.ddlEmpty")}
            </div>
          ) : (
            <>
              <div className="db-tables-panel-ddl-header">
                <span className="db-tables-panel-ddl-title">{previewTableName}</span>
                <span className="db-tables-panel-ddl-hint">{t("database.tablesPanel.openHint")}</span>
              </div>
              <div className="db-tables-panel-ddl-content">
                {ddlLoading && (
                  <div className="db-tables-panel-ddl-status">{t("database.tablesPanel.ddlLoading")}</div>
                )}
                {!ddlLoading && ddlError && (
                  <div className="db-tables-panel-ddl-status db-tables-panel-ddl-status--error">
                    {t("database.tablesPanel.ddlFailed", { message: ddlError })}
                  </div>
                )}
                {!ddlLoading && !ddlError && ddl && <TableDdlViewer ddl={ddl} />}
              </div>
            </>
          )}
        </div>
      </div>
    </ScopedSearch>
  );
}
