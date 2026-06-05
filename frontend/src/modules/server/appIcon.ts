import { normalizeOnePanelBaseUrl, type OnePanelInstalledApp } from "../../lib/onepanel";

export function resolveWebsiteFavicon(website?: string): string | null {
  if (!website?.trim()) return null;
  try {
    return new URL("/favicon.ico", website.trim()).href;
  } catch {
    return null;
  }
}

/** 图标 API 不可用时的兜底：列表 icon 字段 → 官网 favicon。 */
export function resolveFallbackAppIconUrl(baseUrl: string, app: OnePanelInstalledApp): string | null {
  const icon = app.icon?.trim();
  if (icon) {
    if (/^https?:\/\//i.test(icon)) return icon;
    const origin = normalizeOnePanelBaseUrl(baseUrl);
    return icon.startsWith("/") ? `${origin}${icon}` : `${origin}/${icon}`;
  }
  return resolveWebsiteFavicon(app.app?.website);
}
