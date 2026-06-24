import { useEffect, useState } from "react";

import { isWorkspaceAddPanelModifierHeld } from "../lib/workspaceAddPanelModifier";
import { useSettingsStore } from "../stores/settingsStore";

/** 跟踪「加入工作区」修饰键是否按下（随设置变化；窗口失焦时重置） */
export function useCtrlKeyHeld(): boolean {
  const modifier = useSettingsStore((state) => state.workspaceAddPanelModifier);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const syncHeld = (e: KeyboardEvent) => {
      setHeld(isWorkspaceAddPanelModifierHeld(e));
    };
    const onBlur = () => setHeld(false);

    window.addEventListener("keydown", syncHeld);
    window.addEventListener("keyup", syncHeld);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", syncHeld);
      window.removeEventListener("keyup", syncHeld);
      window.removeEventListener("blur", onBlur);
    };
  }, [modifier]);

  return held;
}
