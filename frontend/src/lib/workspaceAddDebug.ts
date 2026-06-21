const PREFIX = "[workspace-add]";

/**
 * 工作区「Ctrl+添加面板」调试开关。
 * - 开发环境默认开启
 * - 生产环境：localStorage.setItem("omnipanel:debug:workspace-add", "1")
 */
export function isWorkspaceAddDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem("omnipanel:debug:workspace-add") === "1";
  } catch {
    return false;
  }
}

export function workspaceAddDebug(
  step: string,
  detail?: Record<string, unknown> | string | number | boolean | null,
): void {
  if (!isWorkspaceAddDebugEnabled()) return;
  if (detail === undefined) {
    console.info(PREFIX, step);
  } else {
    console.info(PREFIX, step, detail);
  }
}
