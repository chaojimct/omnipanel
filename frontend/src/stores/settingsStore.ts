import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "zh-CN" | "en-US";
export type UiDensity = "compact" | "standard" | "comfortable";
export type Theme = "system" | "light" | "dark";

/** 界面全局缩放（百分比），适用于 Tauri WebView（html zoom） */
export const UI_SCALE = {
  min: 80,
  max: 150,
  default: 100,
  step: 5,
} as const;

interface SettingsState {
  locale: Locale;
  uiDensity: UiDensity;
  uiScale: number;
  theme: Theme;
  resolved: "light" | "dark";
  setLocale: (locale: Locale) => void;
  setUiDensity: (density: UiDensity) => void;
  setUiScale: (percent: number) => void;
  setTheme: (theme: Theme) => void;
}

export function clampUiScale(percent: number): number {
  const stepped = Math.round(percent / UI_SCALE.step) * UI_SCALE.step;
  return Math.min(UI_SCALE.max, Math.max(UI_SCALE.min, stepped));
}

function applyDocumentUiScale(percent: number) {
  const scale = clampUiScale(percent) / 100;
  document.documentElement.style.setProperty("--ui-scale", String(scale));
  document.documentElement.setAttribute("data-ui-scale", String(clampUiScale(percent)));
  document.documentElement.style.zoom = String(scale);
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyDocumentTheme(theme: Theme): "light" | "dark" {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "zh-CN",
      uiDensity: "standard",
      uiScale: UI_SCALE.default,
      theme: "system",
      resolved: resolveTheme("system"),
      setLocale: (locale) => {
        applyDocumentLocale(locale);
        set({ locale });
      },
      setUiDensity: (uiDensity) => set({ uiDensity }),
      setUiScale: (percent) => {
        const uiScale = clampUiScale(percent);
        applyDocumentUiScale(uiScale);
        set({ uiScale });
      },
      setTheme: (theme) => {
        const resolved = applyDocumentTheme(theme);
        set({ theme, resolved });
      },
    }),
    {
      name: "omnipanel-settings",
      // resolved 为派生态（依赖系统主题），不持久化
      partialize: (state) => ({
        locale: state.locale,
        uiDensity: state.uiDensity,
        uiScale: state.uiScale,
        theme: state.theme,
      }),
      onRehydrateStorage: () => (state) => {
        applyDocumentLocale(state?.locale ?? "zh-CN");
        applyDocumentUiScale(state?.uiScale ?? UI_SCALE.default);
        const resolved = applyDocumentTheme(state?.theme ?? "system");
        useSettingsStore.setState({ resolved });
      },
    }
  )
);

applyDocumentLocale(useSettingsStore.getState().locale);
applyDocumentUiScale(useSettingsStore.getState().uiScale);

/** 应用启动时调用：应用当前语言与主题，并监听系统主题变化。 */
export function initSettings() {
  const state = useSettingsStore.getState();
  applyDocumentLocale(state.locale);
  applyDocumentUiScale(state.uiScale);
  applyDocumentTheme(state.theme);

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (useSettingsStore.getState().theme === "system") {
      useSettingsStore.setState({ resolved: applyDocumentTheme("system") });
    }
  });
}

export const LOCALE_OPTIONS: { value: Locale; labelKey: "settings.language.zhCN" | "settings.language.enUS" }[] = [
  { value: "zh-CN", labelKey: "settings.language.zhCN" },
  { value: "en-US", labelKey: "settings.language.enUS" },
];
