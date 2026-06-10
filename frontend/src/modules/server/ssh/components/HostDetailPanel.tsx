import { DETAIL_TABS } from "../constants";
import type { SshManagerContext } from "../hooks/useSshManager";
import { normalizeSshGroup, sshGroupLabel } from "../../../../lib/sshGroups";
import { useI18n } from "../../../../i18n";
import { ResourceTags } from "../../../../components/ui/ResourceTags";
import { useConnectionStore } from "../../../../stores/connectionStore";
import { parseSshConfig } from "../../panel/serverConnection";
import { useHostOnlineStatus } from "../../../../stores/sshConnectionStore";
import { HostTunnelsDetailTab } from "./detail/HostTunnelsDetailTab";
import { MonitoringDetailTab } from "./detail/MonitoringDetailTab";
import { OverviewDetailTab } from "./detail/OverviewDetailTab";
import { SftpDetailTab } from "./detail/SftpDetailTab";
import { TerminalDetailTab } from "./detail/TerminalDetailTab";

type Props = SshManagerContext;

function HostDetailTags({ resourceId }: { resourceId: string | undefined }) {
  const tags = useConnectionStore(
    (s) => s.connections.find((c) => c.id === resourceId)?.tags,
  );
  return <ResourceTags tags={tags} variant="detail" />;
}

function HostConnectionStatus({ resourceId }: { resourceId: string | undefined }) {
  const { t } = useI18n();
  const status = useHostOnlineStatus(resourceId ?? null);
  const label =
    status === "online"
      ? t("ssh.status.online")
      : status === "connecting"
        ? t("ssh.status.connecting")
        : status === "error"
          ? t("ssh.status.offline")
          : t("ssh.status.unknown");
  const dotClass =
    status === "online" ? "host-status--online" : `host-status--${status}`;
  return (
    <span className={`ssh-detail-status ssh-detail-status--${status}`}>
      <span className={`host-status ${dotClass}`} />
      {label}
    </span>
  );
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

  const connections = useConnectionStore((s) => s.connections);
  const connection = activeResource
    ? connections.find((c) => c.id === activeResource.id)
    : undefined;
  const sshConfig = connection ? parseSshConfig(connection) : null;
  const username = sshConfig?.user ?? profile.username;

  return (
    <div className="ssh-detail">
      <div className="ssh-detail-header">
        <div>
          <div className="host-title">
            {hostName}
            <HostDetailTags resourceId={activeResource?.id} />
          </div>
          <div className="host-addr-detail">
            {username}@{hostAddress}
          </div>
        </div>
        <HostConnectionStatus resourceId={activeResource?.id} />
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
        {detailTab === "tunnels" && (
          <HostTunnelsDetailTab activeResource={activeResource} />
        )}
        {detailTab === "monitoring" && <MonitoringDetailTab activeResource={activeResource} />}
      </div>
    </div>
  );
}