import type { DockviewApi } from "dockview-react";
import type { DockableTab } from "./dockableTab";

export function tabParamsFromDockableTab(tab: DockableTab) {
  return {
    tabId: tab.id,
    label: tab.label,
    icon: tab.icon,
    tooltip: tab.tooltip ?? tab.label,
    status: tab.status,
  };
}

export function syncPanelTabParams(api: DockviewApi, tab: DockableTab): void {
  const panel = api.getPanel(tab.id);
  if (!panel) return;

  const params = tabParamsFromDockableTab(tab);
  const current = panel.api.getParameters() as Partial<typeof params> | undefined;
  if (
    current?.label !== params.label ||
    current?.icon !== params.icon ||
    current?.tooltip !== params.tooltip ||
    current?.status !== params.status
  ) {
    panel.api.updateParameters(params);
  }
  if (panel.api.title !== tab.label) {
    panel.api.setTitle(tab.label);
  }
}
