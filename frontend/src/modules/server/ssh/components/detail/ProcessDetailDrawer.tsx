import { useMemo, useState } from "react";
import { Button } from "../../../../../components/ui/Button";
import { useI18n } from "../../../../../i18n";
import { commands, type SshProcessInfo, type SshProcessPort } from "../../../../../ipc/bindings";
import { formatBytes } from "../../../../../stores/sshStatsStore";
import {
  navigateToSftpPath,
  navigateToTerminalPath,
} from "../../../../../stores/sshDetailNavigationStore";
import type { DetailTab } from "../../types";
import { parsePathsFromCommand } from "../../utils/parseCommandPaths";

type Props = {
  resourceId: string | null;
  process: SshProcessInfo | null;
  setDetailTab: (tab: DetailTab) => void;
  onClose: () => void;
  onKilled: () => void;
  onPortClick?: (port: SshProcessPort) => void;
};

export function ProcessDetailDrawer({
  resourceId,
  process,
  setDetailTab,
  onClose,
  onKilled,
  onPortClick,
}: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmKill, setConfirmKill] = useState(false);

  const paths = useMemo(
    () => (process ? parsePathsFromCommand(process.command) : []),
    [process],
  );

  const open = process != null;

  async function handleForceKill() {
    if (!resourceId || !process) return;
    setBusy(true);
    setError(null);
    try {
      const res = await commands.sshPoolKillProcess(resourceId, process.pid, 9);
      if (res.status === "ok") {
        setConfirmKill(false);
        onKilled();
        onClose();
      } else {
        setError(res.error.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function handleOpenSftp(path: string) {
    if (!resourceId) return;
    navigateToSftpPath(resourceId, path, setDetailTab);
    onClose();
  }

  function handleOpenTerminal(path: string) {
    if (!resourceId) return;
    navigateToTerminalPath(resourceId, path, setDetailTab);
    onClose();
  }

  return (
    <>
      <div
        className={`drawer-overlay${open ? " show" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`drawer ssh-process-drawer${open ? " show" : ""}`}
        role="dialog"
        aria-label={t("ssh.processDetail.title")}
        aria-hidden={!open}
      >
        {open && process && (
          <>
            <header className="drawer-header">
              <div>
                <div className="ssh-process-drawer-eyebrow">{t("ssh.processDetail.title")}</div>
                <h2 className="ssh-process-drawer-title">
                  PID {process.pid}
                  <span className="ssh-process-drawer-user">{process.user}</span>
                </h2>
              </div>
              <Button variant="icon" onClick={onClose} title={t("ssh.keys.cancel")}>
                ×
              </Button>
            </header>
            <div className="drawer-body ssh-process-drawer-body">
              <section className="ssh-process-drawer-section">
                <h4>{t("ssh.processDetail.basic")}</h4>
                <dl className="drawer-kv">
                  <dt>{t("ssh.processList.pid")}</dt>
                  <dd>{process.pid}</dd>
                  <dt>{t("ssh.processList.user")}</dt>
                  <dd>{process.user}</dd>
                  <dt>{t("ssh.processList.cpu")}</dt>
                  <dd>{process.cpu?.toFixed(1) ?? "—"}%</dd>
                  <dt>{t("ssh.processList.mem")}</dt>
                  <dd>{process.mem?.toFixed(1) ?? "—"}%</dd>
                  <dt>{t("ssh.processList.vsz")}</dt>
                  <dd>{process.vsz != null ? formatBytes(process.vsz) : "—"}</dd>
                  <dt>{t("ssh.processList.rss")}</dt>
                  <dd>{process.rss != null ? formatBytes(process.rss * 1024) : "—"}</dd>
                  <dt>{t("ssh.processList.stat")}</dt>
                  <dd>{process.stat}</dd>
                  <dt>{t("ssh.processList.start")}</dt>
                  <dd>{process.start}</dd>
                  <dt>{t("ssh.processList.time")}</dt>
                  <dd>{process.time}</dd>
                </dl>
              </section>
              <section className="ssh-process-drawer-section">
                <h4>{t("ssh.processList.command")}</h4>
                <pre className="ssh-process-drawer-cmd">{process.command}</pre>
              </section>
              <section className="ssh-process-drawer-section">
                <h4>{t("ssh.processDetail.files")}</h4>
                {paths.length === 0 ? (
                  <p className="text-muted text-sm">{t("ssh.processDetail.noFiles")}</p>
                ) : (
                  <ul className="ssh-process-drawer-files">
                    {paths.map((path) => (
                      <li key={path} className="ssh-process-drawer-file">
                        <button
                          type="button"
                          className="ssh-process-drawer-file-path"
                          title={t("ssh.processDetail.openSftp")}
                          onClick={() => handleOpenSftp(path)}
                        >
                          {path}
                        </button>
                        <div className="ssh-process-drawer-file-actions">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenSftp(path)}
                          >
                            SFTP
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenTerminal(path)}
                          >
                            {t("ssh.detailTabs.terminal")}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="ssh-process-drawer-section">
                <h4>{t("ssh.processList.ports")}</h4>
                {(process.ports ?? []).length === 0 ? (
                  <p className="text-muted text-sm">{t("ssh.processDetail.noPorts")}</p>
                ) : (
                  <ul className="ssh-process-drawer-ports">
                    {(process.ports ?? []).map((port, idx) => (
                      <li key={`${port.localPort}-${idx}`}>
                        <button
                          type="button"
                          className="proc-port-badge"
                          title={t("ssh.processList.createTunnel")}
                          onClick={() => onPortClick?.(port)}
                        >
                          :{port.localPort}
                        </button>
                        <span className="text-muted text-sm">
                          {port.protocol.toUpperCase()} · {port.localAddress} · {port.state}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {error && <div className="proc-error">{error}</div>}
            </div>
            <footer className="ssh-process-drawer-footer">
              {!confirmKill ? (
                <Button variant="danger" onClick={() => setConfirmKill(true)}>
                  {t("ssh.processDetail.forceKill")}
                </Button>
              ) : (
                <div className="ssh-process-drawer-confirm">
                  <p>{t("ssh.processDetail.killConfirm", { pid: process.pid })}</p>
                  <div className="ssh-process-drawer-confirm-actions">
                    <Button variant="danger" disabled={busy} onClick={() => void handleForceKill()}>
                      {busy ? t("ssh.processDetail.killing") : t("ssh.processDetail.confirmKill")}
                    </Button>
                    <Button variant="secondary" disabled={busy} onClick={() => setConfirmKill(false)}>
                      {t("ssh.keys.cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
