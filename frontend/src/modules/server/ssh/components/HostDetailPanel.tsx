import { DETAIL_TABS } from "../constants";
import type { SshManagerContext } from "../hooks/useSshManager";
import { normalizeSshGroup, sshGroupLabel } from "../../../../lib/sshGroups";
import { useSshStats } from "../../../../stores/sshStatsStore";
import { HostTunnelsDetailTab } from "./detail/HostTunnelsDetailTab";
import { MonitoringDetailTab } from "./detail/MonitoringDetailTab";
import { OverviewDetailTab } from "./detail/OverviewDetailTab";
import { SftpDetailTab } from "./detail/SftpDetailTab";
import { TerminalDetailTab } from "./detail/TerminalDetailTab";

type Props = SshManagerContext;

function HostOsTag({ resourceId }: { resourceId: string | undefined }) {
  const stats = useSshStats(resourceId ?? null);
  if (!stats?.osInfo) return null;
  return <span className="host-os-tag-detail">{stats.osInfo}</span>;
}

export function HostDetailPanel(ctx: Props) {
  const {
    t,
    detailTab,
    setDetailTab,
    activeResource,
    profile,
    hostAddress,
    hostName,
  } = ctx;

  return (
    <div className="ssh-detail">
      <div className="ssh-detail-header">
        <div>
          <div className="host-title">
            {hostName}
            <HostOsTag resourceId={activeResource?.id} />
          </div>
          <div className="host-addr-detail">
            {profile.username}@{hostAddress}
          </div>
        </div>
        {activeResource && (
          <span className="badge badge-muted">
            {sshGroupLabel(normalizeSshGroup(activeResource.group), t)}
          </span>
        )}
      </div>

      <div className="ssh-detail-tabs">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`ssh-detail-tab${detailTab === tab ? " active" : ""}`}
            onClick={() => setDetailTab(tab)}
          >
            {t(`ssh.detailTabs.${tab}`)}
          </button>
        ))}
      </div>

      <div
        className={`ssh-detail-body${
          detailTab === "terminal"
            ? " ssh-detail-body--terminal"
            : detailTab === "overview"
              ? " ssh-detail-body--overview"
              : ""
        }`}
      >
        {detailTab === "overview" && <OverviewDetailTab {...ctx} />}
        <div
          className="ssh-terminal-tab-slot"
          hidden={detailTab !== "terminal"}
        >
          <TerminalDetailTab
            activeResource={activeResource}
            detailTabActive={detailTab === "terminal"}
          />
        </div>
        {detailTab === "sftp" && <SftpDetailTab activeResource={activeResource} />}
        {detailTab === "tunnels" && <HostTunnelsDetailTab />}
        {detailTab === "monitoring" && <MonitoringDetailTab activeResource={activeResource} />}
      </div>
    </div>
  );
}