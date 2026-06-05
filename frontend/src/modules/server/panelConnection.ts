import type { Connection } from "../../ipc/bindings";
import type { ServerEntry } from "./CreateServerDialog";

export interface PanelConfig {
  address: string;
  key: string;
  serviceType: "bt" | "1panel";
}

export function normalizeServerGroup(group: string | undefined): string {
  if (!group?.trim() || group === "default") {
    return "默认";
  }
  return group.trim();
}

export function connectionMatchesServerGroup(connection: Connection, groupName: string): boolean {
  return normalizeServerGroup(connection.group) === groupName;
}

export function connectionToServerEntry(connection: Connection): ServerEntry {
  let cfg: PanelConfig = { address: "", key: "", serviceType: "bt" };
  try {
    cfg = { ...cfg, ...(JSON.parse(connection.config || "{}") as Partial<PanelConfig>) };
  } catch {
    // config 非合法 JSON 时忽略
  }
  return {
    id: connection.id,
    name: connection.name,
    address: cfg.address,
    key: cfg.key,
    serviceType: cfg.serviceType,
    createdAt: connection.createdAt ?? Date.now(),
  };
}

export function serverEntryToConnection(entry: ServerEntry, group: string): Connection {
  const config: PanelConfig = {
    address: entry.address,
    key: entry.key,
    serviceType: entry.serviceType,
  };
  const now = Date.now();
  return {
    id: entry.id,
    kind: "panel",
    name: entry.name,
    group: normalizeServerGroup(group),
    envTag: "dev",
    config: JSON.stringify(config),
    createdAt: entry.createdAt ?? now,
    updatedAt: now,
  };
}
