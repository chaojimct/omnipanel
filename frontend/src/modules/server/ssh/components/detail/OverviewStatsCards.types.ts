import type { OverviewPhase } from "@/modules/server/ssh/hooks/useSshOverview";
import type { HostSystemStats } from "@/stores/sshStatsStore";

export type OverviewStatsFallback = {
  cpu?: string;
  memory?: string;
  disk?: string;
  gpu?: string;
};

export type OverviewStatsCardsProps = {
  phase: OverviewPhase;
  stats: HostSystemStats | null;
  error: string | null;
  fallback?: OverviewStatsFallback;
  onRetry?: () => void;
  onRefresh?: () => void;
  compact?: boolean;
  embedded?: boolean;
  loadingMessage?: string;
  hostLabel?: string;
  hostAddress?: string;
  resourceId?: string | null;
  updatedAt?: number | null;
  refreshing?: boolean;
};
