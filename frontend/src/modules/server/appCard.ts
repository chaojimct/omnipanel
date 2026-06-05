import type { OnePanelInstalledApp } from "../../lib/onepanel";

export function getAppPortTags(app: OnePanelInstalledApp): string[] {
  const tags: string[] = [];
  if (app.version) tags.push(`v${app.version}`);
  if (app.httpPort) tags.push(`HTTP ${app.httpPort}`);
  if (app.httpsPort) tags.push(`HTTPS ${app.httpsPort}`);
  return tags;
}

export function getAppStatus(app: OnePanelInstalledApp): string {
  return app.status || app.appStatus || "-";
}

export function getAppDisplayName(app: OnePanelInstalledApp): string {
  return app.appName || app.name || app.appKey || "-";
}

export function getAppStatusClass(status?: string): string {
  if (!status) return "muted";
  if (status === "Running") return "success";
  if (status.includes("Err") || status.includes("Error") || status === "UnHealthy") return "danger";
  if (status === "Stopped") return "muted";
  return "warning";
}
