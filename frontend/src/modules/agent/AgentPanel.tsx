import { useState, useRef, useEffect, useCallback } from "react";
import { useI18n } from "../../i18n";
import { Button } from "../../components/ui/Button";
import { SidebarWorkspace } from "../../components/ui/SidebarWorkspace";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

let idCounter = 0;
function genId() {
  return `agent-${Date.now()}-${++idCounter}`;
}

export function AgentPanel() {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  const handleNewConversation = useCallback(() => {
    const id = genId();
    const conv: Conversation = { id, title: "New Chat", messages: [] };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeId || isRunning) return;

    const userMsg: Message = {
      id: genId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    const assistantMsgId = genId();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    const conv = conversations.find((c) => c.id === activeId);
    const history = [...(conv?.messages ?? []), userMsg]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length === 0 ? trimmed.slice(0, 40) : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
            }
          : c
      )
    );
    setInput("");
    setIsRunning(true);

    const updateAssistant = (updater: (msg: Message) => Message) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? updater(m) : m
                ),
              }
            : c
        )
      );
    };

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const { listen } = await import("@tauri-apps/api/event");

      let unlistenFn: (() => void) | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI 流式事件 payload 为后端动态联合类型
        unlistenFn = await listen<any>(`ai-stream-${activeId}`, (event) => {
          const evt = event.payload;
          switch (evt.type) {
            case "content_delta":
              updateAssistant((m) => ({ ...m, content: m.content + evt.text }));
              break;
            case "done":
              updateAssistant((m) => ({ ...m, isStreaming: false }));
              break;
            case "error":
              updateAssistant((m) => ({
                ...m,
                content: `${m.content}\n\n错误：${evt.message}`,
                isStreaming: false,
              }));
              break;
          }
        });

        await invoke("ai_send_message", {
          conversationId: activeId,
          content: trimmed,
          history,
        });
      } finally {
        unlistenFn?.();
      }
    } catch (err) {
      updateAssistant((m) => ({
        ...m,
        content: `发送失败：${err instanceof Error ? err.message : String(err)}`,
        isStreaming: false,
      }));
    } finally {
      setIsRunning(false);
    }
  }, [input, activeId, isRunning, conversations]);

  const handleDelete = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(conversations.find((c) => c.id !== id)?.id ?? null);
      }
    },
    [activeId, conversations]
  );

  const sidebar = (
    <aside className="proto-sidebar">
      <div className="proto-sidebar-header">
        <span className="proto-sidebar-title">{t("agent.conversations")}</span>
        <button type="button" className="proto-sidebar-new" onClick={handleNewConversation} title={t("agent.newChat")}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
            <line x1="8" y1="3" x2="8" y2="13" />
            <line x1="3" y1="8" x2="13" y2="8" />
          </svg>
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {conversations.length === 0 && (
          <div className="proto-empty">{t("agent.noConversations")}</div>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`proto-context-item${conv.id === activeId ? " is-active" : ""}`}
            onClick={() => setActiveId(conv.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {conv.title}
            </span>
            <span
              className="proto-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(conv.id);
              }}
            >
              ✕
            </span>
          </div>
        ))}
      </div>
    </aside>
  );

  return (
    <SidebarWorkspace sidebar={sidebar} className="agent-panel" sidebarSizePx={220} sidebarMinPx={180}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflow: "auto", padding: "var(--sp-3)" }}>
          {!activeConv ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--meta)" }}>
              <div style={{ fontSize: "32px", marginBottom: "var(--sp-2)" }}>🤖</div>
              <div style={{ fontSize: "13px", marginBottom: "var(--sp-1)" }}>{t("agent.title")}</div>
              <div style={{ fontSize: "12px" }}>{t("agent.description")}</div>
            </div>
          ) : activeConv.messages.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--meta)" }}>
              <div style={{ fontSize: "12px" }}>{t("agent.startPrompt")}</div>
            </div>
          ) : (
            activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: "var(--sp-2)",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "var(--sp-2) var(--sp-3)",
                    borderRadius: "var(--r-md)",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    background: msg.role === "user" ? "var(--accent)" : "var(--surface)",
                    color: msg.role === "user" ? "#fff" : "var(--fg)",
                    border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  }}
                >
                  {msg.content || (msg.isStreaming ? "..." : "")}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeConv && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "var(--sp-2) var(--sp-3)", display: "flex", gap: "var(--sp-2)" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t("agent.inputPlaceholder")}
              disabled={isRunning}
              style={{
                flex: 1,
                resize: "none",
                minHeight: "36px",
                maxHeight: "120px",
                padding: "var(--sp-2)",
                fontSize: "13px",
                background: "var(--bg-deeper)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                color: "var(--fg)",
                outline: "none",
              }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isRunning}
            >
              {isRunning ? t("agent.running") : t("agent.send")}
            </Button>
          </div>
        )}
      </div>
    </SidebarWorkspace>
  );
}
