import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  DockHandle,
  DockLayout,
  DockPanel,
  DockableWorkspace,
  type DockableTab,
  type SerializedDockview,
} from "@/components/dock";
import { LocalFilePanel } from "@/components/files";
import { SftpPanel } from "@/components/sftp";
import { TunnelPanel } from "@/components/tunnel";
import { WorkspaceComponent } from "@/components/workspace/WorkspaceComponent";
import { useI18n } from "@/i18n";
import { addComponentToWorkspace } from "@/lib/workspaceTabActions";
import { normalizeTerminalCwdForSftp } from "@/modules/server/ssh/utils/parseCommandPaths";
import { useSshDetailNavigationStore } from "@/stores/sshDetailNavigationStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { TerminalTabPaneView } from "./TerminalPaneView";
import { AdvanceTerminalMonitorStack } from "./AdvanceTerminalMonitorStack";
import { useTerminalTabDockPane } from "./useTerminalTabDockPane";

type LocalSidePanelId = "files" | "monitor";
type RemoteSidePanelId = "sftp" | "tunnel" | "processes";
type SidePanelId = LocalSidePanelId | RemoteSidePanelId;

type SidePanelWorkspaceSpec = {
  componentType: string;
  label: string;
  props?: Record<string, unknown>;
  snapshotId?: string;
};

export type AdvanceTerminalProps = {
  tabId: string;
  isActive: boolean;
  onActivate?: () => void;
};

