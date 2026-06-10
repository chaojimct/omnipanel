import { useI18n } from "../../../../i18n";
import {
  hostStatusDotClass,
  useHostConnectionIndicatorStatus,
  useHostReachabilityStatus,
} from "../../../../stores/sshConnectionStore";

type Props = {
  resourceId: string | null | undefined;
  showLabel?: boolean;
  className?: string;
};

export function HostStatusIndicator({ resourceId, showLabel = false, className }: Props) {
  const { t } = useI18n();
  const status = useHostConnectionIndicatorStatus(resourceId ?? null);
  const reachability = useHostReachabilityStatus(resourceId ?? null);
  const label =
    status === "online"
      ? t("ssh.status.online")
      : status === "connecting"
        ? t("ssh.status.connecting")
        : status === "offline"
          ? t("ssh.status.offline")
          : t("ssh.status.unknown");
  const reachabilityHint =
    reachability === "online"
      ? t("ssh.status.reachable")
      : reachability === "offline"
        ? t("ssh.status.unreachable")
        : null;
  const title = reachabilityHint ? `${label} · ${reachabilityHint}` : label;

  const dotClass = hostStatusDotClass(status);
  const connectingClass = status === "connecting" ? " host-status--pulse" : "";

  if (showLabel) {
    return (
      <span className={`ssh-detail-status ssh-detail-status--${status}${className ? ` ${className}` : ""}`}>
        <span className={`host-status ${dotClass}${connectingClass}`} title={title} aria-label={label} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={`host-status ${dotClass}${connectingClass}${className ? ` ${className}` : ""}`}
      title={title}
      aria-label={label}
    />
  );
}
