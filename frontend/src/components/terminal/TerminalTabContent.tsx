import { useRef } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import { useTerminalStore } from "../../stores/terminalStore";
import { getResourceById } from "../../lib/resourceRegistry";
import { useI18n } from "../../i18n";
import type { TerminalBlock } from "../../stores/blocksStore";
import type { SearchAddon } from "@xterm/addon-search";
import type { Terminal } from "@xterm/xterm";

interface Props {
  sessionId: string;
  active: boolean;
  suspended?: boolean;
  onTerminalReady?: (terminal: Terminal, searchAddon: SearchAddon) => void;
  onCommand?: (command: string) => void;
  onBlockRightClick?: (block: TerminalBlock, position: { x: number; y: number }) => void;
}

export function TerminalTabContent({
  sessionId,
  active,
  suspended = false,
  onTerminalReady,
  onCommand,
  onBlockRightClick,
}: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(sessionId, containerRef, onTerminalReady, onCommand, onBlockRightClick, suspended);

  const tab = useTerminalStore((state) => state.tabs.find((item) => item.panes.some((pane) => pane.id === sessionId)));
  const pane = tab?.panes.find((item) => item.id === sessionId) ?? null;
  const host = pane?.type === "remote" ? getResourceById(pane.resourceId) : null;
  const env = host?.environment ?? "local";
  const hostLabel = host?.subtitle ?? t("terminal.context.localSession");

  return (
    <div className="term-pane" style={{ display: active ? "flex" : "none", flex: 1, minHeight: 0 }}>
      <div className="term-pane-header">
        <span className={`env-badge env-${env}`}>{t(`env.${env}`)}</span>
        <span className="host">{host?.name ?? t("terminal.localTab")}</span>
        {host && (
          <>
            <span className="text-muted">·</span>
            <span className="text-muted">{hostLabel}</span>
          </>
        )}
        <span style={{ marginLeft: "auto" }} className="text-muted">
          {pane?.type === "remote" ? "ssh" : "pty"}
        </span>
      </div>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          background: "#1a1717",
        }}
      />
    </div>
  );
}
