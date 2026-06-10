import { useEffect } from "react";
import type { WorkspaceResource } from "../../../../lib/resourceRegistry";
import { SplitTerminalWorkspace } from "../../../../components/terminal/split-workspace";
import { getBlueprint } from "../../../terminal/sessionBlueprints";
import { useSshTerminalWorkspace } from "../hooks/useSshTerminalWorkspace";
import { useSshDetailNavigationStore } from "../../../../stores/sshDetailNavigationStore";

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

type Props = {
  resource: WorkspaceResource | null;
  /** 离开「终端」子 Tab 时暂停 xterm 渲染，保留 SSH 会话 */
  active?: boolean;
};

export function SshTerminalWorkspace({ resource, active = true }: Props) {
  const {
    layout,
    activePaneId,
    workspacePanes,
    handlePaneSenderChange,
    handleCommand,
    handleActivatePane,
    handleSplitPane,
    handleClosePane,
    hasPaneSender,
  } = useSshTerminalWorkspace(resource, active);

  const pendingTerminal = useSshDetailNavigationStore((s) => s.pendingTerminal);
  const consumeTerminalCommand = useSshDetailNavigationStore((s) => s.consumeTerminalCommand);

  useEffect(() => {
    if (!active || !pendingTerminal || !activePaneId || !resource?.id) return;
    if (pendingTerminal.resourceId !== resource.id) return;

    let cancelled = false;
    let attempts = 0;
    const timer = window.setInterval(() => {
      if (cancelled) return;
      attempts += 1;
      if (!hasPaneSender(activePaneId)) {
        if (attempts >= 50) {
          window.clearInterval(timer);
        }
        return;
      }
      const pending = consumeTerminalCommand(resource.id);
      if (pending) {
        handleCommand(`${pending.command}\n`, activePaneId);
      }
      window.clearInterval(timer);
    }, 100);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    active,
    pendingTerminal,
    activePaneId,
    resource?.id,
    hasPaneSender,
    handleCommand,
    consumeTerminalCommand,
  ]);

  if (!resource) {
    return (
      <div className="ssh-terminal-panel">
        <div className="ssh-terminal-empty">请从左侧列表选择一台主机</div>
      </div>
    );
  }

  if (!active) {
    return (
      <div className="ssh-terminal-panel">
        <div className="ssh-terminal-empty">切换到终端页签后将建立 SSH 连接</div>
      </div>
    );
  }

  if (!isTauriRuntime) {
    return (
      <div className="ssh-terminal-panel">
        <div className="ssh-terminal-empty">
          请在 Tauri 桌面应用中运行以连接真实 SSH 终端（
          <code>npm run tauri dev</code>）
        </div>
      </div>
    );
  }

  return (
    <SplitTerminalWorkspace
      panes={workspacePanes}
      layout={layout}
      activePaneId={activePaneId}
      interactionActive={active}
      getResource={() => resource}
      paneStartup={(pane) => getBlueprint(resource, pane).startup}
      onActivatePane={handleActivatePane}
      onSendCommand={handleCommand}
      onSenderChange={handlePaneSenderChange}
      onSplitPane={handleSplitPane}
      onClosePane={handleClosePane}
      className="ssh-terminal-panel ssh-terminal-workspace"
      dockClassName="term-split-dock ssh-term-split-dock"
      empty={
        <div className="ssh-terminal-panel">
          <div className="ssh-terminal-empty">正在初始化终端…</div>
        </div>
      }
    />
  );
}
