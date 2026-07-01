use std::collections::HashMap;
use std::future::Future;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

use omnipanel_error::{ErrorCode, OmniError};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::{AppHandle, Emitter};
use tokio::sync::{Mutex, Semaphore};
use tokio::task::JoinHandle;

/// 默认后台工作线程数：当前机器 CPU 逻辑核数，至少为 1。
pub fn default_worker_count() -> u32 {
    std::thread::available_parallelism()
        .map(|n| n.get() as u32)
        .unwrap_or(1)
        .max(1)
}

static TASK_SEQ: AtomicU64 = AtomicU64::new(0);

fn new_task_id() -> String {
    let seq = TASK_SEQ.fetch_add(1, Ordering::Relaxed);
    let ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    format!("bg-{ms:x}-{seq:x}")
}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub enum BackgroundTaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct BackgroundTaskInfo {
    pub id: String,
    pub module: String,
    pub kind: String,
    pub title: String,
    pub progress: String,
    pub status: BackgroundTaskStatus,
    pub index: u32,
    pub total: u32,
    /// 当前阶段已完成行数（数据对比时更新）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub row_completed: Option<u32>,
    /// 当前阶段总行数（数据对比时更新）。
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub row_total: Option<u32>,
    #[specta(type = f64)]
    pub started_at: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[specta(type = Option<f64>)]
    pub finished_at: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WorkerPoolSummary {
    pub worker_count: u32,
    pub active: u32,
    pub idle: u32,
}

pub struct BackgroundWorkerPool {
    worker_count: u32,
    semaphore: Arc<Semaphore>,
    tasks: Arc<Mutex<HashMap<String, BackgroundTaskInfo>>>,
    cancel_flags: Arc<Mutex<HashMap<String, Arc<AtomicBool>>>>,
    handles: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
}

impl BackgroundWorkerPool {
    pub fn new(worker_count: u32) -> Self {
        let n = worker_count.max(1) as usize;
        Self {
            worker_count: n as u32,
            semaphore: Arc::new(Semaphore::new(n)),
            tasks: Arc::new(Mutex::new(HashMap::new())),
            cancel_flags: Arc::new(Mutex::new(HashMap::new())),
            handles: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn summary(&self) -> WorkerPoolSummary {
        let tasks = self.tasks.lock().await;
        let active = tasks
            .values()
            .filter(|t| {
                matches!(
                    t.status,
                    BackgroundTaskStatus::Pending | BackgroundTaskStatus::Running
                )
            })
            .count() as u32;
        WorkerPoolSummary {
            worker_count: self.worker_count,
            active,
            idle: self.worker_count.saturating_sub(active),
        }
    }

    pub async fn list_running(&self) -> Vec<BackgroundTaskInfo> {
        let tasks = self.tasks.lock().await;
        let mut list: Vec<_> = tasks
            .values()
            .filter(|t| {
                matches!(
                    t.status,
                    BackgroundTaskStatus::Pending | BackgroundTaskStatus::Running
                )
            })
            .cloned()
            .collect();
        list.sort_by_key(|t| t.started_at);
        list
    }

    async fn emit_task(app: &AppHandle, task: &BackgroundTaskInfo) {
        let _ = app.emit("bg-task-update", task);
    }

    async fn patch_task<F>(
        tasks: &Arc<Mutex<HashMap<String, BackgroundTaskInfo>>>,
        id: &str,
        patch: F,
    ) -> Option<BackgroundTaskInfo>
    where
        F: FnOnce(&mut BackgroundTaskInfo),
    {
        let mut guard = tasks.lock().await;
        let entry = guard.get_mut(id)?;
        patch(entry);
        Some(entry.clone())
    }

    /// 提交后台任务；`work` 在独立 tokio 任务中执行，受线程池信号量限制并发。
    pub async fn spawn<F, Fut>(
        &self,
        app: AppHandle,
        module: impl Into<String>,
        kind: impl Into<String>,
        title: impl Into<String>,
        total: u32,
        work: F,
    ) -> Result<String, OmniError>
    where
        F: FnOnce(
                String,
                Arc<AtomicBool>,
                Arc<dyn Fn(String, u32, u32, Option<u32>, Option<u32>) + Send + Sync>,
            ) -> Fut
            + Send
            + 'static,
        Fut: Future<Output = Result<(), String>> + Send + 'static,
    {
        let id = new_task_id();
        let cancel_flag = Arc::new(AtomicBool::new(false));
        let task_info = BackgroundTaskInfo {
            id: id.clone(),
            module: module.into(),
            kind: kind.into(),
            title: title.into(),
            progress: String::new(),
            status: BackgroundTaskStatus::Pending,
            index: 0,
            total,
            row_completed: None,
            row_total: None,
            started_at: now_ms(),
            finished_at: None,
            error: None,
        };

        {
            let mut tasks = self.tasks.lock().await;
            tasks.insert(id.clone(), task_info.clone());
        }
        Self::emit_task(&app, &task_info).await;

        {
            let mut flags = self.cancel_flags.lock().await;
            flags.insert(id.clone(), cancel_flag.clone());
        }

        let tasks_arc = self.tasks.clone();
        let flags_arc = self.cancel_flags.clone();
        let handles_arc = self.handles.clone();
        let semaphore = self.semaphore.clone();
        let task_id = id.clone();
        let app_clone = app.clone();

        let progress_cb: Arc<dyn Fn(String, u32, u32, Option<u32>, Option<u32>) + Send + Sync> = {
            let tasks = tasks_arc.clone();
            let app = app_clone.clone();
            let tid = task_id.clone();
            Arc::new(move |progress, index, total, row_completed, row_total| {
                let tasks = tasks.clone();
                let app = app.clone();
                let tid = tid.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(updated) = Self::patch_task(&tasks, &tid, |t| {
                        t.progress = progress;
                        t.index = index;
                        t.total = total;
                        match row_completed {
                            Some(v) => t.row_completed = Some(v),
                            None => t.row_completed = None,
                        }
                        match row_total {
                            Some(v) => t.row_total = Some(v),
                            None => t.row_total = None,
                        }
                        if t.status == BackgroundTaskStatus::Pending {
                            t.status = BackgroundTaskStatus::Running;
                        }
                    })
                    .await
                    {
                        Self::emit_task(&app, &updated).await;
                    }
                });
            })
        };

        let handle = tokio::spawn(async move {
            let _permit = match semaphore.acquire_owned().await {
                Ok(p) => p,
                Err(_) => return,
            };

            if let Some(updated) = Self::patch_task(&tasks_arc, &task_id, |t| {
                t.status = BackgroundTaskStatus::Running;
            })
            .await
            {
                Self::emit_task(&app_clone, &updated).await;
            }

            let result = work(task_id.clone(), cancel_flag.clone(), progress_cb).await;

            let cancelled = cancel_flag.load(Ordering::Relaxed);
            let final_status = if cancelled {
                BackgroundTaskStatus::Cancelled
            } else {
                match &result {
                    Ok(()) => BackgroundTaskStatus::Completed,
                    Err(_) => BackgroundTaskStatus::Failed,
                }
            };

            if let Some(updated) = Self::patch_task(&tasks_arc, &task_id, |t| {
                t.status = final_status;
                t.finished_at = Some(now_ms());
                if let Err(msg) = &result {
                    t.error = Some(msg.clone());
                }
            })
            .await
            {
                Self::emit_task(&app_clone, &updated).await;
            }

            flags_arc.lock().await.remove(&task_id);
            handles_arc.lock().await.remove(&task_id);
        });

        self.handles.lock().await.insert(id.clone(), handle);
        Ok(id)
    }

    pub async fn cancel(&self, id: &str) -> Result<(), OmniError> {
        if let Some(flag) = self.cancel_flags.lock().await.get(id).cloned() {
            flag.store(true, Ordering::Relaxed);
        }
        if let Some(handle) = self.handles.lock().await.remove(id) {
            handle.abort();
        }
        if let Some(updated) = Self::patch_task(&self.tasks, id, |t| {
            if matches!(
                t.status,
                BackgroundTaskStatus::Pending | BackgroundTaskStatus::Running
            ) {
                t.status = BackgroundTaskStatus::Cancelled;
                t.finished_at = Some(now_ms());
            }
        })
        .await
        {
            // emit handled by caller if needed
            let _ = updated;
        } else {
            return Err(OmniError::new(
                ErrorCode::NotFound,
                format!("后台任务 '{id}' 不存在或已结束"),
            ));
        }
        Ok(())
    }

    pub async fn cancel_and_emit(&self, app: &AppHandle, id: &str) -> Result<(), OmniError> {
        self.cancel(id).await?;
        if let Some(task) = self.tasks.lock().await.get(id).cloned() {
            Self::emit_task(app, &task).await;
        }
        Ok(())
    }
}
