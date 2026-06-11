import { create } from "zustand";

/** 全局底部状态栏临时提示（模块背景任务等）。 */
interface StatusBarState {
  hint: string | null;
  setHint: (hint: string | null) => void;
}

export const useStatusBarStore = create<StatusBarState>((set) => ({
  hint: null,
  setHint: (hint) => set({ hint }),
}));
