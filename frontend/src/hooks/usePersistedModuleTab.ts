import { useCallback } from "react";
import { create } from "zustand";

interface ModuleTabState {
  byModule: Record<string, string>;
  setTab: (moduleKey: string, tab: string) => void;
}

const useModuleTabStore = create<ModuleTabState>((set) => ({
  byModule: {},
  setTab: (moduleKey, tab) =>
    set((state) => ({
      byModule: { ...state.byModule, [moduleKey]: tab },
    })),
}));

/** 跨路由/连接切换保留模块顶栏 Tab，不因 remount 或切换资源重置。 */
export function usePersistedModuleTab<T extends string>(
  moduleKey: string,
  defaultTab: T,
  validTabs?: readonly T[],
): [T, (tab: T) => void] {
  const stored = useModuleTabStore((s) => s.byModule[moduleKey]);
  const tab =
    stored && (!validTabs || validTabs.includes(stored as T))
      ? (stored as T)
      : defaultTab;

  const setTab = useCallback(
    (next: T) => {
      useModuleTabStore.getState().setTab(moduleKey, next);
    },
    [moduleKey],
  );

  return [tab, setTab];
}
