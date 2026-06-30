import { createContext, useContext } from "react";

export type TerminalSessionsChromeState = {
  /** 左侧会话侧栏是否已折叠（宽度趋近 0） */
  sidebarCollapsed: boolean;
  /** 左栏模式：会话树 / SSH 管理 */
  leftPanelMode: "sessions" | "ssh";
};

const TerminalSessionsChromeContext = createContext<TerminalSessionsChromeState>({
  sidebarCollapsed: false,
  leftPanelMode: "sessions",
});

export function useTerminalSessionsChrome(): TerminalSessionsChromeState {
  return useContext(TerminalSessionsChromeContext);
}

export const TerminalSessionsChromeProvider = TerminalSessionsChromeContext.Provider;
