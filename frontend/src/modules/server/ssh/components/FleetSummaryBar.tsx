import { useMemo, useState } from "react";
import { useI18n } from "../../../../i18n";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { commands } from "../../../../ipc/bindings";
import { useSshFleetStats } from "../hooks/useSshFleetStats";
import { useSshSelectionStore } from "../stores/sshSelectionStore";

type Props = {
  resources: WorkspaceResource[];
  onOpenBatch: () => void;
};

export function FleetSummaryBar({ resources, onOpenBatch }: Props) {
  const { t } = useI18n();
  const stats = useSshFleetStats(resources);
  const selectionMode = useSshSelectionStore((s) => s.selectionMode);
  const selectedIds = useSshSelectionStore((s) => s.selectedIds);
  const setSelectionMode = useSshSelectionStore((s) => s.setSelectionMode);
  const selectAll = useSshSelectionStore((s) => s.selectAll);
  const clearSelection = useSshSelectionStore((s) => s.clearSelection);
  const [probing, setProbing] = useState(false);

  const allIds = useMemo(() => resources.map((r) => r.id), [resources]);

  async function handleProbeAll() {
    setProbing(true);
    try {
      await commands.sshPoolProbeAll();
    } finally {
      setProbing(false);
    }
  }

  function handleExport() {
    const lines = resources.map(
      (r) => `${r.name}\t${r.subtitle}\t${r.environment}\t${r.status}`,
    );
    const blob = new Blob([["名称\t地址\t环境\t状态", ...lines].join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ssh-hosts-${new Date().toISOString().slice(0, 10)}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="ssh-fleet-bar">
      <div className="ssh-fleet-bar__stats">
        <span className="ssh-fleet-bar__stat">
          {t("ssh.fleet.total", { count: stats.total })}
        </span>
        <span className="ssh-fleet-bar__stat ssh-fleet-bar__stat--ok">
          {t("ssh.fleet.online", { count: stats.online })}
        </span>
        <span className="ssh-fleet-bar__stat ssh-fleet-bar__stat--off">
          {t("ssh.fleet.offline", { count: stats.offline })}
        </span>
        {stats.warning > 0 && (
          <span className="ssh-fleet-bar__stat ssh-fleet-bar__stat--warn">
            {t("ssh.fleet.warning", { count: stats.warning })}
          </span>
        )}
        {stats.monitoring > 0 && (
          <span className="ssh-fleet-bar__stat">
            {t("ssh.fleet.monitoring", { count: stats.monitoring })}
          </span>
        )}
      </div>
      <div className="ssh-fleet-bar__actions">
        <button
          type="button"
          className="ssh-fleet-bar__btn"
          disabled={probing || resources.length === 0}
          onClick={() => void handleProbeAll()}
        >
          {probing ? t("ssh.fleet.probing") : t("ssh.fleet.probeAll")}
        </button>
        <button
          type="button"
          className={`ssh-fleet-bar__btn${selectionMode ? " active" : ""}`}
          onClick={() => {
            if (selectionMode) {
              clearSelection();
            } else {
              setSelectionMode(true);
            }
          }}
        >
          {selectionMode ? t("ssh.fleet.exitSelect") : t("ssh.fleet.multiSelect")}
        </button>
        {selectionMode && (
          <>
            <button
              type="button"
              className="ssh-fleet-bar__btn"
              onClick={() => selectAll(allIds)}
            >
              {t("ssh.fleet.selectAll")}
            </button>
            <button
              type="button"
              className="ssh-fleet-bar__btn ssh-fleet-bar__btn--accent"
              disabled={selectedIds.length === 0}
              onClick={onOpenBatch}
            >
              {t("ssh.fleet.batchRun", { count: selectedIds.length })}
            </button>
          </>
        )}
        <button type="button" className="ssh-fleet-bar__btn" onClick={handleExport}>
          {t("ssh.fleet.export")}
        </button>
      </div>
    </div>
  );
}
