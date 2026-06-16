import type { DockTabIconKind } from "./DockTabIcon";
import type { TopbarTabDef } from "../../stores/topbarStore";

export interface DockableTab {
  id: string;
  label: string;
  /** 面板类型：同模块面板共享类型，用于 tab group 折叠 */
  panelType: string;
  closable?: boolean;
  /** Tab 图标（窄侧栏仅显示图标，完整标题走 tooltip） */
  icon?: DockTabIconKind;
  /** 悬停提示；默认使用 label */
  tooltip?: string;
  /** topbar 风格 tab：连接状态点 */
  status?: TopbarTabDef["status"];
}
