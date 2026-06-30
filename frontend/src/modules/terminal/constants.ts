/** 终端 Dock 中固定的 SSH 管理 Tab（不可关闭，仅 SSH 左栏模式时出现） */
export const TERMINAL_SSH_MANAGEMENT_TAB_ID = "__terminal_ssh_management__";

export function isTerminalSshManagementTab(tabId: string): boolean {
  return tabId === TERMINAL_SSH_MANAGEMENT_TAB_ID;
}
