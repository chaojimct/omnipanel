import type { OnePanelInstalledApp } from "../../../lib/onepanel";

/** 1Panel 应用 Compose 文件路径（用于日志接口）。 */
export function getAppComposePath(app: OnePanelInstalledApp): string | null {
  if (!app.path?.trim()) return null;
  return `${app.path.replace(/\/+$/, "")}/docker-compose.yml`;
}
