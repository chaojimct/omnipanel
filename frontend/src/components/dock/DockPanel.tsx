import { Panel } from "react-resizable-panels";
import type { PanelProps } from "react-resizable-panels";

interface DockPanelProps {
  children: React.ReactNode;
  defaultSize?: PanelProps["defaultSize"];
  minSize?: PanelProps["minSize"];
  maxSize?: PanelProps["maxSize"];
  collapsible?: boolean;
  className?: string;
}

export function DockPanel({
  children,
  defaultSize,
  minSize,
  maxSize,
  collapsible,
  className,
}: DockPanelProps) {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible={collapsible}
      className={`dock-panel${className ? ` ${className}` : ""}`}
    >
      {children}
    </Panel>
  );
}
