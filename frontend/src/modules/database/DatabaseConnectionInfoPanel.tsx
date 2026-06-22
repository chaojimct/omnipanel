import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { isMysqlConnectionInfoCapable, type DbConnectionConfig } from "./api";
import { rowsToRecord, type QueryResult } from "./dbWorkspaceState";
import { TableDataGrid } from "./TableDataGrid";

const PROCESSLIST_SQL = "SHOW FULL PROCESSLIST;";

interface DatabaseConnectionInfoPanelProps {
  connection: DbConnectionConfig;
}

function noopPageChange() {}

export function DatabaseConnectionInfoPanel({ connection }: DatabaseConnectionInfoPanelProps) {
  const { t } = useI18n();
  const [refreshToken, setRefreshToken] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const loadProcessList = useCallback(async () => {
    if (!isMysqlConnectionInfoCapable(connection)) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const queryResult = await invoke<QueryResult>("db_execute_query", {
        connection,
        sql: PROCESSLIST_SQL,
      });
      setResult(queryResult);
    } catch (e) {
      setError(typeof e === "string" ? e : JSON.stringify(e));
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    void loadProcessList();
  }, [loadProcessList, refreshToken]);

  if (!isMysqlConnectionInfoCapable(connection)) {
    return (
      <div className="db-connection-info-panel">
        <div className="db-table-designer-state">
          {t("database.connectionInfo.unsupportedEngine", { engine: connection.db_type })}
        </div>
      </div>
    );
  }

  const rows =
    result && result.columns.length > 0
      ? rowsToRecord(result.columns, result.rows)
      : [];

  return (
    <div className="db-connection-info-panel">
      <div className="db-connection-info-header">
        <div>
          <h2 className="db-connection-info-title">{connection.name}</h2>
          <p className="db-connection-info-subtitle">{t("database.connectionInfo.subtitle")}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setRefreshToken((value) => value + 1)}>
          {t("database.sidebar.refresh")}
        </Button>
      </div>
      <div className="db-connection-info-sections">
        <section className="db-connection-info-section">
          <div className="db-connection-info-section-head">
            <code className="db-connection-info-sql">{PROCESSLIST_SQL}</code>
          </div>
          {loading ? (
            <div className="db-table-designer-state">{t("common.loading")}</div>
          ) : error ? (
            <div className="db-table-designer-state db-table-designer-state--error">{error}</div>
          ) : result && result.columns.length > 0 ? (
            <TableDataGrid
              columns={result.columns}
              rows={rows}
              totalRows={rows.length}
              page={0}
              pageSize={rows.length || 1}
              loading={false}
              onPageChange={noopPageChange}
            />
          ) : (
            <div className="db-table-designer-state">{t("database.connectionInfo.empty")}</div>
          )}
        </section>
      </div>
    </div>
  );
}
