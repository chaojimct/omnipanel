/** dockview tab group 上用于识别面板类型的 componentParams 键 */
export const PANEL_TYPE_PARAM = "panelType";

/** 已知模块面板类型常量 */
export const DOCK_PANEL_TYPES = {
  terminal: "terminal",
  database: "database",
  welcome: "welcome",
} as const;

export type DockPanelType = string;

export interface TabGroupMeta {
  label: string;
  color: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  terminal: "blue",
  database: "green",
  welcome: "grey",
  ssh: "cyan",
  docker: "orange",
};

const DEFAULT_LABELS: Record<string, string> = {
  terminal: "终端",
  database: "数据库",
  welcome: "欢迎",
  ssh: "SSH",
  docker: "Docker",
  unknown: "其他",
};

export function getTabGroupMeta(
  panelType: string,
  resolve?: (panelType: string) => Partial<TabGroupMeta> | undefined,
): TabGroupMeta {
  const custom = resolve?.(panelType);
  return {
    label: custom?.label ?? DEFAULT_LABELS[panelType] ?? panelType,
    color: custom?.color ?? DEFAULT_COLORS[panelType] ?? "grey",
  };
}
