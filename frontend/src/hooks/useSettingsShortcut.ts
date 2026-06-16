import { useEffect } from "react";
import { useSettingsUiStore } from "../stores/settingsUiStore";
import { getShortcutKeys, matchesShortcut } from "../stores/shortcutsStore";

export function isOpenSettingsShortcut(e: KeyboardEvent): boolean {
  if (e.type !== "keydown") return false;
  return matchesShortcut(e, getShortcutKeys("open-settings"));
}

export function triggerOpenSettings(e: KeyboardEvent): boolean {
  if (!isOpenSettingsShortcut(e)) return false;
  e.preventDefault();
  e.stopPropagation();
  useSettingsUiStore.getState().openSettings();
  return true;
}

/** 全局 Mod+, 打开设置 SubWindow */
export function useSettingsShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      triggerOpenSettings(e);
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);
}
