import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { DockableWorkspace } from "./DockableWorkspace";
import type { DockableTab } from "./dockableTab";
import type { DockTabIconKind } from "./DockTabIcon";

export interface ModuleSegmentTab {
  id: string;
  label: string;
  icon?: DockTabIconKind;
  tooltip?: string;
}

export interface ModuleSegmentDockProps {
  tabs: ModuleSegmentTab[];
  activeTabId: string;
  onActiveTabChange: (tabId: string) => void;
  renderPanel: (tabId: string) => ReactNode;
  className?: string;
  /** 为 false 时不显示 tab 栏，仅渲染当前 activeTabId 对应面板 */
  enabled?: boolean;
  /** 是否在 tab 栏嵌入窗口控制按钮；默认 true */
  windowControl?: boolean;
}

const EMPTY_LAYOUT = null;

/**
 * 模块级分段 Tab（原 topbar segment 模式）→ DockableWorkspace + windowControl。
 * 不持久化布局；Tab 不可关闭。
 */
export function ModuleSegmentDock({
  tabs,
  activeTabId,
  onActiveTabChange,
  renderPanel,
  className,
  enabled = true,
  windowControl = true,
}: ModuleSegmentDockProps) {
  const layoutRef = useRef(EMPTY_LAYOUT);
  const noopClose = useCallback(() => {}, []);

  const dockTabs = useMemo(
    (): DockableTab[] =>
      tabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        panelType: "module-segment",
        closable: false,
        icon: tab.icon,
        tooltip: tab.tooltip ?? tab.label,
      })),
    [tabs],
  );

  if (!enabled) {
    return <>{renderPanel(activeTabId)}</>;
  }

  return (
    <DockableWorkspace
      className={className ? `module-segment-dock ${className}` : "module-segment-dock"}
      tabs={dockTabs}
      activeTabId={activeTabId}
      onActiveTabChange={onActiveTabChange}
      onCloseTab={noopClose}
      savedLayout={layoutRef.current}
      onSavedLayoutChange={() => {}}
      enableTabGroups={false}
      windowControl={windowControl}
      renderPanel={renderPanel}
    />
  );
}
