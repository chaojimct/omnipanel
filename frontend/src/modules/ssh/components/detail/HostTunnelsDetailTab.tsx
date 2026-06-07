import { useState } from "react";
import { useI18n } from "../../../../i18n";
import { Button } from "../../../../components/ui/Button";

type TunnelEntry = {
  id: string;
  local: string;
  remote: string;
  bind: "ipv4" | "ipv6";
  command: string;
};

const SEED_TUNNELS: TunnelEntry[] = [
  { id: "1", local: "0.0.0.0:5432", remote: "10.0.1.10:5432", bind: "ipv4", command: "ssh -L 0.0.0.0:5432:10.0.1.10:5432 deploy@prod-web-01" },
  { id: "2", local: "::1:6379", remote: "10.0.1.10:6379", bind: "ipv6", command: "ssh -L [::1]:6379:10.0.1.10:6379 deploy@prod-web-01" },
  { id: "3", local: "0.0.0.0:8080", remote: "10.0.1.11:80", bind: "ipv4", command: "ssh -L 0.0.0.0:8080:10.0.1.11:80 deploy@staging-01" },
];

export function HostTunnelsDetailTab() {
  const { t } = useI18n();
  const [tunnels, setTunnels] = useState<TunnelEntry[]>(SEED_TUNNELS);
  const [showCreate, setShowCreate] = useState(false);
  const [localAddr, setLocalAddr] = useState("");
  const [localPort, setLocalPort] = useState("");
  const [remoteAddr, setRemoteAddr] = useState("");
  const [remotePort, setRemotePort] = useState("");

  const handleDelete = (id: string) => {
    setTunnels((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreate = () => {
    const lp = localPort || "0";
    const rp = remotePort || "0";
    const la = localAddr || "0.0.0.0";
    const ra = remoteAddr || "10.0.0.1";
    const id = `tun-${Date.now()}`;
    const bind: "ipv4" | "ipv6" = la.includes(":") ? "ipv6" : "ipv4";
    const command = `ssh -L ${la}:${lp}:${ra}:${rp} deploy@host`;
    setTunnels((prev) => [...prev, { id, local: `${la}:${lp}`, remote: `${ra}:${rp}`, bind, command }]);
    setShowCreate(false);
    setLocalAddr("");
    setLocalPort("");
    setRemoteAddr("");
    setRemotePort("");
  };

  return (
    <div className="tunnel-panel">
      <div className="tunnel-header">
        <span className="tunnel-label">{t("ssh.tunnels.label")}</span>
        <Button variant="icon" onClick={() => setShowCreate(!showCreate)} title={t("ssh.tunnels.create")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </Button>
      </div>
      {showCreate && (
        <div className="tunnel-create">
          <input className="input input-sm" placeholder="Local address" value={localAddr} onChange={(e) => setLocalAddr(e.target.value)} />
          <input className="input input-sm" placeholder="Local port" value={localPort} onChange={(e) => setLocalPort(e.target.value)} />
          <input className="input input-sm" placeholder="Remote address" value={remoteAddr} onChange={(e) => setRemoteAddr(e.target.value)} />
          <input className="input input-sm" placeholder="Remote port" value={remotePort} onChange={(e) => setRemotePort(e.target.value)} />
          <Button variant="primary" size="sm" onClick={handleCreate}>{t("ssh.tunnels.create")}</Button>
        </div>
      )}
      <div className="tunnel-list">
        {tunnels.length === 0 && <div className="empty-state compact">{t("ssh.tunnels.empty")}</div>}
        {tunnels.map((tunnel) => (
          <div key={tunnel.id} className="tunnel-item">
            <div className="tunnel-item-main">
              <span className={`tunnel-bind-badge ${tunnel.bind}`}>{tunnel.bind.toUpperCase()}</span>
              <span className="tunnel-endpoint">{tunnel.local}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              <span className="tunnel-endpoint">{tunnel.remote}</span>
            </div>
            <code className="tunnel-command">{tunnel.command}</code>
            <button className="tunnel-delete-btn" onClick={() => handleDelete(tunnel.id)} title={t("ssh.tunnels.delete")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}