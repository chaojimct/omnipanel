import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "omnipanel-workspace-preview-collapse";

interface WorkspacePreviewCollapseState {
  /** 底部预览栏是否展开 */
  isOpen: boolean;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  setIsOpen: (open: boolean) => void;
}

function readPersistedIsOpen(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { state?: { isOpen?: boolean } };
    return typeof parsed?.state?.isOpen === "boolean" ? parsed.state.isOpen : true;
  } catch {
    return true;
  }
}

export const useWorkspacePreviewCollapseStore = create<WorkspacePreviewCollapseState>()(
  persist(
    (set) => ({
      isOpen: readPersistedIsOpen(),
      expand: () => set({ isOpen: true }),
      collapse: () => set({ isOpen: false }),
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      setIsOpen: (open) => set({ isOpen: open }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ isOpen: state.isOpen }),
      // 同步读取初始值；跳过异步 rehydrate，避免快捷键切换后被旧状态覆盖
      skipHydration: true,
    },
  ),
);
