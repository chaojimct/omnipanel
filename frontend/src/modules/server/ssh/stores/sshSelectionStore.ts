import { create } from "zustand";

type SshSelectionState = {
  selectionMode: boolean;
  selectedIds: string[];
  setSelectionMode: (on: boolean) => void;
  toggleHost: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
};

export const useSshSelectionStore = create<SshSelectionState>((set, get) => ({
  selectionMode: false,
  selectedIds: [],
  setSelectionMode: (on) =>
    set({
      selectionMode: on,
      selectedIds: on ? get().selectedIds : [],
    }),
  toggleHost: (id) =>
    set((state) => {
      const has = state.selectedIds.includes(id);
      const selectedIds = has
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id];
      return { selectedIds, selectionMode: selectedIds.length > 0 || state.selectionMode };
    }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  selectAll: (ids) => set({ selectedIds: ids, selectionMode: true }),
  clearSelection: () => set({ selectedIds: [], selectionMode: false }),
}));
