/** 模块 Dock 布局版本：bump 后旧布局将被清空 */
export const MODULE_LAYOUT_VERSION = 2;

const VERSION_PREFIX = "omnipanel-layout-version:";

export function readLayoutVersion(scope: string): number {
  try {
    const raw = localStorage.getItem(`${VERSION_PREFIX}${scope}`);
    if (!raw) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function writeLayoutVersion(scope: string, version = MODULE_LAYOUT_VERSION): void {
  try {
    localStorage.setItem(`${VERSION_PREFIX}${scope}`, String(version));
  } catch {
    // ignore
  }
}

/**
 * 若布局版本落后则清空指定 localStorage key 并写入新版本。
 * 用于连接级 Dock 废弃后的迁移。
 */
export function migrateLayoutStorage(scope: string, storageKeys: string[]): boolean {
  const current = readLayoutVersion(scope);
  if (current >= MODULE_LAYOUT_VERSION) return false;
  for (const key of storageKeys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  writeLayoutVersion(scope, MODULE_LAYOUT_VERSION);
  return true;
}