export function AdvanceTerminal({ tabId, isActive, onActivate }: AdvanceTerminalProps) {
  const { t } = useI18n();
  const workspaceId = useWorkspaceStore((state) => state.workspace.id);
  const { paneProps, resource, tab } = useTerminalTabDockPane(tabId, isActive, onActivate);

  const isRemoteSsh = useMemo(
    () => tab?.session.type === "remote" && resource?.type === "ssh",
    [tab?.session.type, resource?.type],
  );
  const isLocal = tab?.session.type === "local";

  const sideTabs = useMemo((): DockableTab[] => {
    if (isLocal) {
      return [
        {
          id: "files",
          label: t("terminal.sideTabs.files"),
          panelType: "terminal-side",
          closable: false,
        },
        {
          id: "monitor",
          label: t("terminal.sideTabs.monitor"),
          panelType: "terminal-side",
          closable: false,
        },
      ];
    }
    return [
      {
        id: "sftp",
        label: t("ssh.detailTabs.sftp"),
        panelType: "terminal-side",
        closable: false,
      },
      {
        id: "tunnel",
        label: t("ssh.detailTabs.tunnels"),
        panelType: "terminal-side",
        closable: false,
      },
      {
        id: "processes",
        label: t("ssh.detailTabs.processes"),
        panelType: "terminal-side",
        closable: false,
      },
    ];
  }, [isLocal, t]);

  const resolveSidePanelSpec = useCallback(
    (sideTabId: string): SidePanelWorkspaceSpec | null => {
      const sideTab = sideTabs.find((item) => item.id === sideTabId);
      if (sideTabId === "files") {
        return {
          componentType: "files.local-panel",
          label: sideTab?.label ?? t("terminal.sideTabs.files"),
          props: {},
          snapshotId: "files.local-panel",
        };
      }
      if (sideTabId === "monitor") {
        return {
          componentType: "terminal.side.monitor-local",
          label: sideTab?.label ?? t("terminal.sideTabs.monitor"),
          snapshotId: "terminal.side.monitor-local",
        };
      }
      if (!resource?.id) return null;
      if (sideTabId === "sftp") {
        return {
          componentType: "ssh.detail.sftp",
          label: sideTab?.label ?? t("ssh.detailTabs.sftp"),
          props: { resourceId: resource.id },
          snapshotId: `ssh.detail.sftp:${resource.id}`,
        };
      }
      if (sideTabId === "tunnel") {
        return {
          componentType: "ssh.detail.tunnel",
          label: sideTab?.label ?? t("ssh.detailTabs.tunnels"),
          props: { resourceId: resource.id },
          snapshotId: `ssh.detail.tunnel:${resource.id}`,
        };
      }
      if (sideTabId === "processes") {
        return {
          componentType: "terminal.side.monitor-remote",
          label: sideTab?.label ?? t("ssh.detailTabs.processes"),
          props: { resourceId: resource.id },
          snapshotId: `terminal.side.monitor-remote:${resource.id}`,
        };
      }
      return null;
    },
    [resource?.id, sideTabs, t],
  );

  const handleSideCtrlCopyTab = useCallback(
    (sideTabId: string) => {
      const spec = resolveSidePanelSpec(sideTabId);
      if (!spec) return;
      addComponentToWorkspace(workspaceId, spec);
    },
    [resolveSidePanelSpec, workspaceId],
  );

  const defaultSideTab = isLocal ? "files" : "sftp";
  const [activeSideTab, setActiveSideTab] = useState<SidePanelId>(defaultSideTab);
  const sideLayoutRef = useRef<SerializedDockview | null>(null);
  const handleSideLayoutChange = useCallback((layout: SerializedDockview | null) => {
    sideLayoutRef.current = layout;
  }, []);

  useEffect(() => {
    if (!sideTabs.some((item) => item.id === activeSideTab)) {
      setActiveSideTab((sideTabs[0]?.id ?? defaultSideTab) as SidePanelId);
    }
  }, [activeSideTab, defaultSideTab, sideTabs]);

  const openTunnelTab = useCallback(() => {
    setActiveSideTab("tunnel");
  }, []);

  const requestSftp = useSshDetailNavigationStore((s) => s.requestSftp);
  const lastSyncedSftpCwdRef = useRef<string | null>(null);

  useEffect(() => {
    lastSyncedSftpCwdRef.current = null;
  }, [resource?.id, tabId]);

  useEffect(() => {
    if (!isRemoteSsh || !resource?.id || tab?.status !== "connected") return;
    const sftpPath = normalizeTerminalCwdForSftp(tab.session.cwd);
    if (!sftpPath) return;
    if (lastSyncedSftpCwdRef.current === sftpPath) return;
    lastSyncedSftpCwdRef.current = sftpPath;
    requestSftp(resource.id, sftpPath);
  }, [isRemoteSsh, resource?.id, tab?.status, tab?.session.cwd, requestSftp]);

  const wrapSidePanel = useCallback(
    (sideTabId: string, node: ReactNode) => {
      const spec = resolveSidePanelSpec(sideTabId);
      if (!spec) return node;
      return (
        <WorkspaceComponent
          componentType={spec.componentType}
          label={spec.label}
          props={spec.props}
          snapshotId={spec.snapshotId}
          className="advance-terminal-side-panel-root"
        >
          {node}
        </WorkspaceComponent>
      );
    },
    [resolveSidePanelSpec],
  );

  const renderSidePanel = useCallback(
    (panelId: string) => {
      if (isLocal) {
        if (panelId === "files") {
          return wrapSidePanel("files", <LocalFilePanel />);
        }
        if (panelId === "monitor") {
          return wrapSidePanel("monitor", <AdvanceTerminalMonitorStack mode="local" />);
        }
        return null;
      }
      if (!resource) return null;
      if (panelId === "sftp") {
        return wrapSidePanel("sftp", <SftpPanel resourceId={resource.id} />);
      }
      if (panelId === "tunnel") {
        return wrapSidePanel("tunnel", <TunnelPanel activeResource={resource} />);
      }
      if (panelId === "processes") {
        return wrapSidePanel(
          "processes",
          <AdvanceTerminalMonitorStack
            mode="remote"
            resourceId={resource.id}
            enableTunnels
            onOpenTunnelTab={openTunnelTab}
          />,
        );
      }
      return null;
    },
    [isLocal, openTunnelTab, resource, wrapSidePanel],
  );

  if (!paneProps) return null;

  const terminalPane = <TerminalTabPaneView {...paneProps} />;

  if (!isRemoteSsh && !isLocal) {
    return (
      <div className="advance-terminal advance-terminal--local">
        {terminalPane}
      </div>
    );
  }

  return (
    <div className="advance-terminal">
      <DockLayout direction="horizontal" className="advance-terminal-split">
        <DockPanel
          defaultSize="50%"
          minSize="40%"
          className="advance-terminal-main"
        >
          {terminalPane}
        </DockPanel>
        <DockHandle direction="horizontal" />
        <DockPanel
          defaultSize="50%"
          minSize="20%"
          maxSize="60%"
          className="advance-terminal-side"
        >
          <DockableWorkspace
            key={`${tabId}-${isLocal ? "local" : "remote"}`}
            className="advance-terminal-side-dock"
            dockScope={`terminal-side-${tabId}`}
            tabs={sideTabs}
            activeTabId={activeSideTab}
            onActiveTabChange={(id) => setActiveSideTab(id as SidePanelId)}
            onCloseTab={() => {}}
            savedLayout={sideLayoutRef.current}
            onSavedLayoutChange={handleSideLayoutChange}
            renderPanel={renderSidePanel}
            enableTabGroups={false}
            defaultHeaderPosition="right"
            disableTabsOverflowList
            scrollbars="native"
            onCtrlCopyTab={handleSideCtrlCopyTab}
          />
        </DockPanel>
      </DockLayout>
    </div>
  );
}
