import { create } from "zustand";

interface SettingsUiState {
  open: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
}

export const useSettingsUiStore = create<SettingsUiState>((set) => ({
  open: false,
  openSettings: () => set({ open: true }),
  closeSettings: () => set({ open: false }),
  toggleSettings: () => set((s) => ({ open: !s.open })),
}));
