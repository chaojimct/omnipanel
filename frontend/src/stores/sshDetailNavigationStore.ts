import { create } from "zustand";
import { pathToRemoteDir, shellCdCommand } from "../modules/server/ssh/utils/parseCommandPaths";
import type { DetailTab } from "../modules/server/ssh/types";

type PendingSftp = {
  resourceId: string;
  path: string;
  nonce: number;
};

type PendingTerminal = {
  resourceId: string;
  command: string;
  nonce: number;
};

type SshDetailNavigationState = {
  pendingSftp: PendingSftp | null;
  pendingTerminal: PendingTerminal | null;
  requestSftp: (resourceId: string, path: string) => void;
  requestTerminal: (resourceId: string, path: string) => void;
  consumeSftpPath: (resourceId: string) => PendingSftp | null;
  consumeTerminalCommand: (resourceId: string) => PendingTerminal | null;
};

export const useSshDetailNavigationStore = create<SshDetailNavigationState>((set, get) => ({
  pendingSftp: null,
  pendingTerminal: null,
  requestSftp: (resourceId, path) => {
    set({
      pendingSftp: {
        resourceId,
        path: pathToRemoteDir(path),
        nonce: Date.now(),
      },
    });
  },
  requestTerminal: (resourceId, path) => {
    set({
      pendingTerminal: {
        resourceId,
        command: shellCdCommand(pathToRemoteDir(path)),
        nonce: Date.now(),
      },
    });
  },
  consumeSftpPath: (resourceId) => {
    const pending = get().pendingSftp;
    if (!pending || pending.resourceId !== resourceId) return null;
    set({ pendingSftp: null });
    return pending;
  },
  consumeTerminalCommand: (resourceId) => {
    const pending = get().pendingTerminal;
    if (!pending || pending.resourceId !== resourceId) return null;
    set({ pendingTerminal: null });
    return pending;
  },
}));

/** 跳转到 SFTP / 终端 Tab 并打开指定路径 */
export function navigateToSftpPath(
  resourceId: string,
  path: string,
  setDetailTab: (tab: DetailTab) => void,
) {
  useSshDetailNavigationStore.getState().requestSftp(resourceId, path);
  setDetailTab("sftp");
}

export function navigateToTerminalPath(
  resourceId: string,
  path: string,
  setDetailTab: (tab: DetailTab) => void,
) {
  useSshDetailNavigationStore.getState().requestTerminal(resourceId, path);
  setDetailTab("terminal");
}
