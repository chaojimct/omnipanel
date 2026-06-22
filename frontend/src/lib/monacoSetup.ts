/**
 * Tauri 生产包 CSP 仅允许 `default-src 'self'`，Monaco 默认从 jsDelivr CDN 加载会失败。
 * 改为使用 npm 包内资源，并通过 Vite worker 打包语法提供 editor worker。
 */
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker(_workerId: string, _label: string): Worker;
    };
  }
}

/** Monaco 内部取消异步任务时 reject 的 CancellationError（如 WordHighlighter dispose）。 */
function isMonacoCancellationError(reason: unknown): boolean {
  if (!(reason instanceof Error)) {
    return false;
  }
  return reason.name === "Canceled" && reason.message === "Canceled";
}

let monacoCancellationHandlersInstalled = false;

/** 避免切换/卸载 SQL 编辑器时在控制台出现 Uncaught (in promise) Canceled。 */
function installMonacoCancellationHandlers(): void {
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

if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };
}

loader.config({ monaco });
installMonacoCancellationHandlers();
