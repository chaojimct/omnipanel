import { TerminalTabPaneView } from "./TerminalPaneView";
import { useTerminalTabDockPane } from "./useTerminalTabDockPane";

interface TerminalTabDockPaneProps {
  tabId: string;
  isActive: boolean;
  onActivate?: () => void;
}

/** 终端模块 dock 与底部工作区镜像共用的完整面板（含 header + 终端区 + 命令输入） */
export function TerminalTabDockPane({
  tabId,
  isActive,
  onActivate,
}: TerminalTabDockPaneProps) {
  const { paneProps } = useTerminalTabDockPane(tabId, isActive, onActivate);
  if (!paneProps) return null;
  return <TerminalTabPaneView {...paneProps} />;
}
