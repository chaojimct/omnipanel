import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Channel, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useTerminalStore } from "../../stores/terminalStore";
import { DockWorkspace } from "../../components/dock";
import { ResourceRail } from "../../components/workspace/ResourceRail";
import { workspaceResources, getResourceById } from "../../lib/resourceRegistry";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useActionStore } from "../../stores/actionStore";
import { useTopbarTabs } from "../../hooks/useTopbarTabs";
import { useI18n } from "../../i18n";

let tabCounter = 0;

function TerminalView({
  sessionId,
  sendRef,
}: {
  sessionId: string;
  sendRef: React.RefObject<((cmd: string) => void) | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const backendSidRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
      theme: {
        background: "#1a1717",
        foreground: "#fdfcfc",
        cursor: "#fdfcfc",
        selectionBackground: "#007aff30",
      },
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);

    // Disable direct keyboard input
    term.attachCustomKeyEventHandler(() => false);

    // Fit on resize
    const observer = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch { /* ignore */ }
    });
    observer.observe(container);

    // Delay fit slightly to ensure container is laid out
    const fitTimer = setTimeout(() => fitAddon.fit(), 50);

    termRef.current = term;

    // Create backend PTY session
    const onOutput = new Channel((data: unknown) => {
      try {
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data as number[]);
        term.write(bytes);
      } catch (e) {
        console.error("[Terminal] onOutput error:", e);
      }
    });

    invoke<string>("create_terminal", {
      cols: term.cols,
      rows: term.rows,
      onOutput,
    })
      .then((sid) => {
        backendSidRef.current = sid;
        useTerminalStore.getState().setBackendSessionId(sessionId, sid);
      })
      .catch((err) => {
        console.error("[Terminal] create_terminal failed:", err);
        term.writeln(`\r\n\x1b[31mFailed to create terminal: ${err}\x1b[0m`);
      });

    // Listen for process exit
    const unlisten = listen<{ session_id: string; event: string }>(
      "terminal-event",
      (ev) => {
        if (ev.payload.session_id === backendSidRef.current) {
          if (ev.payload.event === "exited") {
            term.writeln("\r\n\x1b[33m[Process exited]\x1b[0m");
          }
        }
      }
    );

    // Expose sendCommand via ref
    sendRef.current = async (cmd: string) => {
      term.write(`\r\n\x1b[36m${cmd}\x1b[0m\r\n`);
      if (backendSidRef.current) {
        try {
          await invoke("write_terminal", {
            id: backendSidRef.current,
            data: Array.from(new TextEncoder().encode(cmd + "\n")),
          });
        } catch (e) {
          term.writeln(`\x1b[31mFailed to send: ${e}\x1b[0m`);
        }
      }
    };

    return () => {
      clearTimeout(fitTimer);
      observer.disconnect();
      unlisten.then((fn) => fn()).catch(() => {});
      if (backendSidRef.current) {
        invoke("close_terminal", { id: backendSidRef.current }).catch(() => {});
      }
      sendRef.current = null;
      term.dispose();
      termRef.current = null;
    };
  }, [sessionId]);

  return <div ref={containerRef} className="term-xterm-wrap" />;
}

interface ChatMessage {
  role: "system" | "user" | "output";
  text: string;
}

function ChatHistory({ messages }: { messages: ChatMessage[] }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="term-chat-history">
      <div className="term-chat-header">
        <span className="term-chat-title">History</span>
      </div>
      <div className="term-chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`term-chat-msg term-chat-msg--${msg.role}`}>
            {msg.role === "user" && <span className="term-chat-prompt">&gt;</span>}
            <pre className="term-chat-text">{msg.text}</pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

function CommandInput({ onSend }: { onSend: (cmd: string) => void }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useI18n();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSend(trimmed);
        setValue("");
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSend(trimmed);
      setValue("");
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
    }
  }, [value]);

  return (
    <div className="term-cmd-input">
      <span className="term-cmd-prompt">&gt;</span>
      <textarea
        ref={textareaRef}
        className="term-cmd-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("terminal.command.placeholder")}
        rows={1}
        spellCheck={false}
      />
      <button className="btn-icon term-cmd-send" onClick={handleSubmit} title={t("terminal.command.send")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>
    </div>
  );
}

export function TerminalPanel() {
  const { t } = useI18n();
  const location = useLocation();
  const isActiveRoute = location.pathname === "/terminal";
  const tabs = useTerminalStore((s) => s.tabs);
  const activeTabId = useTerminalStore((s) => s.activeTabId);
  const addTab = useTerminalStore((s) => s.addTab);
  const removeTab = useTerminalStore((s) => s.removeTab);
  const setActiveTab = useTerminalStore((s) => s.setActiveTab);
  const activeResourceId = useWorkspaceStore((s) => s.activeResourceId);
  const activeResource = getResourceById(activeResourceId);
  const enqueueAction = useActionStore((s) => s.enqueueAction);
  const sendRef = useRef<((cmd: string) => void) | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", text: "Terminal session started. Type commands in the input box below." },
  ]);

  useEffect(() => {
    if (tabs.length === 0) {
      const id = `tab-${tabCounter++}`;
      addTab({ id, title: "local", type: "local" });
      setActiveTab(id);
    }
  }, [tabs.length, addTab, setActiveTab]);

  const handleAddTab = useCallback(() => {
    const id = `tab-${tabCounter++}`;
    addTab({ id, title: "local", type: "local" });
    setActiveTab(id);
  }, [addTab, setActiveTab]);

  const handleCloseTab = useCallback(
    (id: string) => {
      if (tabs.length <= 1) return;
      removeTab(id);
    },
    [tabs.length, removeTab]
  );

  const topbarTabs = useMemo(
    () =>
      tabs.map((tab) => ({
        id: tab.id,
        label: tab.title,
        active: tab.id === activeTabId,
        closable: tabs.length > 1,
        status: tab.status === "disconnected" ? ("offline" as const) : tab.status,
      })),
    [tabs, activeTabId]
  );

  useTopbarTabs(
    topbarTabs,
    {
      onSelect: setActiveTab,
      onClose: handleCloseTab,
      onAdd: handleAddTab,
    },
    { mode: "session", showAddTab: true, enabled: isActiveRoute }
  );

  const handleCommand = useCallback(
    (command: string) => {
      sendRef.current?.(command);
      setMessages((prev) => [...prev, { role: "user", text: command }]);
      enqueueAction({
        type: "terminal",
        title: t("terminal.actions.command"),
        description: command,
        command,
        resourceId: activeResource?.id ?? "local-terminal",
        source: "用户",
      });
    },
    [activeResource?.id, enqueueAction, t]
  );

  if (tabs.length === 0) return null;

  const activeSessionId = activeTabId ?? tabs[0].id;
  const terminalResources = workspaceResources.filter((r) => r.type === "terminal");

  return (
    <DockWorkspace
      leftPreset="default"
      left={
        <ResourceRail
          title={t("terminal.sidebar.title")}
          resources={terminalResources}
        />
      }
      main={
        <div className="term-main">
          <TerminalView sessionId={activeSessionId} sendRef={sendRef} />
          <CommandInput onSend={handleCommand} />
        </div>
      }
      right={<ChatHistory messages={messages} />}
    />
  );
}
