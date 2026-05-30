import { commands, type SshConfigEntry } from "../ipc/bindings";
import {
  type EnvironmentTag,
  type WorkspaceResource,
} from "./resourceRegistry";

export const OPENSSH_HOST_ID_PREFIX = "openssh:";

let cachedHosts: WorkspaceResource[] = [];
let cachedEntries = new Map<string, SshConfigEntry>();

export function isOpenSshHostId(id: string): boolean {
  return id.startsWith(OPENSSH_HOST_ID_PREFIX);
}

export function openSshHostAlias(id: string): string | null {
  return isOpenSshHostId(id) ? id.slice(OPENSSH_HOST_ID_PREFIX.length) : null;
}

function inferEnvironment(alias: string, hostName: string): EnvironmentTag {
  const text = `${alias} ${hostName}`.toLowerCase();
  if (text.includes("prod")) return "prod";
  if (text.includes("staging") || text.includes("stage")) return "staging";
  if (text.includes("dev") || text.includes("local")) return "dev";
  return "unknown";
}

function entryToSubtitle(entry: SshConfigEntry): string {
  const user = entry.user ?? "user";
  const port = entry.port ?? 22;
  return `${user}@${entry.hostName}:${port}`;
}

export function sshConfigEntryToResource(entry: SshConfigEntry): WorkspaceResource {
  return {
    id: `${OPENSSH_HOST_ID_PREFIX}${entry.alias}`,
    type: "ssh",
    name: entry.alias,
    subtitle: entryToSubtitle(entry),
    modulePath: "/ssh",
    environment: inferEnvironment(entry.alias, entry.hostName),
    status: "idle",
    tags: ["OpenSSH", "~/.ssh/config"],
  };
}

export function getOpenSshConfigEntry(id: string): SshConfigEntry | null {
  return cachedEntries.get(id) ?? null;
}

export function getOpenSshHostResource(id: string): WorkspaceResource | null {
  return cachedHosts.find((host) => host.id === id) ?? null;
}

export function getCachedOpenSshHosts(): WorkspaceResource[] {
  return cachedHosts;
}

/** 从 `~/.ssh/config` 拉取 Host 并写入内存缓存。 */
export async function refreshSshConfigHosts(): Promise<WorkspaceResource[]> {
  try {
    const res = await commands.sshListConfigHosts();
    if (res.status !== "ok") {
      cachedHosts = [];
      cachedEntries = new Map();
      return [];
    }
    const resources = res.data.map(sshConfigEntryToResource);
    cachedHosts = resources;
    cachedEntries = new Map(
      res.data.map((entry) => [`${OPENSSH_HOST_ID_PREFIX}${entry.alias}`, entry]),
    );
    return resources;
  } catch {
    cachedHosts = [];
    cachedEntries = new Map();
    return [];
  }
}

/** 合并已保存连接与 OpenSSH 配置主机（按名称去重，优先保留 store 条目）。 */
export function mergeSshHostResources(
  stored: WorkspaceResource[],
  fromConfig: WorkspaceResource[],
): WorkspaceResource[] {
  const names = new Set(stored.map((item) => item.name.toLowerCase()));
  const extra = fromConfig.filter((item) => !names.has(item.name.toLowerCase()));
  return [...stored, ...extra];
}
