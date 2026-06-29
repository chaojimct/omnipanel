import { useMemo, useState } from "react";
import { useI18n } from "../../../../i18n";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { useSshBatchCommand } from "../hooks/useSshBatchCommand";
import { useSshSelectionStore } from "../stores/sshSelectionStore";

const PRESET_COMMANDS = [
  "uptime",
  "df -h",
  "free -h",
  "docker ps --format 'table {{.Names}}\\t{{.Status}}'",
  "systemctl --failed --no-pager",
];

type Props = {
  resources: WorkspaceResource[];
  onClose?: () => void;
};

export function BatchCommandPanel({ resources, onClose }: Props) {
  const { t } = useI18n();
  const selectedIds = useSshSelectionStore((s) => s.selectedIds);
  const { running, results, runBatch, reset } = useSshBatchCommand();
  const [command, setCommand] = useState("uptime");

  const selectedHosts = useMemo(
    () => resources.filter((r) => selectedIds.includes(r.id)),
    [resources, selectedIds],
  );

  const summary = useMemo(() => {
    const ok = results.filter((r) => r.status === "success").length;
    const fail = results.filter((r) => r.status === "error").length;
    return { ok, fail, total: results.length };
  }, [results]);

  return (
    <div className="ssh-batch-panel">
      <div className="ssh-batch-panel__header">
        <div>
          <h2 className="ssh-batch-panel__title">{t("ssh.batch.title")}</h2>
          <p className="ssh-batch-panel__subtitle">
            {t("ssh.batch.subtitle", { count: selectedHosts.length })}
          </p>
        </div>
        {onClose && (
          <button type="button" className="ssh-batch-panel__close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="ssh-batch-panel__composer">
        <textarea
          className="input ssh-batch-panel__input"
          rows={3}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={t("ssh.batch.placeholder")}
          disabled={running}
        />
        <div className="ssh-batch-panel__presets">
          {PRESET_COMMANDS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="ssh-batch-panel__preset"
              disabled={running}
              onClick={() => setCommand(preset)}
            >
              {preset.split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="ssh-batch-panel__actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={running || !command.trim() || selectedHosts.length === 0}
            onClick={() => void runBatch(selectedHosts, command)}
          >
            {running ? t("ssh.batch.running") : t("ssh.batch.run")}
          </button>
          {results.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={reset}>
              {t("ssh.batch.clear")}
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="ssh-batch-panel__summary">
          {t("ssh.batch.summary", {
            ok: summary.ok,
            fail: summary.fail,
            total: summary.total,
          })}
        </div>
      )}

      <div className="ssh-batch-panel__results">
        {(results.length > 0 ? results : selectedHosts.map((h) => ({
          hostId: h.id,
          hostName: h.name,
          status: "pending" as const,
        }))).map((row) => (
          <div key={row.hostId} className={`ssh-batch-result ssh-batch-result--${row.status}`}>
            <div className="ssh-batch-result__head">
              <span className="ssh-batch-result__name">{row.hostName}</span>
              <span className="ssh-batch-result__status">
                {t(`ssh.batch.status.${row.status}`)}
                {"durationMs" in row && row.durationMs != null ? ` · ${row.durationMs}ms` : ""}
              </span>
            </div>
            {"output" in row && row.output && (
              <pre className="ssh-batch-result__output">
                {row.output.stdout || row.output.stderr || `exit ${row.output.exitCode}`}
              </pre>
            )}
            {"error" in row && row.error && (
              <pre className="ssh-batch-result__output ssh-batch-result__output--error">
                {row.error}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
