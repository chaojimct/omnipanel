import { useEffect } from "react";
import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { commands, type PoolStatusEvent } from "../ipc/bindings";

type SshConnectionState = {
  statusMap: Record<string, PoolStatusEvent>;
  setStatus: (ev: PoolStatusEvent) => void;
  hydrateStatuses: (events: PoolStatusEvent[]) => void;
};

export const useSshConnectionStore = create<SshConnectionState>((set) => ({
  statusMap: {},
  setStatus: (ev) =>
    set((state) => ({
      statusMap: { ...state.statusMap, [ev.resourceId]: ev },
    })),
  hydrateStatuses: (events) =>
    set((state) => {
      const next = { ...state.statusMap };
      for (const ev of events) {
        next[ev.resourceId] = ev;
      }
      return { statusMap: next };
    }),
}));

let statusSnapshotLoaded = false;
export async function loadSshPoolStatuses() {
  if (statusSnapshotLoaded) return;
  try {
    const res = await commands.sshPoolGetStatuses();
    if (res.status === "ok") {
      useSshConnectionStore.getState().hydrateStatuses(res.data);
      statusSnapshotLoaded = true;
    }
  } catch {
    // Tauri 未就绪时忽略
  }
}

let listening = false;
function ensureListener() {
  if (listening) return;
  listening = true;
  listen<PoolStatusEvent>("ssh-pool-status", (ev) => {
    useSshConnectionStore.getState().setStatus(ev.payload);
  }).catch(() => {
    listening = false;
  });
}

if (typeof window !== "undefined") {
  ensureListener();
  void loadSshPoolStatuses();
}

/** 根据 resourceId 获取主机 SSH 端口可达状态（TCP 探测，非完整登录）。
 *  返回 "online" | "connecting" | "error" | "unknown" */
export function useHostOnlineStatus(
  resourceId: string | null,
): "online" | "connecting" | "error" | "unknown" {
  const statusMap = useSshConnectionStore((s) => s.statusMap);
  useEffect(() => {
    ensureListener();
  }, []);

  if (!resourceId) return "unknown";
  const entry = statusMap[resourceId];
  if (!entry) return "unknown";
  if (entry.status === "connected") return "online";
  if (entry.status === "connecting") return "connecting";
  if (entry.status === "error" || entry.status === "disconnected") return "error";
  return "unknown";
}
