import { useCallback, useEffect } from "react";
import { commands } from "../../../../ipc/bindings";
import { RESOURCE_TAG_KEYS } from "../../../../lib/resourceTags";
import { persistResourceTag } from "../../../../stores/connectionStore";
import { useSshStatsStore } from "../../../../stores/sshStatsStore";
import {
  acquireSshPoolSession,
  releaseSshPoolSession,
} from "../../../../stores/sshPoolSessionStore";
import {
  useHostOverview,
  useSshHostStore,
  type OverviewPhase,
} from "../../../../stores/sshHostStore";

export type { OverviewPhase };

export function useSshOverview(resourceId: string | null) {
  const overview = useHostOverview(resourceId);
  const setOverview = useSshHostStore((s) => s.setOverview);

  const load = useCallback(
    async (opts?: { silent?: boolean; processesOnly?: boolean }) => {
      if (!resourceId) return;

      if (opts?.processesOnly) {
        setOverview(resourceId, { refreshing: true });
        try {
          const result = await commands.sshPoolLoadProcesses(resourceId);
          if (result.status === "ok") {
            setOverview(resourceId, {
              processes: result.data,
              updatedAt: Date.now(),
              refreshing: false,
              error: null,
            });
          } else {
            setOverview(resourceId, {
              error: result.error?.message ?? "加载进程列表失败",
              refreshing: false,
            });
          }
        } catch (e) {
          setOverview(resourceId, {
            error: e instanceof Error ? e.message : String(e),
            refreshing: false,
          });
        }
        return;
      }

      const hasCache = overview.phase === "ready" && overview.stats != null;
      if (!opts?.silent && !hasCache) {
        setOverview(resourceId, { phase: "loading", error: null });
      } else if (opts?.silent || hasCache) {
        setOverview(resourceId, { refreshing: true });
      }

      try {
        const result = await commands.sshPoolLoadOverview(resourceId);
        if (result.status === "ok") {
          useSshStatsStore.getState().setStats([result.data.stats]);
          if (result.data.stats.osInfo?.trim()) {
            void persistResourceTag(
              resourceId,
              RESOURCE_TAG_KEYS.os,
              result.data.stats.osInfo,
            );
          }
          setOverview(resourceId, {
            phase: "ready",
            stats: result.data.stats,
            processes: result.data.processes,
            error: null,
            updatedAt: Date.now(),
            refreshing: false,
          });
        } else {
          setOverview(resourceId, {
            error: result.error?.message ?? "加载概览失败",
            phase: hasCache ? "ready" : "error",
            refreshing: false,
          });
        }
      } catch (e) {
        setOverview(resourceId, {
          error: e instanceof Error ? e.message : String(e),
          phase: hasCache ? "ready" : "error",
          refreshing: false,
        });
      }
    },
    [resourceId, overview.phase, overview.stats, setOverview],
  );

  useEffect(() => {
    if (!resourceId) return;

    const cached = useSshHostStore.getState().getSnapshot(resourceId).overview;
    if (cached.phase === "ready" && cached.stats) {
      useSshStatsStore.getState().setStats([cached.stats]);
    } else {
      setOverview(resourceId, { phase: "loading" });
    }

    void load({ silent: cached.phase === "ready" });
  }, [resourceId, load, setOverview]);

  useEffect(() => {
    if (!resourceId || overview.phase !== "ready") return;
    const interval = setInterval(() => {
      void load({ silent: true });
    }, 30_000);
    return () => clearInterval(interval);
  }, [resourceId, overview.phase, load]);

  useEffect(() => {
    if (!resourceId) return;
    acquireSshPoolSession(resourceId);
    return () => {
      releaseSshPoolSession(resourceId);
    };
  }, [resourceId]);

  const refreshProcesses = useCallback(() => {
    void load({ silent: true, processesOnly: true });
  }, [load]);

  return {
    phase: overview.phase,
    stats: overview.stats,
    processes: overview.processes,
    error: overview.error,
    updatedAt: overview.updatedAt,
    refreshing: overview.refreshing,
    refresh: () => load(),
    refreshProcesses,
  };
}
