import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { useI18n } from "../../i18n";
import { resolveResourceById } from "../../stores/connectionStore";
import type { TopbarTabDef } from "../../stores/topbarStore";
import {
  useTerminalStore,
  type TerminalSession,
} from "../../stores/terminalStore";
import type { TerminalConnectionStatus } from "../../stores/terminalTypes";
import { resolveSessionActivityAt } from "../../stores/terminalSessionActivity";
import { useBlocksStore, type TerminalBlock } from "../../stores/blocksStore";
import { Button } from "../../components/ui/Button";
import { ModuleDockTitle } from "../../components/dock/ModuleDockTitle";
import {
  mergeConnectionOrder,
  moveConnectionInOrder,
  readConnectionOrder,
  sortConnectionGroups,
  writeConnectionOrder,
} from "./terminalConnectionOrder";

const EXPANDED_STORAGE_KEY = "omnipanel-terminal-session-tree-expanded";
const CONNECTION_DRAG_MIME = "application/x-omnipanel-terminal-connection";

function isConnectionDrag(event: DragEvent): boolean {
  const types = event.dataTransfer.types;
  return types.includes(CONNECTION_DRAG_MIME) || types.includes("text/plain");
}

function readDraggedConnectionId(event: DragEvent): string {
  return event.dataTransfer.getData(CONNECTION_DRAG_MIME) || event.dataTransfer.getData("text/plain");
}

type ConnectionGroup = {
  resourceId: string;
  name: string;
  sessions: TerminalSession[];
};

function readExpandedMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(EXPANDED_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeExpandedMap(map: Record<string, boolean>): void {
  localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(map));
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d`;
  return `${Math.floor(diff / 2_592_000_000)}mo`;
}

function resolveActiveSessionId(
  activeSessionId: string | null,
  activeTabId: string | null,
  tabs: Array<{ id: string; sessionId: string }>,
): string | null {
  if (activeSessionId) return activeSessionId;
  const tab = tabs.find((item) => item.id === activeTabId);
  return tab?.sessionId ?? activeTabId;
}

function connectionStatusToTopbarStatus(
  status: TerminalConnectionStatus,
): TopbarTabDef["status"] {
  if (status === "connected") return "connected";
  if (status === "connecting") return "connecting";
  if (status === "disconnected") return "offline";
  return "idle";
}

function sessionStatusDotClass(status: TopbarTabDef["status"]): string {
  if (status === "connected" || status === "online") return "online";
  if (status === "connecting") return "connecting";
  if (status === "offline") return "offline";
  return "idle";
}

function resolveSessionConnectionStatus(
  sessionId: string,
  tabs: Array<{ sessionId: string; status: TerminalConnectionStatus }>,
  detachedRuntime: Record<string, { status: TerminalConnectionStatus }>,
): TopbarTabDef["status"] {
  const tab = tabs.find((item) => item.sessionId === sessionId);
  if (tab) return connectionStatusToTopbarStatus(tab.status);
  const detached = detachedRuntime[sessionId];
  if (detached) return connectionStatusToTopbarStatus(detached.status);
  return "idle";
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14" aria-hidden>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" aria-hidden>
      <circle cx="9" cy="7" r="1.2" />
      <circle cx="15" cy="7" r="1.2" />
      <circle cx="9" cy="12" r="1.2" />
      <circle cx="15" cy="12" r="1.2" />
      <circle cx="9" cy="17" r="1.2" />
      <circle cx="15" cy="17" r="1.2" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="12"
      height="12"
      aria-hidden
      className={`term-session-tree__chevron${expanded ? " is-expanded" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function SessionRow({
  session,
  activityAt,
  isActive,
  status,
  onSelect,
  onEnd,
}: {
  session: TerminalSession;
  activityAt: number;
  isActive: boolean;
  status: TopbarTabDef["status"];
  onSelect: () => void;
  onEnd: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className={`term-session-tree__session${isActive ? " is-active" : ""}`}>
      <button type="button" className="term-session-tree__session-btn" onClick={onSelect}>
        <span
          className={`topbar-tab-dot ${sessionStatusDotClass(status)}`}
          aria-hidden
        />
        <span className="term-session-tree__session-title">{session.title}</span>
        <span className="term-session-tree__session-time">
          {formatRelativeTime(activityAt)}
        </span>
      </button>
      <button
        type="button"
        className="term-session-tree__session-end drag-ignore"
        title={t("terminal.sessions.end")}
        onClick={(e) => {
          e.stopPropagation();
          onEnd();
        }}
      >
        ×
      </button>
    </div>
  );
}

function ConnectionGroupBlock({
  group,
  blocksBySession,
  expanded,
  activeSessionId,
  sessionStatusById,
  dropHint,
  onToggle,
  onSelectSession,
  onCreateSession,
  onEndSession,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: {
  group: ConnectionGroup;
  blocksBySession: Record<string, TerminalBlock[]>;
  expanded: boolean;
  activeSessionId: string | null;
  sessionStatusById: Map<string, TopbarTabDef["status"]>;
  dropHint: "before" | "after" | null;
  onToggle: () => void;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (resourceId: string, title: string) => void;
  onEndSession: (sessionId: string) => void;
  onDragStart: (event: DragEvent<HTMLSpanElement>, resourceId: string) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, resourceId: string) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, resourceId: string) => void;
  onDragEnd: () => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className={`term-session-tree__group${dropHint === "before" ? " is-drop-before" : ""}${dropHint === "after" ? " is-drop-after" : ""}`}
      onDragOver={(event) => onDragOver(event, group.resourceId)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, group.resourceId)}
    >
      <div className="term-session-tree__connection">
        <span
          className="term-session-tree__drag-handle"
          draggable
          title={t("terminal.sessions.reorderConnection")}
          onDragStart={(event) => onDragStart(event, group.resourceId)}
          onDragEnd={onDragEnd}
        >
          <GripIcon />
        </span>
        <button
          type="button"
          className="term-session-tree__connection-toggle drag-ignore"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <ChevronIcon expanded={expanded} />
        </button>
        <button type="button" className="term-session-tree__connection-main drag-ignore" onClick={onToggle}>
          <span className="term-session-tree__folder" aria-hidden>
            <FolderIcon />
          </span>
          <span className="term-session-tree__connection-name">{group.name}</span>
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="term-session-tree__connection-add drag-ignore"
          title={t("terminal.sessions.newUnderConnection")}
          onClick={() => onCreateSession(group.resourceId, group.name)}
        >
          +
        </Button>
      </div>
      {expanded ? (
        <div className="term-session-tree__sessions">
          {group.sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              activityAt={resolveSessionActivityAt(session, blocksBySession)}
              isActive={activeSessionId === session.id}
              status={sessionStatusById.get(session.id) ?? "idle"}
              onSelect={() => onSelectSession(session.id)}
              onEnd={() => onEndSession(session.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export interface TerminalSessionSidebarProps {
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (resourceId: string, title: string) => void;
  onEndSession: (sessionId: string) => void;
}

export function TerminalSessionSidebar({
  onSelectSession,
  onCreateSession,
  onEndSession,
}: TerminalSessionSidebarProps) {
  const { t } = useI18n();
  const sessions = useTerminalStore((s) => s.sessions);
  const activeSessionId = useTerminalStore((s) => s.activeSessionId);
  const activeTabId = useTerminalStore((s) => s.activeTabId);
  const tabs = useTerminalStore((s) => s.tabs);
  const detachedRuntime = useTerminalStore((s) => s.detachedRuntime);
  const blocksBySession = useBlocksStore((s) => s.blocks);

  const sessionStatusById = useMemo(() => {
    const map = new Map<string, TopbarTabDef["status"]>();
    for (const session of sessions) {
      if (session.lifecycle === "ended") continue;
      map.set(
        session.id,
        resolveSessionConnectionStatus(session.id, tabs, detachedRuntime),
      );
    }
    return map;
  }, [detachedRuntime, sessions, tabs]);

  const resolvedActiveSessionId = useMemo(
    () => resolveActiveSessionId(activeSessionId, activeTabId, tabs),
    [activeSessionId, activeTabId, tabs],
  );

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(readExpandedMap);
  const [connectionOrder, setConnectionOrder] = useState<string[]>(readConnectionOrder);
  const draggingResourceIdRef = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    resourceId: string;
    position: "before" | "after";
  } | null>(null);

  const connectionGroups = useMemo((): ConnectionGroup[] => {
    const map = new Map<string, TerminalSession[]>();
    for (const session of sessions) {
      if (session.lifecycle === "ended") continue;
      const resourceId = session.session.resourceId;
      const list = map.get(resourceId) ?? [];
      list.push(session);
      map.set(resourceId, list);
    }

    const groups = [...map.entries()]
      .map(([resourceId, groupSessions]) => {
        const sorted = [...groupSessions].sort(
          (a, b) =>
            resolveSessionActivityAt(b, blocksBySession) -
            resolveSessionActivityAt(a, blocksBySession),
        );
        return {
          resourceId,
          name: resolveResourceById(resourceId)?.name ?? sorted[0]?.title ?? resourceId,
          sessions: sorted,
        };
      })
      .filter((group) => group.sessions.length > 0);

    const mergedOrder = mergeConnectionOrder(
      connectionOrder,
      groups.map((group) => group.resourceId),
    );
    return sortConnectionGroups(groups, mergedOrder);
  }, [sessions, connectionOrder, blocksBySession]);

  useEffect(() => {
    const resourceIds = connectionGroups.map((group) => group.resourceId);
    if (resourceIds.length === 0) return;
    const merged = mergeConnectionOrder(connectionOrder, resourceIds);
    if (merged.join("|") !== connectionOrder.join("|")) {
      setConnectionOrder(merged);
      writeConnectionOrder(merged);
    }
  }, [connectionGroups, connectionOrder]);

  const setExpanded = useCallback((resourceId: string, expanded: boolean) => {
    setExpandedMap((prev) => {
      const next = { ...prev, [resourceId]: expanded };
      writeExpandedMap(next);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback(
    (resourceId: string) => {
      const current = expandedMap[resourceId] ?? true;
      setExpanded(resourceId, !current);
    },
    [expandedMap, setExpanded],
  );

  useEffect(() => {
    if (!resolvedActiveSessionId) return;
    const session = sessions.find((item) => item.id === resolvedActiveSessionId);
    if (session) {
      setExpanded(session.session.resourceId, true);
    }
  }, [resolvedActiveSessionId, sessions, setExpanded]);

  const handleDragStart = useCallback((event: DragEvent<HTMLSpanElement>, resourceId: string) => {
    event.stopPropagation();
    event.dataTransfer.setData(CONNECTION_DRAG_MIME, resourceId);
    event.dataTransfer.setData("text/plain", resourceId);
    event.dataTransfer.effectAllowed = "move";
    draggingResourceIdRef.current = resourceId;
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>, resourceId: string) => {
    if (!draggingResourceIdRef.current && !isConnectionDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setDropTarget({ resourceId, position });
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const related = event.relatedTarget as Node | null;
    if (!related || !event.currentTarget.contains(related)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, targetId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const sourceId = readDraggedConnectionId(event) || draggingResourceIdRef.current;
      if (!sourceId || sourceId === targetId) {
        setDropTarget(null);
        draggingResourceIdRef.current = null;
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
      const resourceIds = connectionGroups.map((group) => group.resourceId);
      const currentOrder = mergeConnectionOrder(connectionOrder, resourceIds);
      const next = moveConnectionInOrder(currentOrder, sourceId, targetId, position);
      setConnectionOrder(next);
      writeConnectionOrder(next);
      setDropTarget(null);
      draggingResourceIdRef.current = null;
    },
    [connectionGroups, connectionOrder],
  );

  const handleDragEnd = useCallback(() => {
    draggingResourceIdRef.current = null;
    setDropTarget(null);
  }, []);

  return (
    <div className="term-session-tree">
      <div className="term-session-tree__module-header">
        <ModuleDockTitle>{t("routes.terminal")}</ModuleDockTitle>
      </div>
      <div className="term-session-tree__body">
        {connectionGroups.length === 0 ? (
          <div className="term-session-tree__empty">{t("terminal.sessions.empty")}</div>
        ) : (
          connectionGroups.map((group) => (
            <ConnectionGroupBlock
              key={group.resourceId}
              group={group}
              blocksBySession={blocksBySession}
              expanded={expandedMap[group.resourceId] ?? true}
              activeSessionId={resolvedActiveSessionId}
              sessionStatusById={sessionStatusById}
              dropHint={
                dropTarget?.resourceId === group.resourceId ? dropTarget.position : null
              }
              onToggle={() => toggleExpanded(group.resourceId)}
              onSelectSession={onSelectSession}
              onCreateSession={onCreateSession}
              onEndSession={onEndSession}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}
