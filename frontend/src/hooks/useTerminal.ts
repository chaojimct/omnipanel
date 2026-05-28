import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import { useTerminalStore } from "../stores/terminalStore";

export function useTerminal(
  sessionId: string,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onTerminalReady?: (terminal: Terminal, searchAddon: SearchAddon) => void,
) {
  const termRef = useRef<Terminal | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const setTerminal = useTerminalStore((s) => s.setTerminal);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let webglAddon: WebglAddon | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let destroyed = false;

    function initTerminal() {
      if (destroyed || term) return;
      term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily:
          '"Berkeley Mono", "IBM Plex Mono", ui-monospace, "Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
        allowProposedApi: true,
        scrollback: 10000,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      const searchAddon = new SearchAddon();
      term.loadAddon(searchAddon);
      searchAddonRef.current = searchAddon;

      try {
        webglAddon = new WebglAddon();
        term.loadAddon(webglAddon);
      } catch {
        // WebGL not available, fall back to canvas renderer
      }

      term.open(container!);
      fitAddon.fit();

      resizeObserver = new ResizeObserver(() => {
        fitAddon!.fit();
      });
      resizeObserver.observe(container!);

      termRef.current = term;
      setTerminal(sessionId, term);
      term.focus();

      if (onTerminalReady && searchAddon) {
        onTerminalReady(term, searchAddon);
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!term) {
              initTerminal();
            } else {
              requestAnimationFrame(() => {
                if (destroyed) return;
                fitAddon?.fit();
                term?.focus();
              });
            }
          }
        }
      },
      { threshold: 0 },
    );
    observer.observe(container);

    return () => {
      destroyed = true;
      observer.disconnect();
      resizeObserver?.disconnect();
      webglAddon?.dispose();
      if (term) {
        term.dispose();
      }
      termRef.current = null;
      searchAddonRef.current = null;
    };
  }, [sessionId]);

  return { termRef, searchAddonRef };
}
