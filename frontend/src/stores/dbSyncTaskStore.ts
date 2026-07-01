import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { SyncTask, SyncTaskConfig, SyncTaskRunRecord, ToolboxTabId } from "../modules/database/toolbox/types";

const STORAGE_KEY = "omnipanel-db-sync-tasks.v1";
const MAX_RUNS_PER_TASK = 100;

function makeId(): string {
  return `sync-task:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export interface PendingSyncTaskLoad {
  taskId: string;
  runAfterLoad: boolean;
  nonce: number;
}

interface DbSyncTaskState {
  tasks: SyncTask[];
  runHistory: Record<string, SyncTaskRunRecord[]>;
  activeTaskId: string | null;
  pendingLoad: PendingSyncTaskLoad | null;
  addTask: (input: { name: string; kind: ToolboxTabId; config: SyncTaskConfig }) => SyncTask;
  updateTask: (id: string, patch: { name?: string; kind?: ToolboxTabId; config?: SyncTaskConfig }) => void;
  addRunRecord: (taskId: string, record: SyncTaskRunRecord) => void;
  updateRunByBgTaskId: (bgTaskId: string, patch: Partial<SyncTaskRunRecord>) => void;
  getRunsForTask: (taskId: string) => SyncTaskRunRecord[];
  deleteTask: (id: string) => void;
  setActiveTaskId: (id: string | null) => void;
  requestLoad: (taskId: string, runAfterLoad?: boolean) => void;
  clearPendingLoad: () => void;
}

export const useDbSyncTaskStore = create<DbSyncTaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      runHistory: {},
      activeTaskId: null,
      pendingLoad: null,
      addTask: ({ name, kind, config }) => {
        const now = Date.now();
        const task: SyncTask = {
          id: makeId(),
          name: name.trim(),
          kind,
          config,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          tasks: [task, ...state.tasks],
          activeTaskId: task.id,
        }));
        return task;
      },
      updateTask: (id, patch) => {
        set((state) => {
          const task = state.tasks.find((item) => item.id === id);
          if (!task) {
            return state;
          }
          const nextName = patch.name?.trim() ?? task.name;
          const nextKind = patch.kind ?? task.kind;
          const nextConfig = patch.config ?? task.config;
          if (
            nextName === task.name &&
            nextKind === task.kind &&
            JSON.stringify(nextConfig) === JSON.stringify(task.config)
          ) {
            return state;
          }
          return {
            tasks: state.tasks.map((item) =>
              item.id === id
                ? {
                    ...item,
                    name: nextName,
                    kind: nextKind,
                    config: nextConfig,
                    updatedAt: Date.now(),
                  }
                : item,
            ),
          };
        });
      },
      addRunRecord: (taskId, record) => {
        set((state) => {
          const prev = state.runHistory[taskId] ?? [];
          const next = [record, ...prev].slice(0, MAX_RUNS_PER_TASK);
          return {
            runHistory: { ...state.runHistory, [taskId]: next },
          };
        });
      },
      updateRunByBgTaskId: (bgTaskId, patch) => {
        set((state) => {
          let changed = false;
          const runHistory = { ...state.runHistory };
          for (const [taskId, runs] of Object.entries(runHistory)) {
            const index = runs.findIndex((run) => run.bgTaskId === bgTaskId);
            if (index < 0) {
              continue;
            }
            const updated = [...runs];
            updated[index] = { ...updated[index], ...patch };
            runHistory[taskId] = updated;
            changed = true;
            break;
          }
          return changed ? { runHistory } : state;
        });
      },
      getRunsForTask: (taskId) => get().runHistory[taskId] ?? [],
      deleteTask: (id) => {
        set((state) => {
          const { [id]: _removed, ...runHistory } = state.runHistory;
          return {
            tasks: state.tasks.filter((task) => task.id !== id),
            runHistory,
            activeTaskId: state.activeTaskId === id ? null : state.activeTaskId,
            pendingLoad: state.pendingLoad?.taskId === id ? null : state.pendingLoad,
          };
        });
      },
      setActiveTaskId: (activeTaskId) => set({ activeTaskId }),
      requestLoad: (taskId, runAfterLoad = false) => {
        if (!get().tasks.some((task) => task.id === taskId)) {
          return;
        }
        const pendingLoad = {
          taskId,
          runAfterLoad,
          nonce: Date.now(),
        };
        set({ pendingLoad });
      },
      clearPendingLoad: () => {
        set({ pendingLoad: null });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        runHistory: state.runHistory,
      }),
    },
  ),
);
