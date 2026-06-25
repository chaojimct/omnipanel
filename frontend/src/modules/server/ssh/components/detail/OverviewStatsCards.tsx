import { resolveResourceById } from "@/stores/connectionStore";
import { MonitoringDashboard } from "../monitoring/MonitoringDashboard";
import type { OverviewStatsCardsProps } from "./OverviewStatsCards.types";
export type { OverviewStatsFallback, OverviewStatsCardsProps } from "./OverviewStatsCards.types";

/** @deprecated 使用 MonitoringDashboard；保留兼容旧引用 */
export function OverviewStatsCards(props: OverviewStatsCardsProps) {
  const resource = props.resourceId ? resolveResourceById(props.resourceId) : null;

  return (
    <MonitoringDashboard
      phase={props.phase}
      stats={props.stats}
      error={props.error}
      hostLabel={props.hostLabel ?? resource?.name ?? props.stats?.hostName}
      hostAddress={props.hostAddress ?? resource?.subtitle}
      updatedAt={props.updatedAt}
      refreshing={props.refreshing}
      onRetry={props.onRetry}
      onRefresh={props.onRefresh}
      compact={props.compact || props.embedded}
      loadingMessage={props.loadingMessage}
    />
  );
}

export { MonitoringDashboard } from "../monitoring/MonitoringDashboard";
