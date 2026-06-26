const indexCache = new Map<string, unknown>();

export function invalidateSessionHistoryIndex(sessionId: string): void {
  indexCache.delete(sessionId);
}

export function getSessionHistoryIndexCache<T>(
  sessionId: string,
): { blockKey: string; readlineRef: string[]; entries: T } | undefined {
  return indexCache.get(sessionId) as { blockKey: string; readlineRef: string[]; entries: T } | undefined;
}

export function setSessionHistoryIndexCache<T>(
  sessionId: string,
  value: { blockKey: string; readlineRef: string[]; entries: T },
): void {
  indexCache.set(sessionId, value);
}
