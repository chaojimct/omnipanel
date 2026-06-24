import {
  useSettingsStore,
  type WorkspaceAddPanelModifier,
} from "../stores/settingsStore";
import { isMacOS, isModKeyPressed, modKeyLabel } from "./platform";

export function getWorkspaceAddPanelModifier(): WorkspaceAddPanelModifier {
  return useSettingsStore.getState().workspaceAddPanelModifier;
}

/** 设置页与提示文案中展示的修饰键标签 */
export function workspaceAddPanelModifierLabel(
  modifier: WorkspaceAddPanelModifier = getWorkspaceAddPanelModifier(),
): string {
  switch (modifier) {
    case "Alt":
      return "Alt";
    case "Mod":
      return modKeyLabel();
    case "Shift":
      return "Shift";
  }
}

/** 指针/点击事件：是否按住「加入工作区」修饰键 */
export function isPointerCopyModifier(e: {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}): boolean {
  const modifier = getWorkspaceAddPanelModifier();
  switch (modifier) {
    case "Alt":
      return Boolean(e.altKey);
    case "Mod":
      return isMacOS() ? Boolean(e.metaKey) : Boolean(e.ctrlKey);
    case "Shift":
      return Boolean(e.shiftKey);
  }
}

/** 键盘事件：配置的加入工作区修饰键是否按下 */
export function isWorkspaceAddPanelModifierHeld(e: KeyboardEvent): boolean {
  const modifier = getWorkspaceAddPanelModifier();
  switch (modifier) {
    case "Alt":
      return e.altKey;
    case "Mod":
      return isModKeyPressed(e);
    case "Shift":
      return e.shiftKey;
  }
}
