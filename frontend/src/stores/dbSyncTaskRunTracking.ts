import { listen } from "@tauri-apps/api/event";

import type { BackgroundTaskInfo } from "./backgroundTaskStore";
import { useDbSyncTaskStore } from "./dbSyncTaskStore";

const EXECUTE_KINDS = new Set(["dbDataSyncExecute", "dbSchemaSyncExecute"]);

let initialized = false;

/** 订阅后台同步执行完成事件，更新任务执行历史。 */
export function initDbSyncTaskRunTracking() {
  if (initialized) return;
  initialized = true;

  const unsubs: Array<() => void> = [];

  listen<BackgroundTaskInfo>("bg-task-update", (event) => {
    const task = event.payload;
    if (!EXECUTE_KINDS.has(task.kind)) {
      return;
    }
    useDbSyncTaskStore.getState().updateRunByBgTaskId(task.id, {
      status: task.status,
      progress: task.progress,
      finishedAt: task.finishedAt ?? null,
      error: task.error ?? null,
    });
  })
    .then((fn) => unsubs.push(fn))
    .catch(() => {});

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      for (const fn of unsubs) fn();
    });
  }
}
