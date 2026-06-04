import { create } from "zustand";

interface DbToolboxState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useDbToolboxStore = create<DbToolboxState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
