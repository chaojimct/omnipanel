import { useCallback, useEffect, useState } from "react";

export interface UseActiveResourceSelectionOptions<T extends { id: string }> {
  storageKey: string;
  resources: T[];
  defaultId?: string | null;
}

/**
 * B 类模块：侧栏单选资源，替代连接/主机级多 Tab Dock。
 */
export function useActiveResourceSelection<T extends { id: string }>({
  storageKey,
  resources,
  defaultId = null,
}: UseActiveResourceSelectionOptions<T>) {
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved || defaultId;
    } catch {
      return defaultId;
    }
  });

  useEffect(() => {
    if (activeId && resources.some((r) => r.id === activeId)) return;
    const fallback = resources[0]?.id ?? defaultId ?? null;
    setActiveIdState(fallback);
  }, [activeId, resources, defaultId]);

  const setActiveId = useCallback(
    (id: string | null) => {
      setActiveIdState(id);
      try {
        if (id) localStorage.setItem(storageKey, id);
        else localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    },
    [storageKey],
  );

  const activeResource = resources.find((r) => r.id === activeId) ?? null;

  return { activeId, setActiveId, activeResource };
}
