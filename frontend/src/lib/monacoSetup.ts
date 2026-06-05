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

if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker() {
      return new editorWorker();
    },
  };
}

loader.config({ monaco });
