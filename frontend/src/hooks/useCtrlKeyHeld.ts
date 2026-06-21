import { useEffect, useState } from "react";

import { isModKeyPressed } from "../lib/platform";

/** 跟踪主修饰键是否按下（macOS ⌘，其它 Ctrl；窗口失焦时重置） */
export function useCtrlKeyHeld(): boolean {
  const [ctrlHeld, setCtrlHeld] = useState(false);

  useEffect(() => {
    const syncModHeld = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        setCtrlHeld(isModKeyPressed(e));
      }
    };
    const onBlur = () => setCtrlHeld(false);

    window.addEventListener("keydown", syncModHeld);
    window.addEventListener("keyup", syncModHeld);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", syncModHeld);
      window.removeEventListener("keyup", syncModHeld);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return ctrlHeld;
}
