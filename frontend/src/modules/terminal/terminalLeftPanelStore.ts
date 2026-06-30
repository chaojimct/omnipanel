import { create } from "zustand";

export type TerminalLeftPanelMode = "sessions" | "ssh";

type State = {
  mode: TerminalLeftPanelMode;
  setMode: (mode: TerminalLeftPanelMode) => void;
  focusSessions: () => void;
  focusSsh: () => void;
};

/** 左栏模式仅会话内记忆，不做 persist 避免切换时 localStorage 写入卡顿 */
export const useTerminalLeftPanelStore = create<State>()((set) => ({
  mode: "sessions",
  setMode: (mode) => set({ mode }),
  focusSessions: () => set({ mode: "sessions" }),
  focusSsh: () => set({ mode: "ssh" }),
}));