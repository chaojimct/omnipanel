import { useState } from "react";
import { commands } from "../../../../ipc/bindings";
import type { SshTunnelInfo } from "../../../../ipc/bindings";
import { useI18n } from "../../../../i18n";

type Props = {
  tunnels: SshTunnelInfo[];
  hostNameById?: Map<string, string>;
  onClose?: (tunnelId: string) => void;
  compact?: boolean;
};

export function TunnelFlowList({ tunnels, hostNameById, onClose, compact = false }: Props) {
  const { t } = useI18n();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (tunnels.length === 0) {
    return (
      <div className="ssh-tunnel-flow ssh-tunnel-flow--empty">
        {t("ssh.tunnels.empty")}
      </div>
    );
  }

  async function handleClose(tunnelId: string) {
    if (onClose) {
      onClose(tunnelId);
      return;
    }
    setBusyId(tunnelId);
    try {
      await commands.sshCloseTunnel(tunnelId);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={`ssh-tunnel-flow${compact ? " ssh-tunnel-flow--compact" : ""}`}>
      {tunnels.map((tunnel) => {
        const active = tunnel.status === "active" || tunnel.status === "running";
        const hostLabel = hostNameById?.get(tunnel.connectionId) ?? tunnel.connectionId;
        return (
          <div key={tunnel.id} className={`ssh-tunnel-flow__item${active ? " active" : ""}`}>
            <div className="ssh-tunnel-flow__track">
              <div className="ssh-tunnel-flow__node ssh-tunnel-flow__node--local">
                <span className="ssh-tunnel-flow__node-label">{t("ssh.tunnels.flowLocal")}</span>
                <span className="ssh-tunnel-flow__port">:{tunnel.localPort}</span>
              </div>
              <div className="ssh-tunnel-flow__arrow" aria-hidden>
                <span className={`ssh-tunnel-flow__line${active ? " live" : ""}`} />
                <span className="ssh-tunnel-flow__type">{tunnel.tunnelType.toUpperCase()}</span>
              </div>
              <div className="ssh-tunnel-flow__node ssh-tunnel-flow__node--remote">
                <span className="ssh-tunnel-flow__node-label">{hostLabel}</span>
                <span className="ssh-tunnel-flow__port">
                  {tunnel.remoteHost}:{tunnel.remotePort}
                </span>
              </div>
            </div>
            <div className="ssh-tunnel-flow__meta">
              <span className={`badge ${active ? "badge-success" : "badge-muted"}`}>
                {active ? t("ssh.tunnels.active") : t("ssh.tunnels.closed")}
              </span>
              <button
                type="button"
                className="ssh-tunnel-flow__close"
                disabled={busyId === tunnel.id}
                onClick={() => void handleClose(tunnel.id)}
              >
                {t("ssh.tunnels.delete")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
