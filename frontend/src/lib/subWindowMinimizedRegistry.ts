export interface MinimizedSubWindowEntry {
  id: string;
  title: string;
  onRestore: () => void;
  onClose: () => void;
}

const entries = new Map<string, MinimizedSubWindowEntry>();
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function registerMinimizedSubWindow(entry: MinimizedSubWindowEntry): void {
  entries.set(entry.id, entry);
  emitChange();
}

export function unregisterMinimizedSubWindow(id: string): void {
  if (!entries.delete(id)) return;
  emitChange();
}

export function getMinimizedSubWindows(): MinimizedSubWindowEntry[] {
  return Array.from(entries.values());
}

export function subscribeMinimizedSubWindows(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
