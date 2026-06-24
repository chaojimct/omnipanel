/** macOS / iOS 类平台（修饰键为 ⌘） */
export function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

/** 当前平台的主修饰键是否按下：macOS 为 Cmd，其它为 Ctrl */
export function isModKeyPressed(e: KeyboardEvent): boolean {
  return isMacOS() ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
}

export {
  isPointerCopyModifier,
  isWorkspaceAddPanelModifierHeld,
  workspaceAddPanelModifierLabel,
} from "./workspaceAddPanelModifier";

/** 修饰键展示标签：macOS 为 ⌘，其它为 Ctrl */
export function modKeyLabel(): string {
  return isMacOS() ? "⌘" : "Ctrl";
}

/** 格式化带主修饰键的快捷键，如 L → ⌘L / Ctrl+L */
export function formatModShortcut(key: string): string {
  return isMacOS() ? `${modKeyLabel()}${key}` : `Ctrl+${key}`;
}
