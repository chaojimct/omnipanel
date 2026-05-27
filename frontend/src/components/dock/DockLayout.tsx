import { Group } from "react-resizable-panels";

type DockLayoutProps = {
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  className?: string;
};

export function DockLayout({ children, direction = "horizontal", className }: DockLayoutProps) {
  return (
    <Group
      orientation={direction}
      className={`dock-layout${className ? ` ${className}` : ""}`}
    >
      {children}
    </Group>
  );
}
