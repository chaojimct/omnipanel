import type { DockTabIconKind } from "../../components/dock/DockTabIcon";

export const FILE_CONN_PANEL_PREFIX = "fm-conn:";

export function fileConnPanelId(connId: string): string {
  return `${FILE_CONN_PANEL_PREFIX}${connId}`;
}

export function parseFileConnPanelId(panelId: string): string | null {
  if (!panelId.startsWith(FILE_CONN_PANEL_PREFIX)) return null;
  return panelId.slice(FILE_CONN_PANEL_PREFIX.length);
}

export function fileProtocolDockIcon(protocol: string): DockTabIconKind {
  switch (protocol) {
    case "local":
      return "file-local";
    case "ftp":
      return "file-ftp";
    case "sftp":
      return "file-sftp";
    default:
      return "file-s3";
  }
}
