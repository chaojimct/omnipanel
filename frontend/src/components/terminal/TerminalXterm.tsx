import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { createTerminal, getTerminal } from "../../services/terminalService";

interface TerminalXtermProps {
  onTitleChange?: (title: string) => void;
  className?: string;
}

export function TerminalXterm({ onTitleChange, className = "" }: TerminalXtermProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "block",
      fontSize: 13,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      lineHeight: 1.3,
      letterSpacing: 0,
      allowTransparency: true,
      theme: {
        background: "#0c0c0c",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
        selectionBackground: "#264f78",
        black: "#0c0c0c",
        red: "#f44747",
        green: "#4ec9b0",
        yellow: "#dcdcaa",
        blue: "#569cd6",
        magenta: "#c586c0",
        cyan: "#4fc1ff",
        white: "#d4d4d4",
        brightBlack: "#555555",
        brightRed: "#f44747",
        brightGreen: "#4ec9b0",
        brightYellow: "#dcdcaa",
        brightBlue: "#569cd6",
        brightMagenta: "#c586c0",
        brightCyan: "#4fc1ff",
        brightWhite: "#d4d4d4",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(container);
    fitAddon.fit();

    const doResize = () => {
      fitAddon.fit();
      if (sessionIdRef.current) {
        const { cols, rows } = term;
        const session = getTerminal(sessionIdRef.current);
        session?.resize(cols, rows);
      }
    };

    const resizeObserver = new ResizeObserver(() => doResize());
    resizeObserver.observe(container);

    if (onTitleChange) {
      term.onTitleChange((title) => onTitleChange(title));
    }

    let cancelled = false;

    createTerminal(
      (data) => {
        if (!cancelled) term.write(data);
      },
      () => {
        if (!cancelled) {
          term.write("\r\n\u001b[31m[Process exited]\u001b[0m\r\n");
        }
      },
      term.cols,
      term.rows,
    ).then((session) => {
      if (cancelled) {
        session.close();
        return;
      }
      sessionIdRef.current = session.id;

      term.onData((input) => {
        session.write(new TextEncoder().encode(input));
      });
    });

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      term.dispose();
      if (sessionIdRef.current) {
        const session = getTerminal(sessionIdRef.current);
        session?.close();
      }
    };
    // onTitleChange is stable from props; include to satisfy lint
  }, [onTitleChange]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    />
  );
}
