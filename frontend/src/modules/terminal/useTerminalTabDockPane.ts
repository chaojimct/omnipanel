import { useCallback, useEffect, useMemo, useState } from "react";
import { disposeTabBackendSessions } from "../../hooks/useTerminal";
import { clearPaneBackendPending } from "../../hooks/useTerminal";
import {
  resolveResourceById,
  useSshHostResources,
} from "../../stores/connectionStore";
import { useActionStore } from "../../stores/actionStore";
import { useTerminalStore } from "../../stores/terminalStore";
import { useI18n } from "../../i18n";
import { LOCAL_TERMINAL_RESOURCE_ID, buildSessionInfoForResource } from "./paneResource";
import {
  clearTerminalPaneSender,
  setTerminalPaneSender,
  terminalPaneSenders,
} from "./terminalPaneSenders";

export function useTerminalTabDockPane(
  tabId: string,
  isActive: boolean,
  onActivate?: () => void,
) {
  const { t } = useI18n();
  const tabs = useTerminalStore((state) => state.tabs);
  const setTabResource = useTerminalStore((state) => state.setTabResource);
  const enqueueAction = useActionStore((state) => state.enqueueAction);
  const sshHosts = useSshHostResources();

  const tab = useMemo(
    () => tabs.find((item) => item.id === tabId) ?? null,
    [tabs, tabId],
  );
  const resource = useMemo(
    () => resolveResourceById(tab?.session.resourceId ?? null) ?? null,
    [tab?.session.resourceId],
  );

  const [reconnectKey, setReconnectKey] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const paneServerOptions = useMemo(
    () => [
      {
        value: LOCAL_TERMINAL_RESOURCE_ID,
        label: t("terminal.newSession.local"),
      },
      ...sshHosts.map((host) => ({
        value: host.id,
        label: host.name,
      })),
    ],
    [sshHosts, t],
  );

  const occupiedResourceIds = useMemo(() => {
    const set = new Set<string>();
    for (const item of tabs) {
      set.add(item.session.resourceId);
    }
    return set;
  }, [tabs]);

  const handleSenderChange = useCallback(
    (sessionId: string, sender: ((cmd: string) => void) | null) => {
      setTerminalPaneSender(sessionId, sender);
    },
    [],
  );

  const handleSendCommand = useCallback(
    (command: string) => {
      terminalPaneSenders[tabId]?.(command);
      if (!tab) return;
      const targetResource =
        resolveResourceById(tab.session.resourceId) ??
        resolveResourceById(LOCAL_TERMINAL_RESOURCE_ID);
      enqueueAction({
        type: "terminal",
        title: t("terminal.actions.command"),
        description: `${tab.title} · ${command}`,
        command,
        resourceId: targetResource?.id ?? tab.session.resourceId,
        source: "用户",
      });
    },
    [enqueueAction, tab, tabId, t],
  );

  const handleTabServerChange = useCallback(
    (resourceId: string) => {
      if (resourceId === LOCAL_TERMINAL_RESOURCE_ID) {
        const current = useTerminalStore.getState().tabs.find((item) => item.id === tabId);
        if (current && current.session.resourceId === LOCAL_TERMINAL_RESOURCE_ID) {
          return;
        }
      }
      clearTerminalPaneSender(tabId);
      clearPaneBackendPending(tabId);
      disposeTabBackendSessions(tabId);
      setTabResource(tabId, buildSessionInfoForResource(resourceId));
    },
    [setTabResource, tabId],
  );

  const handleReconnect = useCallback(() => {
    clearTerminalPaneSender(tabId);
    clearPaneBackendPending(tabId);
    disposeTabBackendSessions(tabId);
    setReconnectKey((prev) => prev + 1);
    setIsReconnecting(true);
  }, [tabId]);

  useEffect(() => {
    if (!isReconnecting || !tab) return;
    if (tab.status !== "connecting") {
      setIsReconnecting(false);
    }
  }, [isReconnecting, tab?.status, tab]);

  const handleActivate = useCallback(() => {
    onActivate?.();
  }, [onActivate]);

  return {
    tab,
    resource,
    paneProps: tab
      ? {
          paneId: tab.id,
          tab,
          resource,
          isActive,
          onActivate: handleActivate,
          onSendCommand: handleSendCommand,
          onSenderChange: handleSenderChange,
          onServerChange: handleTabServerChange,
          serverOptions: paneServerOptions,
          occupiedResourceIds,
          onReconnect: handleReconnect,
          reconnectKey,
          isReconnecting,
        }
      : null,
  };
}
