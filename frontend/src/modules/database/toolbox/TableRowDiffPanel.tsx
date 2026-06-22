import { useI18n } from "../../../i18n";
import { DataLoading } from "../../../components/ui/DataLoading";
import type { DbColumnMeta } from "../api";
import type { DataAnalysisResult } from "./types";

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export function TableRowDiffPanel({
  tableName,
  analysis,
  columns,
}: {
  tableName: string;
  analysis?: DataAnalysisResult;
  columns: DbColumnMeta[];
}) {
  const { t } = useI18n();

  if (!analysis || analysis.status === "unchecked") {
    return (
      <div className="db-toolbox-row-diff-panel db-toolbox-row-diff-panel--empty">
        {t("database.toolbox.side.rowDiffPending")}
      </div>
    );
  }

  if (analysis.status === "analyzing") {
    return (
      <div className="db-toolbox-row-diff-panel db-toolbox-row-diff-panel--loading">
        <DataLoading total={1} current={0} message={t("database.toolbox.side.analysisAnalyzing")} />
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <div className="db-toolbox-row-diff-panel db-toolbox-row-diff-panel--error">
        {analysis.error ?? t("database.toolbox.side.analysisError")}
      </div>
    );
  }

  if (analysis.status === "match" || !analysis.diffs || analysis.diffs.length === 0) {
    return (
      <div className="db-toolbox-row-diff-panel db-toolbox-row-diff-panel--empty">
        {t("database.toolbox.side.rowDiffNoDetail", { table: tableName })}
      </div>
    );
  }

  const columnNames = columns.map((col) => col.name);

  return (
    <div className="db-toolbox-row-diff-panel">
      {analysis.truncated && (
        <p className="db-toolbox-row-diff-panel__hint">
          {t("database.toolbox.side.rowDiffTruncated", {
            shown: analysis.diffs.length,
            total: analysis.diffRows ?? analysis.diffs.length,
          })}
        </p>
      )}
      <div className="db-toolbox-row-diff-scroll">
        <table className="db-toolbox-row-diff-table">
          <thead>
            <tr>
              <th>{t("database.toolbox.side.rowDiffKey")}</th>
              <th>{t("database.toolbox.side.rowDiffKind")}</th>
              {columnNames.map((name) => (
                <th key={name}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.diffs.map((diff) => {
              const kindLabel =
                diff.kind === "changed"
                  ? t("database.toolbox.side.rowDiffChanged")
                  : diff.kind === "sourceOnly"
                    ? t("database.toolbox.side.rowDiffSourceOnly")
                    : t("database.toolbox.side.rowDiffTargetOnly");

              return (
                <tr
                  key={diff.rowKey}
                  className={`db-toolbox-row-diff-row db-toolbox-row-diff-row--${diff.kind}`}
                >
                  <td className="db-toolbox-row-diff-key">{diff.displayKey}</td>
                  <td>
                    <span className={`db-toolbox-row-diff-kind db-toolbox-row-diff-kind--${diff.kind}`}>
                      {kindLabel}
                    </span>
                  </td>
                  {columnNames.map((colName) => {
                    const isChanged = diff.changedFields?.includes(colName) ?? false;
                    const sourceVal = diff.sourceRow?.[colName];
                    const targetVal = diff.targetRow?.[colName];
                    let cellText: string;
                    if (diff.kind === "changed" && isChanged) {
                      cellText = `${formatCellValue(sourceVal)} → ${formatCellValue(targetVal)}`;
                    } else if (diff.kind === "sourceOnly") {
                      cellText = formatCellValue(sourceVal);
                    } else if (diff.kind === "targetOnly") {
                      cellText = formatCellValue(targetVal);
                    } else {
                      cellText = formatCellValue(sourceVal ?? targetVal);
                    }

                    return (
                      <td
                        key={colName}
                        className={isChanged ? "db-toolbox-row-diff-cell--conflict" : undefined}
                        title={cellText}
                      >
                        {cellText}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
