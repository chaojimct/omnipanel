import type { MouseEvent, PointerEvent } from "react";
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

let runtime: DockTabHeaderRuntime | null = null;

export function registerDockTabHeaderRuntime(next: DockTabHeaderRuntime): void {
  runtime = next;
}

export function getDockTabHeaderRuntime(): DockTabHeaderRuntime | null {
  return runtime;
}
