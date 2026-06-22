/** Monaco 内部取消异步任务时 reject 的 CancellationError（如 WordHighlighter dispose）。 */
export function isMonacoCancellationError(reason: unknown): boolean {
  if (reason instanceof Error) {
    return reason.name === "Canceled" || reason.message === "Canceled";
  }
  if (typeof reason === "string") {
    return reason === "Canceled";
  }
  if (reason && typeof reason === "object") {
    const value = reason as { name?: unknown; message?: unknown };
    return value.name === "Canceled" || value.message === "Canceled";
  }
  return false;
}

let monacoCancellationHandlersInstalled = false;

/** 忽略 Monaco 编辑器 dispose 时的 Canceled rejection。 */
export function installMonacoCancellationHandlers(): void {
  if (monacoCancellationHandlersInstalled) {
    return;
  }
  monacoCancellationHandlersInstalled = true;

  window.addEventListener("unhandledrejection", (event) => {
    if (isMonacoCancellationError(event.reason)) {
      event.preventDefault();
    }
  });
}
