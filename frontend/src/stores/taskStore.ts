import { create } from "zustand";
import { persist } from "zustand/middleware";
import { commands, type Task, type TaskStatus, type SaveTaskRequest } from "../ipc/bindings";
import { listen } from "@tauri-apps/api/event";

/** 任务详情面板选中状态 */
interface TaskStore {
  // ── 数据 ──────────────────────────────────────────────
  tasks: Task[];

  // ── UI 状态 ──────────────────────────────────────────
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;

  // ── 数据操作 ─────────────────────────────────────────
  loadTasks: (statusFilter?: string) => Promise<void>;
  getTask: (id: string) => Promise<Task | null>;
  saveTask: (req: SaveTaskRequest) => Promise<Task | null>;
  updateStatus: (id: string, status: TaskStatus) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;

  // ── UI 操作 ──────────────────────────────────────────
  setSelectedTaskId: (id: string | null) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // ── 数据 ─────────────────────────────────────────
      tasks: [],

      // ── UI 状态 ──────────────────────────────────────
      selectedTaskId: null,
      isLoading: false,
      error: null,

      // ── 数据操作 ─────────────────────────────────────

      loadTasks: async (statusFilter?: string) => {
        set({ isLoading: true, error: null });
        try {
          const res = await commands.taskList(statusFilter ?? null, 200);
          if (res.status === "ok") {
            set({ tasks: res.data, isLoading: false });
          } else {
            set({ error: res.error.message, isLoading: false });
          }
        } catch (e) {
          set({ error: String(e), isLoading: false });
        }
      },

      getTask: async (id: string) => {
        try {
          const res = await commands.taskGet(id);
          if (res.status === "ok") {
            // 更新本地缓存中的该任务
            set((state) => ({
              tasks: state.tasks.map((t) => (t.id === id ? res.data : t)),
            }));
            return res.data;
          }
          set({ error: res.error.message });
          return null;
        } catch (e) {
          set({ error: String(e) });
          return null;
        }
      },

      saveTask: async (req: SaveTaskRequest) => {
        try {
          const res = await commands.taskSave(req);
          if (res.status === "ok") {
            // 刷新列表
            await get().loadTasks();
            return res.data;
          }
          set({ error: res.error.message });
          return null;
        } catch (e) {
          set({ error: String(e) });
          return null;
        }
      },

      updateStatus: async (id: string, status: TaskStatus) => {
        try {
          const res = await commands.taskUpdateStatus(id, status);
          if (res.status === "ok") {
            // 乐观更新本地状态
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      status,
                      started_at: status === "running" ? Date.now() : t.started_at,
                      finished_at:
                        ["completed", "failed", "cancelled"].includes(status)
                          ? Date.now()
                          : t.finished_at,
                    }
                  : t
              ),
            }));
          } else {
            set({ error: res.error.message });
          }
        } catch (e) {
          set({ error: String(e) });
        }
      },

      deleteTask: async (id: string) => {
        try {
          const res = await commands.taskDelete(id);
          if (res.status === "ok") {
            set((state) => ({
              tasks: state.tasks.filter((t) => t.id !== id),
              selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
            }));
          } else {
            set({ error: res.error.message });
          }
        } catch (e) {
          set({ error: String(e) });
        }
      },

      clearCompleted: async () => {
        const completed = get().tasks.filter((t) =>
          ["completed", "cancelled"].includes(t.status)
        );
        // 逐个删除已完成/已取消的任务
        for (const task of completed) {
          await get().deleteTask(task.id);
        }
      },

      // ── UI 操作 ──────────────────────────────────────

      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "omnipanel-task-store",
      partialize: (state) => ({
        selectedTaskId: state.selectedTaskId,
      }),
    }
  )
);

// ─── action-progress 事件监听 ─────────────────────────
// 后端执行引擎的实时输出仍通过 action-progress 事件流式回传，
// 这里监听并追加到对应任务的 output 字段（内存态）。
let taskListenerInited = false;

interface ActionProgressEvent {
  actionId: string;
  stream: "stdout" | "stderr" | "status";
  chunk: string;
  status?: "running" | "completed" | "failed" | null;
  exitCode?: number | null;
}

export function initTaskProgressListener() {
  if (taskListenerInited) return;
  taskListenerInited = true;
  void listen<ActionProgressEvent>("action-progress", (event) => {
    const p = event.payload;
    if (p.stream === "status") {
      // 状态变更时刷新对应任务
      if (p.status === "completed" || p.status === "failed") {
        useTaskStore.getState().loadTasks();
      }
      return;
    }
    if (!p.chunk) return;
    // 追加输出到本地内存缓存
    const prefix = p.stream === "stderr" ? "[stderr] " : "";
    useTaskStore.setState((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === p.actionId
          ? { ...t, output: t.output + prefix + p.chunk }
          : t
      ),
    }));
  }).catch(() => {
    // 非 Tauri 环境忽略
  });
}
