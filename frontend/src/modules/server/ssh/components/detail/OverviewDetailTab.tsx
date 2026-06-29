import { useSshOverview } from "@/modules/server/ssh/hooks/useSshOverview";
import type { SshManagerContext } from "@/modules/server/ssh/hooks/useSshManager";
import type { LaunchPreset } from "@/modules/server/ssh/types";
import type { SshHostContext } from "@/modules/server/ssh/hooks/useSshHostContext";
import { MonitoringDashboard } from "@/modules/server/ssh/components/monitoring/MonitoringDashboard";
import { HostLaunchPresets } from "@/modules/server/ssh/components/HostLaunchPresets";
import { HostOrchestrationBar } from "@/modules/server/ssh/components/HostOrchestrationBar";
import { ProcessListPanel } from "./ProcessListPanel";

type Props = Pick<SshManagerContext, "activeResource" | "setDetailTab"> & {
  hostContext: SshHostContext;
  presets: LaunchPreset[];
  onRunPreset: (preset: LaunchPreset) => void;
};

export function OverviewDetailTab({
  activeResource,
  hostContext,
  presets,
  onRunPreset,
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
      {activeResource && (
        <HostOrchestrationBar resource={activeResource} context={hostContext} />
      )}
      <HostLaunchPresets presets={presets} onRunPreset={onRunPreset} variant="inline" />
      <MonitoringDashboard
        phase={phase}
        stats={stats}
        error={error}
        updatedAt={updatedAt}
        refreshing={refreshing}
        processCount={processes.length}
        hideStatusBar
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
