import { create } from "zustand";

export type ServerViewTab = "panel" | "terminal";

interface ServerViewState {
  viewTab: ServerViewTab;
  setViewTab: (tab: ServerViewTab) => void;
}

export const useServerViewStore = create<ServerViewState>((set) => ({
  viewTab: "panel",
  setViewTab: (viewTab) => set({ viewTab }),
}));
