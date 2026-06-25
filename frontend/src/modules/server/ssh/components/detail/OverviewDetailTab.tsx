import { useSshOverview } from "@/modules/server/ssh/hooks/useSshOverview";
import type { SshManagerContext } from "@/modules/server/ssh/hooks/useSshManager";
import { MonitoringDashboard } from "@/modules/server/ssh/components/monitoring/MonitoringDashboard";
import { ProcessListPanel } from "./ProcessListPanel";

type Props = Pick<
  SshManagerContext,
  "profile" | "activeResource" | "setDetailTab"
>;

export function OverviewDetailTab({
  activeResource,
  setDetailTab,
}: Props) {
  const resourceId = activeResource?.id ?? null;
  const {
    phase,
    stats,
    processes,
    error,
    updatedAt,
    refreshing,
    refreshProcesses,
    refresh,
  } = useSshOverview(resourceId);

  return (
    <div className="ssh-ov-page">
      <MonitoringDashboard
        phase={phase}
        stats={stats}
        error={error}
        hostLabel={activeResource?.name}
        hostAddress={activeResource?.subtitle}
        updatedAt={updatedAt}
        refreshing={refreshing}
        processCount={processes.length}
        onRetry={() => refresh()}
        onRefresh={() => refresh()}
      >
        <ProcessListPanel
          resourceId={resourceId}
          processes={processes}
          loading={refreshing}
          refreshing={refreshing}
          updatedAt={updatedAt}
          setDetailTab={setDetailTab}
          onRefresh={refreshProcesses}
          variant="monitor"
        />
      </MonitoringDashboard>
    </div>
  );
}
