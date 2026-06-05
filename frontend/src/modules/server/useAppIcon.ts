import { useEffect, useMemo, useState } from "react";
import { createOnePanelClient, type OnePanelInstalledApp } from "../../lib/onepanel";
import type { ServerEntry } from "./CreateServerDialog";
import { resolveFallbackAppIconUrl } from "./appIcon";

const iconCache = new Map<string, string>();

function cacheKey(host: string, apiKey: string, appKey: string): string {
  return `${host}::${apiKey}::${appKey}`;
}

export function useAppIcon(server: ServerEntry, app: OnePanelInstalledApp) {
  const fallback = useMemo(
    () => resolveFallbackAppIconUrl(server.address, app),
    [server.address, app],
  );
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let blobUrl: string | null = null;
    let cancelled = false;

    const appKey = app.appKey?.trim();
    if (server.serviceType !== "1panel" || !appKey) {
      setIconUrl(fallback);
      setLoading(false);
      return;
    }

    const key = cacheKey(server.address, server.key, appKey);
    const cached = iconCache.get(key);
    if (cached) {
      setIconUrl(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIconUrl(null);

    const client = createOnePanelClient(server.address, server.key);
    void client
      .getAppIconDataUrl(appKey)
      .then((url) => {
        if (cancelled) {
          if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          return;
        }
        if (url.startsWith("blob:")) blobUrl = url;
        iconCache.set(key, url);
        setIconUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setIconUrl(fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [server.address, server.key, server.serviceType, app.appKey, fallback]);

  return {
    iconUrl: iconUrl ?? fallback,
    loading,
  };
}
