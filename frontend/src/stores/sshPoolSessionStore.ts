import { commands } from "../ipc/bindings";

/** 连接池会话引用计数 + 短期保活，避免切换主机时频繁握手。 */
const refs: Record<string, number> = {};
const releaseTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/** 无引用后延迟释放会话（毫秒） */
const IDLE_RELEASE_MS = 5 * 60 * 1000;

function cancelPendingRelease(resourceId: string) {
  const timer = releaseTimers[resourceId];
  if (timer) {
    clearTimeout(timer);
    delete releaseTimers[resourceId];
  }
}

export function acquireSshPoolSession(resourceId: string) {
  cancelPendingRelease(resourceId);
  refs[resourceId] = (refs[resourceId] ?? 0) + 1;
}

export function releaseSshPoolSession(resourceId: string) {
  const next = (refs[resourceId] ?? 1) - 1;
  if (next <= 0) {
    delete refs[resourceId];
    cancelPendingRelease(resourceId);
    releaseTimers[resourceId] = setTimeout(() => {
      delete releaseTimers[resourceId];
      void commands.sshPoolRelease(resourceId);
    }, IDLE_RELEASE_MS);
  } else {
    refs[resourceId] = next;
  }
}

/** 立即释放（删除主机等场景） */
export function forceReleaseSshPoolSession(resourceId: string) {
  cancelPendingRelease(resourceId);
  delete refs[resourceId];
  void commands.sshPoolRelease(resourceId);
}
