import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { commands } from "../../ipc/bindings";

const isTauriRuntime =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
  return arr;
}

/**
 * 容器交互终端：在容器内启动 exec 会话（仅本地 Engine），输出复用 `terminal-output` 事件。
 * 组件卸载时关闭后端会话。
 */
export function DockerExecTerminal({
  connectionId,
  containerId,
}: {
  connectionId: string;
  containerId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!isTauriRuntime) {
      el.innerHTML = '<div style="padding:12px;color:var(--muted);font-size:12px">容器终端需要在桌面应用中使用。</div>';
      return;
    }

    let destroyed = false;
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let sessionId: string | null = null;
    let unlistenOutput: UnlistenFn | null = null;
    let unlistenEvent: UnlistenFn | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const encoder = new TextEncoder();

    term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
      theme: { background: "#1a1717", foreground: "#f4f1ed", cursor: "#f4f1ed" },
      scrollback: 5000,
    });
    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(el);
    fitAddon.fit();
    term.writeln("\x1b[90m正在进入容器…\x1b[0m");

    const start = async () => {
      unlistenOutput = await listen<{ session_id: string; data: string }>(
        "terminal-output",
        (ev) => {
          if (destroyed || ev.payload.session_id !== sessionId) return;
          term?.write(decodeBase64(ev.payload.data));
        }
      );
      unlistenEvent = await listen<{ session_id: string; event: string }>(
        "terminal-event",
        (ev) => {
          if (destroyed || ev.payload.session_id !== sessionId) return;
          if (ev.payload.event === "exited") {
            term?.writeln("\r\n\x1b[33m[会话已结束]\x1b[0m");
          }
        }
      );

      const res = await commands.dockerCreateExecSession(
        connectionId,
        containerId,
        null,
        term!.cols,
        term!.rows
      );
      if (res.status === "ok") {
        if (destroyed) {
          void commands.dockerExecClose(res.data);
          return;
        }
        sessionId = res.data;
        term?.reset();
        term?.focus();
      } else {
        term?.writeln(`\r\n\x1b[31m无法进入容器：${res.error.message}\x1b[0m`);
      }
    };

    void start();

    const dataDisposable = term.onData((data) => {
      if (!sessionId) return;
      void commands.dockerExecWrite(sessionId, Array.from(encoder.encode(data)));
    });

    resizeObserver = new ResizeObserver(() => {
      if (!fitAddon || !term) return;
      fitAddon.fit();
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (destroyed || !sessionId || !term) return;
        void commands.dockerExecResize(sessionId, term.cols, term.rows);
      }, 120);
    });
    resizeObserver.observe(el);

    return () => {
      destroyed = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      dataDisposable.dispose();
      resizeObserver?.disconnect();
      unlistenOutput?.();
      unlistenEvent?.();
      if (sessionId) void commands.dockerExecClose(sessionId);
      term?.dispose();
    };
  }, [connectionId, containerId]);

  return <div ref={containerRef} className="docker-exec-term" />;
}
