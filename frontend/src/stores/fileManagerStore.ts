import { create } from "zustand";

export type FileTransferStatus = "running" | "done" | "error";

export type FileTransferItem = {
  id: string;
  name: string;
  progress: number;
  status: FileTransferStatus;
  error?: string;
};

type FileManagerState = {
  transfers: FileTransferItem[];
  addTransfer: (name: string) => string;
  updateTransfer: (id: string, patch: Partial<FileTransferItem>) => void;
  clearDoneTransfers: () => void;
};

export const useFileManagerStore = create<FileManagerState>((set) => ({
  transfers: [],
  addTransfer: (name) => {
    const id = `xfer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({
      transfers: [
        { id, name, progress: 0, status: "running" as const },
        ...s.transfers,
      ].slice(0, 8),
    }));
    return id;
  },
  updateTransfer: (id, patch) => {
    set((s) => ({
      transfers: s.transfers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  },
  clearDoneTransfers: () => {
    set((s) => ({
      transfers: s.transfers.filter((t) => t.status === "running"),
    }));
  },
}));
