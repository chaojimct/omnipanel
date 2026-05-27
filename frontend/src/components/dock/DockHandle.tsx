import { Separator } from "react-resizable-panels";

interface DockHandleProps {
  direction?: "horizontal" | "vertical";
}

export function DockHandle({ direction = "horizontal" }: DockHandleProps) {
  return (
    <Separator className={`dock-handle dock-handle--${direction}`}>
      <div className="dock-handle-inner" />
    </Separator>
  );
}
