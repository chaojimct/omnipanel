import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { MODULE_PATHS } from "../../../../lib/paths";
import { useWorkspaceStore } from "../../../../stores/workspaceStore";
import { useTerminalStore } from "../../../../stores/terminalStore";
import { useTerminalLeftPanelStore } from "../../../terminal/terminalLeftPanelStore";
import { SERVER_PATH } from "../../panel/constants";
import type { LaunchPreset } from "../types";
import type { SshHostContext } from "./useSshHostContext";

const DOCKER_ACTIVE_KEY = "omnipanel.docker.activeConnectionId";

export function useSshHostActions(
  resource: WorkspaceResource | null,
  context: Pick<SshHostContext, "dockerConnection" | "panelConnection">,
  options?: {
    onOpenTunnels?: () => void;
  },
) {
  const navigate = useNavigate();
  const location = useLocation();
  const focusSessions = useTerminalLeftPanelStore((s) => s.focusSessions);
  const selectResource = useWorkspaceStore((s) => s.selectResource);
  const setActivePath = useWorkspaceStore((s) => s.setActivePath);
  const addTab = useTerminalStore((s) => s.addTab);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const openOrFocusSshTab = useTerminalStore((s) => s.openOrFocusSshTab);

  const openTerminal = useCallback(() => {
    if (!resource) return;
    const tabId = openOrFocusSshTab(resource.id, resource.name);
    setActiveTab(tabId);
    setActivePath(MODULE_PATHS.terminal);
    focusSessions();
    if (location.pathname !== MODULE_PATHS.terminal) {
      navigate(MODULE_PATHS.terminal);
    }
  }, [focusSessions, location.pathname, navigate, openOrFocusSshTab, resource, setActivePath, setActiveTab]);

  const openTerminalWithPreset = useCallback(
    (preset: LaunchPreset) => {
      if (!resource) return;
      const tabId = `ssh-${resource.id}-${Date.now()}`;
      addTab({
        id: tabId,
        title: `${resource.name} · ${preset.title}`,
        session: {
          type: "remote",
          resourceId: resource.id,
          shellLabel: "SSH",
          cwd: "~/",
          purpose: preset.purpose,
          commandPack: preset.commands,
        },
      });
      setActiveTab(tabId);
      setActivePath(MODULE_PATHS.terminal);
      focusSessions();
      if (location.pathname !== MODULE_PATHS.terminal) {
        navigate(MODULE_PATHS.terminal);
      }
    },
    [addTab, focusSessions, location.pathname, navigate, resource, setActivePath, setActiveTab],
  );

  const openSftp = useCallback(() => {
    if (!resource) return;
    navigate(MODULE_PATHS.files, {
      state: { openSftpForSshId: resource.id, openSftpHostName: resource.name },
    });
  }, [navigate, resource]);

  const openDocker = useCallback(() => {
    const conn = context.dockerConnection;
    if (conn) {
      try {
        localStorage.setItem(DOCKER_ACTIVE_KEY, conn.connectionId);
      } catch {
        // ignore
      }
      navigate(MODULE_PATHS.docker, {
        state: { selectDockerConnectionId: conn.connectionId },
      });
      return;
    }
    setActivePath(MODULE_PATHS.docker);
    navigate(MODULE_PATHS.docker);
  }, [context.dockerConnection, navigate, setActivePath]);

  const openPanel = useCallback(() => {
    const panel = context.panelConnection;
    if (!panel) return;
    selectResource(panel.id, SERVER_PATH);
    setActivePath(MODULE_PATHS.server);
    navigate(MODULE_PATHS.server);
  }, [context.panelConnection, navigate, selectResource, setActivePath]);

  const openTunnels = useCallback(() => {
    options?.onOpenTunnels?.();
  }, [options]);

  return {
    openTerminal,
    openTerminalWithPreset,
    openSftp,
    openDocker,
    openPanel,
    openTunnels,
    hasDocker: Boolean(context.dockerConnection),
    hasPanel: Boolean(context.panelConnection),
  };
}
