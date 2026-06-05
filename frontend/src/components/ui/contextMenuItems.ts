import type { ContextMenuItem } from "./ContextMenu";

export type TabCloseAction = "close" | "closeLeft" | "closeRight" | "closeOthers" | "closeAll";

type Translate = (key: string) => string;

/** 顶栏 / 工作区标签页通用的关闭类右键菜单项 */
export function buildTabCloseMenuItems(
  t: Translate,
  tabCount: number,
  tabIndex: number,
  onAction: (action: TabCloseAction) => void,
): ContextMenuItem[] {
  return [
    {
      id: "tab-close",
      label: t("shell.topbar.closeCurrent"),
      onClick: () => onAction("close"),
    },
    { id: "tab-sep-1", separator: true, label: "" },
    {
      id: "tab-close-left",
      label: t("shell.topbar.closeLeft"),
      disabled: tabIndex <= 0,
      onClick: () => onAction("closeLeft"),
    },
    {
      id: "tab-close-right",
      label: t("shell.topbar.closeRight"),
      disabled: tabIndex >= tabCount - 1,
      onClick: () => onAction("closeRight"),
    },
    { id: "tab-sep-2", separator: true, label: "" },
    {
      id: "tab-close-others",
      label: t("shell.topbar.closeOthers"),
      disabled: tabCount <= 1,
      onClick: () => onAction("closeOthers"),
    },
    {
      id: "tab-close-all",
      label: t("shell.topbar.closeAll"),
      disabled: tabCount <= 0,
      onClick: () => onAction("closeAll"),
    },
  ];
}
