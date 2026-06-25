import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 进程列表可配置列 ID */
export type ProcessColumnId =
  | "user"
  | "pid"
  | "ports"
  | "cpu"
  | "gpu"
  | "mem"
  | "vsz"
  | "rss"
  | "stat"
  | "start"
  | "time"
  | "command";

export const ALL_PROCESS_COLUMNS: ProcessColumnId[] = [
  "user",
  "pid",
  "ports",
  "cpu",
  "gpu",
  "mem",
  "vsz",
  "rss",
  "stat",
  "start",
  "time",
  "command",
];

export const DEFAULT_VISIBLE_COLUMNS: ProcessColumnId[] = [
  "user",
  "pid",
  "ports",
  "cpu",
  "gpu",
  "mem",
  "command",
];

/** 至少保留 PID 或命令列之一 */
const REQUIRED_ONE_OF: ProcessColumnId[] = ["pid", "command"];

function normalizeColumns(cols: ProcessColumnId[]): ProcessColumnId[] {
  const valid = cols.filter((c) => ALL_PROCESS_COLUMNS.includes(c));
  if (valid.length === 0) return [...DEFAULT_VISIBLE_COLUMNS];
  const hasRequired = REQUIRED_ONE_OF.some((c) => valid.includes(c));
  if (!hasRequired) {
    return [...valid, "pid"];
  }
  return valid;
}

type ProcessListColumnsState = {
  visibleColumns: ProcessColumnId[];
  toggleColumn: (id: ProcessColumnId) => void;
  setVisibleColumns: (cols: ProcessColumnId[]) => void;
  resetColumns: () => void;
};

export const useProcessListColumnsStore = create<ProcessListColumnsState>()(
  persist(
    (set, get) => ({
      visibleColumns: [...DEFAULT_VISIBLE_COLUMNS],
      toggleColumn: (id) => {
        const current = get().visibleColumns;
        const next = current.includes(id)
          ? current.filter((c) => c !== id)
          : [...current, id];
        set({ visibleColumns: normalizeColumns(next) });
      },
      setVisibleColumns: (cols) => set({ visibleColumns: normalizeColumns(cols) }),
      resetColumns: () => set({ visibleColumns: [...DEFAULT_VISIBLE_COLUMNS] }),
    }),
    {
      name: "omnipanel.processList.columns",
      version: 1,
    },
  ),
);
