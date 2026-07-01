import { create } from "zustand";

const DEFAULT_DURATION_MS = 2400;
const EXIT_ANIMATION_MS = 280;

interface ToastState {
  message: string | null;
  visible: boolean;
  show: (message: string, duration?: number) => void;
  dismiss: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

function clearTimers() {
  if (hideTimer != null) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  if (clearTimer != null) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  visible: false,
  show: (message, duration = DEFAULT_DURATION_MS) => {
    clearTimers();
    set({ message, visible: true });
    hideTimer = setTimeout(() => {
      set({ visible: false });
      clearTimer = setTimeout(() => {
        set({ message: null });
        clearTimer = null;
      }, EXIT_ANIMATION_MS);
    }, duration);
  },
  dismiss: () => {
    clearTimers();
    set({ visible: false });
    clearTimer = setTimeout(() => {
      set({ message: null });
      clearTimer = null;
    }, EXIT_ANIMATION_MS);
  },
}));

/** 显示全局 Toast（窗口居中靠上） */
export function showToast(message: string, duration?: number) {
  useToastStore.getState().show(message, duration);
}
