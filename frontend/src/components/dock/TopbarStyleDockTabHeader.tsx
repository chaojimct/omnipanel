import {
  DockviewDefaultTab,
  type IDockviewPanelHeaderProps,
} from "dockview-react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { TopbarTabDef } from "../../stores/topbarStore";

interface PanelParams {
  tabId: string;
  label?: string;
  status?: TopbarTabDef["status"];
  tooltip?: string;
}

interface TopbarStyleDockTabHeaderProps
  extends IDockviewPanelHeaderProps<PanelParams> {
  closable?: boolean;
  onContextMenu?: (event: ReactMouseEvent) => void;
}

function tabStatusClass(status?: string) {
  if (status === "connected" || status === "online") return "online";
  if (status === "connecting") return "connecting";
  if (status === "offline") return "offline";
  return "idle";
}

export function TopbarStyleDockTabHeader({
  closable = true,
  onContextMenu,
  ...props
}: TopbarStyleDockTabHeaderProps) {
  const label = props.params?.label ?? props.params?.tabId ?? props.api.id;
  const status = props.params?.status;
  const tooltip = props.params?.tooltip ?? label;

  return (
    <DockviewDefaultTab
      {...props}
      hideClose={!closable}
      onContextMenu={onContextMenu}
      title={tooltip}
    >
      <span className="dock-tab-header-inner">
        {status ? (
          <span className={`topbar-tab-dot ${tabStatusClass(status)}`} />
        ) : null}
        <span className="dock-tab-label">{label}</span>
      </span>
    </DockviewDefaultTab>
  );
}
