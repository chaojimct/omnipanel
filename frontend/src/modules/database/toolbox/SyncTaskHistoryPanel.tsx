import { useMemo } from "react";
import { useI18n } from "../../../i18n";
import { useDbSyncTaskStore } from "../../../stores/dbSyncTaskStore";
import type { SyncTaskRunRecord, SyncTaskRunStatus } from "./types";

const EMPTY_RUNS: SyncTaskRunRecord[] = [];

interface SyncTaskHistoryPanelProps {
  taskId: string | null;
  taskName: string;
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

function statusClass(status: SyncTaskRunStatus): string {
  return `db-sync-run-status db-sync-run-status--${status}`;
}

export function SyncTaskHistoryPanel({ taskId, taskName }: SyncTaskHistoryPanelProps) {
  const { t } = useI18n();
  const runs = useDbSyncTaskStore((s) =>
    taskId ? (s.runHistory[taskId] ?? EMPTY_RUNS) : EMPTY_RUNS,
  );

  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => b.startedAt - a.startedAt),
    [runs],
  );

  const statusLabel = (status: SyncTaskRunStatus) => {
    const key = `shell.backgroundTasks.status${status.charAt(0).toUpperCase()}${status.slice(1)}` as
      | "shell.backgroundTasks.statusPending"
      | "shell.backgroundTasks.statusRunning"
      | "shell.backgroundTasks.statusCompleted"
      | "shell.backgroundTasks.statusFailed"
      | "shell.backgroundTasks.statusCancelled";
    return t(key);
  };

  const kindLabel = (kind: SyncTaskRunRecord["kind"]) =>
    kind === "dataSync" ? t("database.syncTasks.kindData") : t("database.syncTasks.kindSchema");

  if (!taskId) {
    return (
      <div className="db-sync-run-history">
        <p className="db-sync-run-history__empty">{t("database.toolbox.historyNoTask")}</p>
      </div>
    );
  }

  if (sortedRuns.length === 0) {
    return (
      <div className="db-sync-run-history">
        <p className="db-sync-run-history__empty">
          {t("database.toolbox.historyEmpty", { name: taskName })}
        </p>
      </div>
    );
  }

  return (
    <div className="db-sync-run-history">
      <ul className="db-sync-run-history__list">
        {sortedRuns.map((run) => (
          <li key={run.id} className="db-sync-run-history__item">
            <div className="db-sync-run-history__item-head">
              <span className={statusClass(run.status)}>{statusLabel(run.status)}</span>
              <span className="db-sync-run-history__kind">{kindLabel(run.kind)}</span>
              <span className="db-sync-run-history__tables">
                {t("database.syncTasks.tableCount", { count: run.tableCount })}
              </span>
            </div>
            <div className="db-sync-run-history__item-meta">
              <span>{t("database.toolbox.historyStartedAt")}: {formatTimestamp(run.startedAt)}</span>
              {run.finishedAt != null ? (
                <span>
                  {t("database.toolbox.historyFinishedAt")}: {formatTimestamp(run.finishedAt)}
                </span>
              ) : null}
            </div>
            {run.progress?.trim() ? (
              <p className="db-sync-run-history__progress">{run.progress}</p>
            ) : null}
            {run.error ? <p className="db-sync-run-history__error">{run.error}</p> : null}
            {run.tableNames.length > 0 ? (
              <p className="db-sync-run-history__table-names" title={run.tableNames.join(", ")}>
                {run.tableNames.join(", ")}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
