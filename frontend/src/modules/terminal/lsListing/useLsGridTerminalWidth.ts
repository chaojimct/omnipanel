import { useEffect, useRef, useState } from "react";
import {
  LS_GRID_TERMINAL_WIDTH_FALLBACK,
  pxToTerminalColumns,
} from "./layoutLsGrid";

/** 监听列表容器宽度，换算为终端字符列数 */
export function useLsGridTerminalWidth(enabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [widthCh, setWidthCh] = useState(LS_GRID_TERMINAL_WIDTH_FALLBACK);

  useEffect(() => {
    if (!enabled) return;
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const next = pxToTerminalColumns(element, element.clientWidth);
      setWidthCh((prev) => (prev === next ? prev : next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return { containerRef, widthCh };
}
