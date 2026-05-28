import { useRef } from "react";
import { useTerminal } from "../../hooks/useTerminal";
import type { SearchAddon } from "@xterm/addon-search";
import type { Terminal } from "@xterm/xterm";

interface Props {
  sessionId: string;
  active: boolean;
  onTerminalReady?: (terminal: Terminal, searchAddon: SearchAddon) => void;
}

export function TerminalTabContent({ sessionId, active, onTerminalReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  useTerminal(sessionId, containerRef, onTerminalReady);

  return (
    <div
      ref={containerRef}
      style={{
        display: active ? "flex" : "none",
        flex: 1,
        minHeight: 0,
        background: "#1a1717",
      }}
    />
  );
}
