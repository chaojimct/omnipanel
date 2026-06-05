import { useEffect } from "react";
import { isModKeyPressed } from "../lib/platform";
import { useAiStore } from "../stores/aiStore";

export function isAiDrawerShortcut(e: KeyboardEvent): boolean {
  if (e.type !== "keydown") return false;
  if (!isModKeyPressed(e) || e.shiftKey || e.altKey) return false;
  return e.code === "KeyL" || e.key === "l" || e.key === "L";
}

/** 处理 Cmd/Ctrl+L，返回是否已消费该按键 */
export function triggerAiDrawerToggle(e: KeyboardEvent): boolean {
  if (!isAiDrawerShortcut(e)) return false;
  e.preventDefault();
  e.stopPropagation();
  useAiStore.getState().toggleDrawer();
  return true;
}

/** 全局 Cmd/Ctrl+L 切换 AI 子窗口（捕获阶段，优先于 xterm 等） */
export function useAiDrawerShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      triggerAiDrawerToggle(e);
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, []);
}
