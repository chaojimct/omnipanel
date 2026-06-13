/** 终端面板命令发送器（按 tabId 索引，模块内与底部工作区镜像共享） */
export const terminalPaneSenders: Record<string, (cmd: string) => void> = {};

export function setTerminalPaneSender(
  tabId: string,
  sender: ((cmd: string) => void) | null,
): void {
  if (sender) {
    terminalPaneSenders[tabId] = sender;
  } else {
    delete terminalPaneSenders[tabId];
  }
}

export function clearTerminalPaneSender(tabId: string): void {
  delete terminalPaneSenders[tabId];
}
