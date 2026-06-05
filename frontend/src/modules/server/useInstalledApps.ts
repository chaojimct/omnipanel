import { useCallback, useEffect, useState } from "react";
import { createOnePanelClient, OnePanelApiError, type OnePanelInstalledApp } from "../../lib/onepanel";
import type { ServerEntry } from "./CreateServerDialog";

function formatError(err: unknown): string {
  if (err instanceof OnePanelApiError) {
    return err.body ? `${err.message}：${err.body}` : err.message;
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const record = err as Record<string, unknown>;
    if (typeof record.message === "string") {
      return typeof record.cause === "string" ? `${record.message}（${record.cause}）` : record.message;
    }
  }
  return String(err);
}

interface UseInstalledAppsResult {
  apps: OnePanelInstalledApp[];
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useInstalledApps(server: ServerEntry | null): UseInstalledAppsResult {
  const [apps, setApps] = useState<OnePanelInstalledApp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!server) {
      setApps([]);
      setTotal(0);
      setError(null);
      return;
    }
    if (server.serviceType !== "1panel") {
      setApps([]);
      setTotal(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const client = createOnePanelClient(server.address, server.key);
      const result = await client.searchInstalledApps({
        page: 1,
        pageSize: 200,
        all: true,
        sync: false,
      });
      setApps(result.items);
      setTotal(result.total);
    } catch (err) {
      setApps([]);
      setTotal(0);
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [server]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { apps, total, loading, error, refresh };
}
