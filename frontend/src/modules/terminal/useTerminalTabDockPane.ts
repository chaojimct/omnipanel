import { useCallback, useMemo } from "react";
import {
  resolveResourceById,
} from "../../stores/connectionStore";
import { useTerminalStore } from "../../stores/terminalStore";
import { useI18n } from "../../i18n";
import { requestTerminalExecution } from "./executeTerminalCommand";
import { registerUserShellCommand } from "./postShellAiTrigger";
import { LOCAL_TERMINAL_RESOURCE_ID } from "./paneResource";
import {
  setTerminalPaneSender,
} from "./terminalPaneSenders";

export function useTerminalTabDockPane(
  tabId: string,
  isActive: boolean,
  onActivate?: () => void,
) {
  const { t } = useI18n();
  const tabs = useTerminalStore((state) => state.tabs);

  const tab = useMemo(
    () => tabs.find((item) => item.id === tabId) ?? null,
    [tabs, tabId],
  );
  const resource = useMemo(
    () => resolveResourceById(tab?.session.resourceId ?? null) ?? null,
    [tab?.session.resourceId],
  );

  const handleSenderChange = useCallback(
    (sessionId: string, sender: ((cmd: string) => void) | null) => {
      setTerminalPaneSender(sessionId, sender);
    },
    [],
  );

  const handleSendCommand = useCallback(
    (command: string) => {
      if (!tab) return;
      registerUserShellCommand(tabId, command);
      const targetResource =
        resolveResourceById(tab.session.resourceId) ??
        resolveResourceById(LOCAL_TERMINAL_RESOURCE_ID);
      requestTerminalExecution({
        tabId,
        command,
        resourceId: targetResource?.id ?? tab.session.resourceId,
        source: "用户",
        title: t("terminal.actions.command"),
        description: `${tab.title} · ${command}`,
      });
    },
    [tab, tabId, t],
  );

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
        }
      : null,
  };
}
