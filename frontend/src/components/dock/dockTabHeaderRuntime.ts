import { createContext, useContext, type MouseEvent, type PointerEvent } from "react";
import type { DockableTab } from "./dockableTab";

export interface DockTabHeaderRuntime {
  tabsRef: { current: DockableTab[] };
  tabStyleRef: { current: "default" | "topbar" };
  onTabContextMenuRef: {
    current:
      | ((event: MouseEvent, tabId: string, index: number) => void)
      | undefined;
  };
  onCtrlCopyTabRef: { current: ((tabId: string) => void) | undefined };
}

export const DockTabHeaderRuntimeContext = createContext<DockTabHeaderRuntime | null>(
  null,
);

export function useDockTabHeaderRuntime(): DockTabHeaderRuntime | null {
  return useContext(DockTabHeaderRuntimeContext);
}
